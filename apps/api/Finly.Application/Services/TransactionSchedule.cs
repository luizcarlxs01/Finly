using Finly.Domain.Entities;
using Finly.Domain.Enums;

namespace Finly.Application.Services;

internal static class TransactionSchedule
{
    // Older transaction rows did not persist the mode. Their explicit limits
    // still define a finite schedule and must never be treated as indefinite.
    internal static RecurrenceMode ResolveMode(Transaction transaction) =>
        transaction.RecurrenceMode ??
        (transaction.RecurrenceEndDate.HasValue ? RecurrenceMode.UntilDate :
         transaction.RecurrenceMonths.HasValue ? RecurrenceMode.ForMonths : RecurrenceMode.Indefinite);

    internal static void ValidateAndNormalize(Transaction transaction)
    {
        if (transaction.TransactionDate == default)
            throw new InvalidOperationException("Informe uma data válida para a transação.");

        transaction.IsRecurring = transaction.TransactionKind == TransactionKind.Recurring;
        if (transaction.TransactionKind == TransactionKind.Installment)
        {
            ValidateCount(transaction.InstallmentCount, transaction.TransactionDate);
        }

        if (!transaction.IsRecurring)
        {
            transaction.RecurrenceMode = null;
            return;
        }

        var start = transaction.RecurrenceStartDate ?? transaction.TransactionDate;
        if (start == default)
            throw new InvalidOperationException("Informe uma data inicial válida para a recorrência.");
        if (transaction.RecurrenceDay is < 1 or > 31)
            throw new InvalidOperationException("O dia da recorrência deve estar entre 1 e 31.");

        var mode = ResolveMode(transaction);
        if (!Enum.IsDefined(mode))
            throw new InvalidOperationException("O modo de recorrência é inválido.");
        if (mode == RecurrenceMode.UntilDate &&
            (!transaction.RecurrenceEndDate.HasValue || transaction.RecurrenceEndDate.Value < start))
            throw new InvalidOperationException("A data final da recorrência deve ser igual ou posterior à data inicial.");
        if (mode == RecurrenceMode.ForMonths)
            ValidateCount(transaction.RecurrenceMonths, start);

        transaction.RecurrenceMode = mode;
    }

    private static void ValidateCount(int? count, DateOnly start)
    {
        var availableMonths = (9999 - start.Year) * 12 + 13 - start.Month;
        if (count is null or <= 0 || count > availableMonths)
            throw new InvalidOperationException("Informe uma quantidade válida e positiva de parcelas ou meses.");
    }
}
