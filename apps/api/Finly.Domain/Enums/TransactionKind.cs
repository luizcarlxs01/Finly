namespace Finly.Domain.Enums;

public enum TransactionKind
{
    Single = 1,
    InstallmentTemplate = 2,

    /// <summary>Deprecated: occurrences are now represented by Arrangement entities and are no longer produced.</summary>
    InstallmentInstance = 3,
    RecurringTemplate = 4,

    /// <summary>Deprecated: occurrences are now represented by Arrangement entities and are no longer produced.</summary>
    RecurringInstance = 5,

    Installment = 6,
    Recurring = 7
}
