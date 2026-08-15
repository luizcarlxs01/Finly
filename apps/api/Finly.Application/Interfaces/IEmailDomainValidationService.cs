namespace Finly.Application.Interfaces;

public interface IEmailDomainValidationService
{
    Task<bool> HasValidMxRecordAsync(string email, CancellationToken cancellationToken = default);
}
