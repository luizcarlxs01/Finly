using Finly.Domain.Entities;

namespace Finly.Application.Interfaces;

public interface IEmailVerificationService
{
    Task GenerateAndSendCodeAsync(User user, CancellationToken cancellationToken = default);
    Task<bool> VerifyCodeAsync(User user, string code, CancellationToken cancellationToken = default);
}
