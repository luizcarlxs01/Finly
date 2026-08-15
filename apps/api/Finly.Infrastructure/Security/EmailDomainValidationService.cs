using DnsClient;
using Finly.Application.Interfaces;

namespace Finly.Infrastructure.Security;

public class EmailDomainValidationService : IEmailDomainValidationService
{
    private readonly ILookupClient _lookupClient;

    public EmailDomainValidationService(ILookupClient lookupClient)
    {
        _lookupClient = lookupClient;
    }

    public async Task<bool> HasValidMxRecordAsync(string email, CancellationToken cancellationToken = default)
    {
        var atIndex = email.IndexOf('@');
        if (atIndex < 0 || atIndex == email.Length - 1)
        {
            return false;
        }

        var domain = email[(atIndex + 1)..];

        try
        {
            var result = await _lookupClient.QueryAsync(domain, QueryType.MX, cancellationToken: cancellationToken);
            return !result.HasError && result.Answers.MxRecords().Any();
        }
        catch (DnsResponseException)
        {
            return false;
        }
    }
}
