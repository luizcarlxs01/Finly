namespace Finly.Application.DTOs.Occurrences;

public class OccurrenceResponseDto
{
    public Guid Id { get; set; }
    public Guid TransactionId { get; set; }
    public int? InstallmentIndex { get; set; }
    public DateOnly DueDate { get; set; }
    public decimal Amount { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime? PaidAt { get; set; }
    public bool IsCustomized { get; set; }
    public DateTime CreatedAt { get; set; }
}
