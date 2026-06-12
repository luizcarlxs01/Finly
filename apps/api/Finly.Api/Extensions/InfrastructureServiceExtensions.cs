using System.Text;
using Finly.Application.Interfaces;
using Finly.Infrastructure.Data;
using Finly.Infrastructure.Security;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace Finly.Api.Extensions;

public static class InfrastructureServiceExtensions
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration,
        IWebHostEnvironment environment)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection");

        services.AddDbContext<AppDbContext>(options =>
            options.UseSqlServer(connectionString));

        services.AddScoped<IAppDbContext>(provider => provider.GetRequiredService<AppDbContext>());
        services.AddScoped<IPasswordHasherService, PasswordHasherService>();
        services.AddScoped<ITokenService, TokenService>();

        var jwtSettingsSection = configuration.GetSection(JwtSettings.SectionName);
        services.Configure<JwtSettings>(jwtSettingsSection);

        var jwtSettings = jwtSettingsSection.Get<JwtSettings>()
                         ?? throw new InvalidOperationException("As configurações de JWT não foram encontradas.");

        if (!environment.IsDevelopment())
        {
            if (string.IsNullOrWhiteSpace(connectionString) ||
                connectionString.Contains("CHANGE_ME", StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException("A connection string de producao nao foi configurada.");
            }

            if (string.IsNullOrWhiteSpace(jwtSettings.SecretKey) ||
                jwtSettings.SecretKey.Contains("CHANGE_ME", StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException("O segredo JWT de producao nao foi configurado.");
            }
        }

        var secretKey = Encoding.UTF8.GetBytes(jwtSettings.SecretKey);

        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.RequireHttpsMetadata = !environment.IsDevelopment();
                options.SaveToken = false;

                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateIssuerSigningKey = true,
                    ValidateLifetime = true,
                    ValidIssuer = jwtSettings.Issuer,
                    ValidAudience = jwtSettings.Audience,
                    IssuerSigningKey = new SymmetricSecurityKey(secretKey),
                    ClockSkew = TimeSpan.Zero
                };
            });

        services.AddAuthorization();

        return services;
    }
}
