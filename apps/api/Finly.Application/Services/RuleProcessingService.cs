using Finly.Application.DTOs.Rules;
using Finly.Application.Interfaces;
using Finly.Domain.Entities;
using Finly.Domain.Enums;
using Microsoft.EntityFrameworkCore;


namespace Finly.Application.Services;

public class RuleProcessingService : IRuleProcessingService
{
    private readonly IAppDbContext _context;

    public RuleProcessingService(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<ProcessFinancialRulesResponseDto> ProcessAsync(
        Guid userId,
        Guid financialProfileId,
        ProcessFinancialRulesRequestDto request,
        CancellationToken cancellationToken = default)
    {
        var profile = await _context.FinancialProfiles
            .FirstOrDefaultAsync(
                x => x.Id == financialProfileId && x.UserId == userId,
                cancellationToken);

        if (profile is null)
            throw new InvalidOperationException("Perfil não encontrado para o usuário informado.");

        var rules = await _context.FinancialRules
            .Where(x => x.FinancialProfileId == financialProfileId && x.IsActive)
            .OrderBy(x => x.CreatedAt)
            .ToListAsync(cancellationToken);

        var existingTransactions = await _context.Transactions
            .Where(x => x.FinancialProfileId == financialProfileId && x.SourceId != null)
            .ToListAsync(cancellationToken);

        var createdTransactionCount = 0;
        var skippedTransactionCount = 0;

        foreach (var rule in rules)
        {
            var occurrences = GenerateOccurrences(rule, request.ReferenceDate);

            foreach (var occurrence in occurrences)
            {
                var alreadyExists = existingTransactions.Any(x =>
                    x.SourceId == rule.Id &&
                    x.TransactionDate == occurrence.OccurrenceDate);

                if (alreadyExists)
                {
                    skippedTransactionCount++;
                    continue;
                }

                var transaction = BuildTransactionFromRule(rule, occurrence);

                _context.Transactions.Add(transaction);
                existingTransactions.Add(transaction);
                createdTransactionCount++;
            }

            if (request.ReferenceDate >= rule.StartDate)
            {
                rule.LastProcessedDate = request.ReferenceDate;
            }
        }

        await _context.SaveChangesAsync(cancellationToken);

        return new ProcessFinancialRulesResponseDto
        {
            FinancialProfileId = financialProfileId,
            ReferenceDate = request.ReferenceDate,
            ProcessedRuleCount = rules.Count,
            CreatedTransactionCount = createdTransactionCount,
            SkippedTransactionCount = skippedTransactionCount
        };
    }

    private static List<RuleOccurrenceData> GenerateOccurrences(FinancialRule rule, DateOnly referenceDate)
    {
        var occurrences = new List<RuleOccurrenceData>();

        if (referenceDate < rule.StartDate)
            return occurrences;

        if (rule.RuleType == RuleType.InstallmentExpense)
        {
            if (!rule.TotalMonths.HasValue || rule.TotalMonths.Value <= 0)
                return occurrences;

            for (var i = 0; i < rule.TotalMonths.Value; i++)
            {
                var occurrenceDate = BuildOccurrenceDate(rule.StartDate, rule.DayOfMonth, i);

                if (occurrenceDate > referenceDate)
                    break;

                occurrences.Add(new RuleOccurrenceData
                {
                    OccurrenceDate = occurrenceDate,
                    InstallmentIndex = i + 1,
                    InstallmentCount = rule.TotalMonths
                });
            }

            return occurrences;
        }

        if (rule.RecurrenceMode is null)
            return occurrences;

        var monthOffset = 0;

        while (true)
        {
            var occurrenceDate = BuildOccurrenceDate(rule.StartDate, rule.DayOfMonth, monthOffset);

            if (occurrenceDate > referenceDate)
                break;

            if (rule.RecurrenceMode == RuleRecurrenceMode.UntilDate &&
                rule.EndDate.HasValue &&
                occurrenceDate > rule.EndDate.Value)
                break;

            if (rule.RecurrenceMode == RuleRecurrenceMode.ForMonths &&
                rule.TotalMonths.HasValue &&
                monthOffset >= rule.TotalMonths.Value)
                break;

            occurrences.Add(new RuleOccurrenceData
            {
                OccurrenceDate = occurrenceDate,
                InstallmentIndex = null,
                InstallmentCount = null
            });

            monthOffset++;
        }

        return occurrences;
    }

    private static DateOnly BuildOccurrenceDate(DateOnly startDate, int dayOfMonth, int monthOffset)
    {
        var targetMonthDate = startDate.AddMonths(monthOffset);
        var daysInMonth = DateTime.DaysInMonth(targetMonthDate.Year, targetMonthDate.Month);
        var clampedDay = Math.Min(dayOfMonth, daysInMonth);

        return new DateOnly(targetMonthDate.Year, targetMonthDate.Month, clampedDay);
    }

    private static Transaction BuildTransactionFromRule(
        FinancialRule rule,
        RuleOccurrenceData occurrence)
    {
        return new Transaction
        {
            FinancialProfileId = rule.FinancialProfileId,
            Title = BuildTitle(rule, occurrence),
            Amount = rule.Amount,
            Category = BuildCategory(rule.RuleType),
            TransactionDate = occurrence.OccurrenceDate,
            SourceId = rule.Id,
            TransactionKind = BuildTransactionKind(rule.RuleType),
            Type = BuildTransactionType(rule.RuleType),
            IsRecurring = rule.RuleType != RuleType.InstallmentExpense,
            RecurrenceStartDate = rule.RuleType != RuleType.InstallmentExpense ? rule.StartDate : null,
            RecurrenceEndDate = rule.RuleType != RuleType.InstallmentExpense ? rule.EndDate : null,
            RecurrenceDay = rule.RuleType != RuleType.InstallmentExpense ? rule.DayOfMonth : null,
            RecurrenceMonths = rule.RuleType != RuleType.InstallmentExpense ? rule.TotalMonths : null,
            InstallmentIndex = occurrence.InstallmentIndex,
            InstallmentCount = occurrence.InstallmentCount
        };
    }

    private static string BuildTitle(FinancialRule rule, RuleOccurrenceData occurrence)
    {
        if (rule.RuleType == RuleType.InstallmentExpense &&
            occurrence.InstallmentIndex.HasValue &&
            occurrence.InstallmentCount.HasValue)
        {
            return $"{rule.Title} ({occurrence.InstallmentIndex.Value}/{occurrence.InstallmentCount.Value})";
        }

        return rule.Title;
    }

    private static string BuildCategory(RuleType ruleType)
    {
        return ruleType switch
        {
            RuleType.Salary => "Salário",
            RuleType.RecurringIncome => "Receita recorrente",
            RuleType.RecurringExpense => "Despesa recorrente",
            RuleType.InstallmentExpense => "Despesa parcelada",
            _ => "Geral"
        };
    }

    private static TransactionType BuildTransactionType(RuleType ruleType)
    {
        return ruleType switch
        {
            RuleType.Salary => TransactionType.Income,
            RuleType.RecurringIncome => TransactionType.Income,
            RuleType.RecurringExpense => TransactionType.Expense,
            RuleType.InstallmentExpense => TransactionType.Expense,
            _ => TransactionType.Expense
        };
    }

    private static TransactionKind BuildTransactionKind(RuleType ruleType)
    {
        return ruleType switch
        {
            RuleType.InstallmentExpense => TransactionKind.InstallmentInstance,
            RuleType.Salary => TransactionKind.RecurringInstance,
            RuleType.RecurringIncome => TransactionKind.RecurringInstance,
            RuleType.RecurringExpense => TransactionKind.RecurringInstance,
            _ => TransactionKind.Single
        };
    }

    private sealed class RuleOccurrenceData
    {
        public DateOnly OccurrenceDate { get; set; }
        public int? InstallmentIndex { get; set; }
        public int? InstallmentCount { get; set; }
    }
}
