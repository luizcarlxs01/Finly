using Finly.Domain.Common;
using Finly.Domain.Enums;

namespace Finly.Domain.Entities;

public class Transaction : BaseEntity
{
    public Guid FinancialProfileId { get; set; }

    public string Title { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public TransactionType Type { get; set; }
    public string Category { get; set; } = string.Empty;

    public TransactionKind TransactionKind { get; set; } = TransactionKind.Single;

    public DateOnly TransactionDate { get; set; }

    public Guid? SourceId { get; set; }

    public int? InstallmentIndex { get; set; }
    public int? InstallmentCount { get; set; }

    public bool IsRecurring { get; set; }
    public DateOnly? RecurrenceStartDate { get; set; }
    public DateOnly? RecurrenceEndDate { get; set; }
    public int? RecurrenceDay { get; set; }
    public int? RecurrenceMonths { get; set; }

    public FinancialProfile FinancialProfile { get; set; } = null!;
}
