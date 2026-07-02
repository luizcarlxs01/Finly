namespace Finly.Application.DTOs.Occurrences;

public class UpdateOccurrenceRequestDto
{
    public DateOnly DueDate { get; set; }
    public decimal Amount { get; set; }
}
