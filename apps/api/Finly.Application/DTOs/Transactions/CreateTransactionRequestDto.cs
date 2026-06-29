using System.ComponentModel.DataAnnotations;

namespace Finly.Application.DTOs.Transactions;

public class CreateTransactionRequestDto
{
    [Required]
    public Guid FinancialProfileId { get; set; }

    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    public decimal Amount { get; set; }

    [Required]
    [MaxLength(50)]
    public string Type { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Category { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string TransactionKind { get; set; } = "Single";

    public DateOnly TransactionDate { get; set; }
    public Guid? SourceId { get; set; }
    public int? InstallmentIndex { get; set; }
    public int? InstallmentCount { get; set; }
    public bool IsRecurring { get; set; }
    public DateOnly? RecurrenceStartDate { get; set; }
    public DateOnly? RecurrenceEndDate { get; set; }
    public int? RecurrenceDay { get; set; }
    public int? RecurrenceMonths { get; set; }
}
