namespace Finly.Application.DTOs.Rules;

public class UpdateFinancialRuleRequestDto
{
    public Guid FinancialProfileId { get; set; }
    public string Title { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string RuleType { get; set; } = string.Empty;
    public string? RecurrenceMode { get; set; }
    public int DayOfMonth { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public int? TotalMonths { get; set; }
    public bool IsActive { get; set; }
}
