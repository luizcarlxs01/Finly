using Finly.Domain.Common;
using Finly.Domain.Enums;

namespace Finly.Domain.Entities;

public class FinancialRule : BaseEntity
{
    public Guid FinancialProfileId { get; set; }

    public string Title { get; set; } = string.Empty;
    public decimal Amount { get; set; }

    public RuleType RuleType { get; set; }
    public RuleRecurrenceMode? RecurrenceMode { get; set; }

    public int DayOfMonth { get; set; }

    public DateOnly StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public int? TotalMonths { get; set; }

    public bool IsActive { get; set; } = true;
    public DateOnly? LastProcessedDate { get; set; }

    public FinancialProfile FinancialProfile { get; set; } = null!;
}
