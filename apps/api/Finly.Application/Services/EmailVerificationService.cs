using System.Security.Cryptography;
using System.Text;
using Finly.Application.Interfaces;
using Finly.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Finly.Application.Services;

public class EmailVerificationService : IEmailVerificationService
{
    private const int CodeLength = 6;
    private const int CodeExpirationMinutes = 10;
    private const int MaxAttempts = 5;

    private readonly IAppDbContext _context;
    private readonly IEmailSender _emailSender;

    public EmailVerificationService(IAppDbContext context, IEmailSender emailSender)
    {
        _context = context;
        _emailSender = emailSender;
    }

    public async Task GenerateAndSendCodeAsync(User user, CancellationToken cancellationToken = default)
    {
        var pendingCodes = await _context.EmailVerificationCodes
            .Where(x => x.UserId == user.Id && x.ConsumedAt == null)
            .ToListAsync(cancellationToken);

        foreach (var pendingCode in pendingCodes)
        {
            pendingCode.ConsumedAt = DateTime.UtcNow;
        }

        var code = GenerateNumericCode();

        var verificationCode = new EmailVerificationCode
        {
            UserId = user.Id,
            CodeHash = HashCode(code),
            ExpiresAt = DateTime.UtcNow.AddMinutes(CodeExpirationMinutes),
            AttemptCount = 0
        };

        _context.EmailVerificationCodes.Add(verificationCode);
        await _context.SaveChangesAsync(cancellationToken);

        var subject = "Seu código de verificação Finly";
        var html = $"""
            <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
                <h2 style="color: #0B275E;">Confirme seu e-mail</h2>
                <p>Use o código abaixo para confirmar sua conta no Finly. Ele expira em {CodeExpirationMinutes} minutos.</p>
                <p style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #0B275E;">{code}</p>
                <p style="color: #666; font-size: 13px;">Se você não solicitou isso, pode ignorar este e-mail.</p>
            </div>
            """;

        await _emailSender.SendAsync(user.Email, subject, html, cancellationToken);
    }

    public async Task<bool> VerifyCodeAsync(User user, string code, CancellationToken cancellationToken = default)
    {
        var verificationCode = await _context.EmailVerificationCodes
            .Where(x => x.UserId == user.Id && x.ConsumedAt == null)
            .OrderByDescending(x => x.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);

        if (verificationCode is null)
        {
            return false;
        }

        if (verificationCode.ExpiresAt < DateTime.UtcNow)
        {
            return false;
        }

        if (verificationCode.AttemptCount >= MaxAttempts)
        {
            return false;
        }

        if (verificationCode.CodeHash != HashCode(code.Trim()))
        {
            verificationCode.AttemptCount += 1;
            await _context.SaveChangesAsync(cancellationToken);
            return false;
        }

        verificationCode.ConsumedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    private static string GenerateNumericCode()
    {
        var max = (int)Math.Pow(10, CodeLength);
        var value = RandomNumberGenerator.GetInt32(0, max);
        return value.ToString(new string('0', CodeLength));
    }

    private static string HashCode(string code)
    {
        var bytes = Encoding.UTF8.GetBytes(code);
        var hash = SHA256.HashData(bytes);
        return Convert.ToHexString(hash);
    }
}
