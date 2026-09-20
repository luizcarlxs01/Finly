using System.Net.Http.Headers;
using System.Net.Http.Json;
using Finly.Application.Interfaces;
using Microsoft.Extensions.Options;

namespace Finly.Infrastructure.Email;

public class ResendEmailSender : IEmailSender
{
    private readonly HttpClient _httpClient;
    private readonly ResendSettings _settings;

    public ResendEmailSender(HttpClient httpClient, IOptions<ResendSettings> options)
    {
        _httpClient = httpClient;
        _settings = options.Value;

        _httpClient.BaseAddress ??= new Uri("https://api.resend.com/");
        _httpClient.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", _settings.ApiKey);
    }

    public async Task SendAsync(string toEmail, string subject, string htmlBody, CancellationToken cancellationToken = default)
    {
        var payload = new
        {
            from = _settings.FromEmail,
            to = new[] { toEmail },
            subject,
            html = htmlBody
        };

        var response = await _httpClient.PostAsJsonAsync("emails", payload, cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException("Não foi possível enviar o e-mail. Tente novamente em instantes.");
        }
    }
}
