namespace Finly.Application.DTOs.Dashboard;

public class DashboardSummaryResponseDto
{
    public Guid FinancialProfileId { get; set; }
    public string ProfileName { get; set; } = string.Empty;

    public decimal InitialBalance { get; set; }
    public decimal TotalIncome { get; set; }
    public decimal TotalExpense { get; set; }
    public decimal CurrentBalance { get; set; }

    public int TransactionCount { get; set; }
    public int GoalCount { get; set; }
    public int CompletedGoalCount { get; set; }
}
