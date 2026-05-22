namespace Finly.Application.DTOs.Transactions;

public class CreateTransactionRequestDto
{
    public Guid FinancialProfileId { get; set; }
    public string Title { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
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
