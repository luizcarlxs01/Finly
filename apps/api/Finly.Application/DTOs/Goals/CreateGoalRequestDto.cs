namespace Finly.Application.DTOs.Goals;

public class CreateGoalRequestDto
{
    public Guid FinancialProfileId { get; set; }
    public string Title { get; set; } = string.Empty;
    public decimal TargetAmount { get; set; }
    public decimal CurrentAmount { get; set; }
    public DateOnly? Deadline { get; set; }
}
