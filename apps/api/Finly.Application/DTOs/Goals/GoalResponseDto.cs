namespace Finly.Application.DTOs.Goals;

public class GoalResponseDto
{
    public Guid Id { get; set; }
    public Guid FinancialProfileId { get; set; }
    public string Title { get; set; } = string.Empty;
    public decimal TargetAmount { get; set; }
    public decimal CurrentAmount { get; set; }
    public DateOnly? Deadline { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
