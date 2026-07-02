using Finly.Domain.Common;
using Finly.Domain.Enums;

namespace Finly.Domain.Entities;

public class Occurrence : BaseEntity
{
    public Guid TransactionId { get; set; }

    public int? InstallmentIndex { get; set; }
    public DateOnly DueDate { get; set; }
    public decimal Amount { get; set; }
    public OccurrenceStatus Status { get; set; }
    public DateTime? PaidAt { get; set; }
    public bool IsCustomized { get; set; }

    public Transaction Transaction { get; set; } = null!;
}
