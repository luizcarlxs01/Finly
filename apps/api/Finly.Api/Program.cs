using System.Net;
using System.Threading.RateLimiting;
using Finly.Api.Extensions;
using Finly.Application.Services;
using Finly.Infrastructure.Data;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// Em produção a API roda atrás do Traefik, que termina o TLS e encaminha HTTP
// puro para a porta 8080 do container. Sem processar os headers encaminhados,
// o ASP.NET veria scheme=http (gerando loop de redirect no UseHttpsRedirection)
// e o IP do proxy no lugar do IP real do cliente (quebrando o rate limiting).
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders =
        ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;

    // O Traefik roda em host network e alcança o container pelo gateway da
    // rede bridge do Compose. Só confiamos nos headers vindos do range privado
    // do Docker (172.16.0.0/12) — de qualquer outra origem eles são ignorados.
    options.KnownNetworks.Add(
        new Microsoft.AspNetCore.HttpOverrides.IPNetwork(IPAddress.Parse("172.16.0.0"), 12));

    // ForwardLimit = 1 (padrão) faz o ASP.NET consumir apenas a última entrada
    // do X-Forwarded-For — a que o próprio Traefik acrescentou. Entradas que o
    // cliente tenha injetado à esquerda são descartadas.
    options.ForwardLimit = 1;
});

var allowedOrigins = builder.Configuration
    .GetSection("Cors:AllowedOrigins")
    .Get<string[]>()
    ?? [];

if (builder.Environment.IsDevelopment() && allowedOrigins.Length == 0)
{
    allowedOrigins = ["http://localhost:3000"];
}

builder.Services.AddRateLimiter(options =>
{
    // Baldes separados por IP do cliente. Depende do UseForwardedHeaders acima
    // para enxergar o IP real — sem ele, todos os usuários cairiam na partição
    // do Traefik.
    //
    // Login e registro tinham UM balde compartilhado de 5/15min. Na prática isso
    // trancava o uso legítimo: web e celular do mesmo usuário saem pelo mesmo IP
    // público, e a cota é consumida por QUALQUER request — inclusive os logins
    // bem-sucedidos, que não são ataque nenhum. Testar o app em dois dispositivos
    // estourava o limite antes de qualquer tentativa de força bruta.
    //
    // Os números continuam longe de viabilizar força bruta (10/15min = ~960
    // tentativas/dia, contra os milhões que um ataque real precisa), mas agora
    // cabem o uso normal e um IP compartilhado por NAT.
    options.AddPolicy("auth-login", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 10,
                Window = TimeSpan.FromMinutes(15),
                QueueLimit = 0,
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst
            }));

    // Registro é raro por usuário legítimo — a ameaça aqui é criação de contas
    // em massa, não adivinhação de senha. Janela mais longa, cota menor.
    options.AddPolicy("auth-register", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 5,
                Window = TimeSpan.FromMinutes(60),
                QueueLimit = 0,
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst
            }));

    options.OnRejected = async (context, cancellationToken) =>
    {
        context.HttpContext.Response.StatusCode = (int)HttpStatusCode.TooManyRequests;
        context.HttpContext.Response.ContentType = "application/json";

        // A janela varia por policy, então o texto vem do lease em vez de ser
        // fixado em "15 minutos" (que ficaria errado para o registro).
        var minutes = context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter)
            ? (int)Math.Ceiling(retryAfter.TotalMinutes)
            : 15;

        await context.HttpContext.Response.WriteAsync(
            $"{{\"message\":\"Muitas tentativas. Tente novamente em {minutes} minutos.\"}}",
            cancellationToken);
    };
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Finly API",
        Version = "v1"
    });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Informe o token JWT no formato: Bearer {seu token}"
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy
            .WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration, builder.Environment);

var app = builder.Build();

// Precisa ser o primeiro middleware do pipeline: tudo que vem depois
// (UseHttpsRedirection, rate limiter, logs) deve enxergar o scheme e o IP
// já corrigidos a partir dos headers do Traefik.
app.UseForwardedHeaders();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

using (var scope = app.Services.CreateScope())
{
    scope.ServiceProvider.GetRequiredService<AppDbContext>().Database.Migrate();
}

app.UseRouting();

app.UseCors("Frontend");

app.UseRateLimiter();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
