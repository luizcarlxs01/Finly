namespace Finly.Application.DTOs.Rules;

public class ProcessFinancialRulesResponseDto
{
    public Guid FinancialProfileId { get; set; }
    public DateOnly ReferenceDate { get; set; }
    public int ProcessedRuleCount { get; set; }
    public int CreatedTransactionCount { get; set; }
    public int SkippedTransactionCount { get; set; }
}
