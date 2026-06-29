using System.ComponentModel.DataAnnotations;

namespace Finly.Application.DTOs.Rules;

public class CreateFinancialRuleRequestDto
{
    [Required]
    public Guid FinancialProfileId { get; set; }

    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    public decimal Amount { get; set; }

    [Required]
    [MaxLength(50)]
    public string RuleType { get; set; } = string.Empty;

    [MaxLength(50)]
    public string? RecurrenceMode { get; set; }

    public int DayOfMonth { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public int? TotalMonths { get; set; }
    public bool IsActive { get; set; } = true;
}
