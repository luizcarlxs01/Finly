using Finly.Domain.Common;
using Finly.Domain.Enums;

namespace Finly.Domain.Entities;

public class Goal : BaseEntity
{
    public Guid FinancialProfileId { get; set; }

    public string Title { get; set; } = string.Empty;
    public decimal TargetAmount { get; set; }
    public decimal CurrentAmount { get; set; }
    public DateOnly? Deadline { get; set; }
    public GoalStatus Status { get; set; } = GoalStatus.Active;

    public FinancialProfile FinancialProfile { get; set; } = null!;
}
