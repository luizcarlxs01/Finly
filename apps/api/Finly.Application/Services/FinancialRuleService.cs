using Finly.Application.DTOs.Rules;
using Finly.Application.Interfaces;
using Finly.Domain.Entities;
using Finly.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Finly.Application.Services;

public class FinancialRuleService : IFinancialRuleService
{
    private readonly IAppDbContext _context;

    public FinancialRuleService(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<FinancialRuleResponseDto>> GetAllAsync(
        Guid userId,
        Guid financialProfileId,
        CancellationToken cancellationToken = default)
    {
        var profileExists = await _context.FinancialProfiles
            .AnyAsync(x => x.Id == financialProfileId && x.UserId == userId, cancellationToken);

        if (!profileExists)
            throw new InvalidOperationException("Perfil não encontrado para o usuário informado.");

        return await _context.FinancialRules
            .Where(x => x.FinancialProfileId == financialProfileId)
            .OrderByDescending(x => x.CreatedAt)
            .Select(x => MapToResponse(x))
            .ToListAsync(cancellationToken);
    }

    public async Task<FinancialRuleResponseDto?> GetByIdAsync(
        Guid userId,
        Guid ruleId,
        CancellationToken cancellationToken = default)
    {
        return await _context.FinancialRules
            .Where(x => x.Id == ruleId && x.FinancialProfile.UserId == userId)
            .Select(x => MapToResponse(x))
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<FinancialRuleResponseDto> CreateAsync(
        Guid userId,
        CreateFinancialRuleRequestDto request,
        CancellationToken cancellationToken = default)
    {
        var profile = await _context.FinancialProfiles
            .FirstOrDefaultAsync(
                x => x.Id == request.FinancialProfileId && x.UserId == userId,
                cancellationToken);

        if (profile is null)
            throw new InvalidOperationException("Perfil não encontrado para o usuário informado.");

        var title = request.Title.Trim();

        if (string.IsNullOrWhiteSpace(title))
            throw new InvalidOperationException("O título da regra é obrigatório.");

        if (request.Amount <= 0)
            throw new InvalidOperationException("O valor da regra deve ser maior que zero.");

        if (request.DayOfMonth < 1 || request.DayOfMonth > 31)
            throw new InvalidOperationException("O dia do mês da regra deve estar entre 1 e 31.");

        if (!Enum.TryParse<RuleType>(request.RuleType, true, out var ruleType))
            throw new InvalidOperationException("O tipo da regra é inválido.");

        RuleRecurrenceMode? recurrenceMode = null;

        if (!string.IsNullOrWhiteSpace(request.RecurrenceMode))
        {
            if (!Enum.TryParse<RuleRecurrenceMode>(request.RecurrenceMode, true, out var parsedMode))
                throw new InvalidOperationException("O modo de recorrência da regra é inválido.");

            recurrenceMode = parsedMode;
        }

        ValidateRule(ruleType, recurrenceMode, request.EndDate, request.TotalMonths);

        var rule = new FinancialRule
        {
            FinancialProfileId = request.FinancialProfileId,
            Title = title,
            Amount = request.Amount,
            RuleType = ruleType,
            RecurrenceMode = recurrenceMode,
            DayOfMonth = request.DayOfMonth,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            TotalMonths = request.TotalMonths,
            IsActive = request.IsActive
        };

        _context.FinancialRules.Add(rule);
        await _context.SaveChangesAsync(cancellationToken);

        return MapToResponse(rule);
    }

    public async Task<FinancialRuleResponseDto> UpdateAsync(
        Guid userId,
        Guid ruleId,
        UpdateFinancialRuleRequestDto request,
        CancellationToken cancellationToken = default)
    {
        var rule = await _context.FinancialRules
            .Include(x => x.FinancialProfile)
            .FirstOrDefaultAsync(
                x => x.Id == ruleId && x.FinancialProfile.UserId == userId,
                cancellationToken);

        if (rule is null)
            throw new InvalidOperationException("Regra não encontrada.");

        var targetProfile = await _context.FinancialProfiles
            .FirstOrDefaultAsync(
                x => x.Id == request.FinancialProfileId && x.UserId == userId,
                cancellationToken);

        if (targetProfile is null)
            throw new InvalidOperationException("Perfil não encontrado para o usuário informado.");

        var title = request.Title.Trim();

        if (string.IsNullOrWhiteSpace(title))
            throw new InvalidOperationException("O título da regra é obrigatório.");

        if (request.Amount <= 0)
            throw new InvalidOperationException("O valor da regra deve ser maior que zero.");

        if (request.DayOfMonth < 1 || request.DayOfMonth > 31)
            throw new InvalidOperationException("O dia do mês da regra deve estar entre 1 e 31.");

        if (!Enum.TryParse<RuleType>(request.RuleType, true, out var ruleType))
            throw new InvalidOperationException("O tipo da regra é inválido.");

        RuleRecurrenceMode? recurrenceMode = null;

        if (!string.IsNullOrWhiteSpace(request.RecurrenceMode))
        {
            if (!Enum.TryParse<RuleRecurrenceMode>(request.RecurrenceMode, true, out var parsedMode))
                throw new InvalidOperationException("O modo de recorrência da regra é inválido.");

            recurrenceMode = parsedMode;
        }

        ValidateRule(ruleType, recurrenceMode, request.EndDate, request.TotalMonths);

        rule.FinancialProfileId = request.FinancialProfileId;
        rule.Title = title;
        rule.Amount = request.Amount;
        rule.RuleType = ruleType;
        rule.RecurrenceMode = recurrenceMode;
        rule.DayOfMonth = request.DayOfMonth;
        rule.StartDate = request.StartDate;
        rule.EndDate = request.EndDate;
        rule.TotalMonths = request.TotalMonths;
        rule.IsActive = request.IsActive;

        await _context.SaveChangesAsync(cancellationToken);

        return MapToResponse(rule);
    }

    public async Task DeleteAsync(
        Guid userId,
        Guid ruleId,
        CancellationToken cancellationToken = default)
    {
        var rule = await _context.FinancialRules
            .FirstOrDefaultAsync(
                x => x.Id == ruleId && x.FinancialProfile.UserId == userId,
                cancellationToken);

        if (rule is null)
            throw new InvalidOperationException("Regra não encontrada.");

        _context.FinancialRules.Remove(rule);
        await _context.SaveChangesAsync(cancellationToken);
    }

    private static void ValidateRule(
        RuleType ruleType,
        RuleRecurrenceMode? recurrenceMode,
        DateOnly? endDate,
        int? totalMonths)
    {
        if (ruleType == RuleType.InstallmentExpense)
        {
            if (totalMonths is null || totalMonths <= 0)
                throw new InvalidOperationException("Regras parceladas devem informar a quantidade total de meses/parcelas.");

            return;
        }

        if (ruleType is RuleType.Salary or RuleType.RecurringIncome or RuleType.RecurringExpense)
        {
            if (recurrenceMode is null)
                throw new InvalidOperationException("Regras recorrentes devem informar o modo de recorrência.");

            if (recurrenceMode == RuleRecurrenceMode.UntilDate && endDate is null)
                throw new InvalidOperationException("Regras com recorrência até data devem informar a data final.");

            if (recurrenceMode == RuleRecurrenceMode.ForMonths && (totalMonths is null || totalMonths <= 0))
                throw new InvalidOperationException("Regras com recorrência por meses devem informar a quantidade de meses.");
        }
    }

    private static FinancialRuleResponseDto MapToResponse(FinancialRule rule)
    {
        return new FinancialRuleResponseDto
        {
            Id = rule.Id,
            FinancialProfileId = rule.FinancialProfileId,
            Title = rule.Title,
            Amount = rule.Amount,
            RuleType = rule.RuleType.ToString(),
            RecurrenceMode = rule.RecurrenceMode?.ToString(),
            DayOfMonth = rule.DayOfMonth,
            StartDate = rule.StartDate,
            EndDate = rule.EndDate,
            TotalMonths = rule.TotalMonths,
            IsActive = rule.IsActive,
            LastProcessedDate = rule.LastProcessedDate,
            CreatedAt = rule.CreatedAt
        };
    }
}
