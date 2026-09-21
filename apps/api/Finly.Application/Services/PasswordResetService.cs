using System.Security.Cryptography;
using System.Text;
using Finly.Application.Interfaces;
using Finly.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Finly.Application.Services;

public class PasswordResetService : IPasswordResetService
{
    private const int TokenExpirationMinutes = 60;

    private readonly IAppDbContext _context;
    private readonly IEmailSender _emailSender;
    private readonly IPasswordHasherService _passwordHasherService;
    private readonly IFrontendUrlProvider _frontendUrlProvider;

    public PasswordResetService(
        IAppDbContext context,
        IEmailSender emailSender,
        IPasswordHasherService passwordHasherService,
        IFrontendUrlProvider frontendUrlProvider)
    {
        _context = context;
        _emailSender = emailSender;
        _passwordHasherService = passwordHasherService;
        _frontendUrlProvider = frontendUrlProvider;
    }

    public async Task RequestResetAsync(string email, CancellationToken cancellationToken = default)
    {
        var normalizedEmail = email.Trim().ToLowerInvariant();

        var user = await _context.Users
            .FirstOrDefaultAsync(x => x.Email == normalizedEmail, cancellationToken);

        // Nunca revela se o e-mail existe ou não — sai em silêncio, sem erro,
        // pra não virar um jeito de descobrir quem tem conta no Finly.
        if (user is null)
            return;

        var pendingTokens = await _context.PasswordResetTokens
            .Where(x => x.UserId == user.Id && x.ConsumedAt == null)
            .ToListAsync(cancellationToken);

        foreach (var pendingToken in pendingTokens)
        {
            pendingToken.ConsumedAt = DateTime.UtcNow;
        }

        var rawToken = GenerateToken();

        var resetToken = new PasswordResetToken
        {
            UserId = user.Id,
            TokenHash = Hash(rawToken),
            ExpiresAt = DateTime.UtcNow.AddMinutes(TokenExpirationMinutes)
        };

        _context.PasswordResetTokens.Add(resetToken);
        await _context.SaveChangesAsync(cancellationToken);

        var link = $"{_frontendUrlProvider.BaseUrl}/redefinir-senha?token={rawToken}";
        var subject = "Redefina sua senha no Finly";
        var html = $"""
            <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
                <h2 style="color: #0B275E;">Redefinir senha</h2>
                <p>Recebemos um pedido para redefinir a senha da sua conta no Finly. O link abaixo expira em {TokenExpirationMinutes} minutos.</p>
                <p style="margin: 24px 0;">
                    <a href="{link}" style="background: #0B275E; color: #fff; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: bold;">Redefinir senha</a>
                </p>
                <p style="color: #666; font-size: 13px;">Se você não pediu isso, pode ignorar este e-mail — sua senha continua a mesma.</p>
            </div>
            """;

        await _emailSender.SendAsync(user.Email, subject, html, cancellationToken);
    }

    public async Task ResetPasswordAsync(
        string token,
        string newPassword,
        CancellationToken cancellationToken = default)
    {
        var normalizedPassword = newPassword.Trim();

        if (normalizedPassword.Length < 8)
            throw new InvalidOperationException("A senha deve ter no mínimo 8 caracteres.");

        var tokenHash = Hash(token.Trim());

        var resetToken = await _context.PasswordResetTokens
            .Include(x => x.User)
            .FirstOrDefaultAsync(x => x.TokenHash == tokenHash, cancellationToken);

        if (resetToken is null || resetToken.ConsumedAt is not null || resetToken.ExpiresAt < DateTime.UtcNow)
            throw new InvalidOperationException("Link inválido ou expirado. Solicite um novo.");

        resetToken.User.PasswordHash = _passwordHasherService.HashPassword(normalizedPassword);
        resetToken.ConsumedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
    }

    private static string GenerateToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(32);
        return Convert.ToHexString(bytes);
    }

    private static string Hash(string value)
    {
        var bytes = Encoding.UTF8.GetBytes(value);
        return Convert.ToHexString(SHA256.HashData(bytes));
    }
}
