using Finly.Application.Interfaces;
using Finly.Domain.Entities;
using Finly.Domain.Enums;

namespace Finly.Application.Services;

public class ArrangementGenerationService : IArrangementGenerationService
{
    public List<Arrangement> Generate(Transaction transaction)
    {
        return transaction.TransactionKind switch
        {
            TransactionKind.Installment => GenerateInstallments(transaction),
            TransactionKind.Recurring => GenerateRecurring(transaction),
            _ => GenerateSingle(transaction)
        };
    }

    private static List<Arrangement> GenerateSingle(Transaction transaction)
    {
        return new List<Arrangement>
        {
            BuildArrangement(transaction, transaction.TransactionDate, installmentIndex: null)
        };
    }

    private static List<Arrangement> GenerateInstallments(Transaction transaction)
    {
        var installmentCount = transaction.InstallmentCount ?? 1;
        var dayOfMonth = transaction.TransactionDate.Day;
        var arrangements = new List<Arrangement>();

        for (var index = 0; index < installmentCount; index++)
        {
            var dueDate = BuildOccurrenceDate(transaction.TransactionDate, dayOfMonth, index);
            arrangements.Add(BuildArrangement(transaction, dueDate, installmentIndex: index + 1));
        }

        return arrangements;
    }

    private static List<Arrangement> GenerateRecurring(Transaction transaction)
    {
        var startDate = transaction.RecurrenceStartDate ?? transaction.TransactionDate;
        var dayOfMonth = transaction.RecurrenceDay ?? startDate.Day;
        var mode = transaction.RecurrenceMode ?? InferRecurrenceMode(transaction);

        var arrangements = new List<Arrangement>();
        var monthOffset = 0;

        while (true)
        {
            var dueDate = BuildOccurrenceDate(startDate, dayOfMonth, monthOffset);

            if (mode == RecurrenceMode.UntilDate)
            {
                if (transaction.RecurrenceEndDate.HasValue && dueDate > transaction.RecurrenceEndDate.Value)
                    break;
            }
            else if (mode == RecurrenceMode.ForMonths)
            {
                if (monthOffset >= (transaction.RecurrenceMonths ?? 0))
                    break;
            }
            else
            {
                if (monthOffset >= 12)
                    break;
            }

            arrangements.Add(BuildArrangement(transaction, dueDate, installmentIndex: null));
            monthOffset++;
        }

        return arrangements;
    }

    private static RecurrenceMode InferRecurrenceMode(Transaction transaction)
    {
        if (transaction.RecurrenceEndDate.HasValue)
            return RecurrenceMode.UntilDate;

        if (transaction.RecurrenceMonths.HasValue)
            return RecurrenceMode.ForMonths;

        return RecurrenceMode.Indefinite;
    }

    private static Arrangement BuildArrangement(Transaction transaction, DateOnly dueDate, int? installmentIndex)
    {
        var today = DateOnly.FromDateTime(DateTime.Today);
        var isPaid = dueDate <= today;

        return new Arrangement
        {
            TransactionId = transaction.Id,
            InstallmentIndex = installmentIndex,
            DueDate = dueDate,
            Amount = transaction.Amount,
            Status = isPaid ? ArrangementStatus.Paid : ArrangementStatus.Pending,
            PaidAt = isPaid ? DateTime.UtcNow : null,
            IsCustomized = false
        };
    }

    private static DateOnly BuildOccurrenceDate(DateOnly anchorDate, int dayOfMonth, int monthOffset)
    {
        var targetMonthDate = anchorDate.AddMonths(monthOffset);
        var daysInMonth = DateTime.DaysInMonth(targetMonthDate.Year, targetMonthDate.Month);
        var clampedDay = Math.Min(dayOfMonth, daysInMonth);

        return new DateOnly(targetMonthDate.Year, targetMonthDate.Month, clampedDay);
    }
}
