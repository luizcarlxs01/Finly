using Finly.Application.DTOs.Rules;

namespace Finly.Application.Interfaces;

public interface IFinancialRuleService
{
    Task<IReadOnlyList<FinancialRuleResponseDto>> GetAllAsync(
        Guid userId,
        Guid financialProfileId,
        CancellationToken cancellationToken = default);

    Task<FinancialRuleResponseDto?> GetByIdAsync(
        Guid userId,
        Guid ruleId,
        CancellationToken cancellationToken = default);

    Task<FinancialRuleResponseDto> CreateAsync(
        Guid userId,
        CreateFinancialRuleRequestDto request,
        CancellationToken cancellationToken = default);

    Task<FinancialRuleResponseDto> UpdateAsync(
        Guid userId,
        Guid ruleId,
        UpdateFinancialRuleRequestDto request,
        CancellationToken cancellationToken = default);

    Task DeleteAsync(
        Guid userId,
        Guid ruleId,
        CancellationToken cancellationToken = default);
}
