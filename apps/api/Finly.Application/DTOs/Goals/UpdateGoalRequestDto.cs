using System.ComponentModel.DataAnnotations;

namespace Finly.Application.DTOs.Goals;

public class UpdateGoalRequestDto
{
    [Required]
    public Guid FinancialProfileId { get; set; }

    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    public decimal TargetAmount { get; set; }
    public decimal CurrentAmount { get; set; }
    public DateOnly? Deadline { get; set; }
}
