using Finly.Application.DTOs.Rules;
using Finly.Application.Interfaces;
using Finly.Domain.Entities;
using Finly.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Finly.Application.Services;

public class RuleProcessingService : IRuleProcessingService
{
    private readonly IAppDbContext _context;
    private readonly IOccurrenceGenerationService _occurrenceGenerationService;

    public RuleProcessingService(IAppDbContext context, IOccurrenceGenerationService occurrenceGenerationService)
    {
        _context = context;
        _occurrenceGenerationService = occurrenceGenerationService;
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

        var ruleIds = rules.Select(x => x.Id).ToList();

        var existingContractTransactions = await _context.Transactions
            .Include(x => x.Occurrences)
            .Where(x => x.FinancialProfileId == financialProfileId &&
                        x.SourceId != null &&
                        ruleIds.Contains(x.SourceId.Value))
            .ToListAsync(cancellationToken);

        var transactionsByRuleId = existingContractTransactions.ToDictionary(x => x.SourceId!.Value);

        var createdOccurrenceCount = 0;
        var skippedOccurrenceCount = 0;

        foreach (var rule in rules)
        {
            if (!transactionsByRuleId.TryGetValue(rule.Id, out var transaction))
            {
                transaction = BuildTransactionFromRule(rule);
                _context.Transactions.Add(transaction);
                transactionsByRuleId[rule.Id] = transaction;
            }

            var generatedOccurrences = _occurrenceGenerationService.Generate(transaction);
            var existingDueDates = transaction.Occurrences.Select(x => x.DueDate).ToHashSet();

            foreach (var occurrence in generatedOccurrences)
            {
                if (!existingDueDates.Add(occurrence.DueDate))
                {
                    skippedOccurrenceCount++;
                    continue;
                }

                _context.Occurrences.Add(occurrence);
                transaction.Occurrences.Add(occurrence);
                createdOccurrenceCount++;
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
            CreatedTransactionCount = createdOccurrenceCount,
            SkippedTransactionCount = skippedOccurrenceCount
        };
    }

    private static Transaction BuildTransactionFromRule(FinancialRule rule)
    {
        var isInstallment = rule.RuleType == RuleType.InstallmentExpense;

        return new Transaction
        {
            FinancialProfileId = rule.FinancialProfileId,
            Title = rule.Title,
            Amount = rule.Amount,
            Category = BuildCategory(rule.RuleType),
            TransactionDate = rule.StartDate,
            SourceId = rule.Id,
            TransactionKind = isInstallment ? TransactionKind.Installment : TransactionKind.Recurring,
            Type = BuildTransactionType(rule.RuleType),
            InstallmentCount = isInstallment ? rule.TotalMonths : null,
            IsRecurring = !isInstallment,
            RecurrenceMode = !isInstallment ? rule.RecurrenceMode : null,
            RecurrenceStartDate = !isInstallment ? rule.StartDate : null,
            RecurrenceEndDate = !isInstallment ? rule.EndDate : null,
            RecurrenceDay = !isInstallment ? rule.DayOfMonth : null,
            RecurrenceMonths = !isInstallment ? rule.TotalMonths : null
        };
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
}
