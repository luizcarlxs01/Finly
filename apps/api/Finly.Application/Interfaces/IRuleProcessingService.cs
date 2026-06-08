using Finly.Application.DTOs.Rules;

namespace Finly.Application.Interfaces;

public interface IRuleProcessingService
{
    Task<ProcessFinancialRulesResponseDto> ProcessAsync(
        Guid userId,
        Guid financialProfileId,
        ProcessFinancialRulesRequestDto request,
        CancellationToken cancellationToken = default);
}
