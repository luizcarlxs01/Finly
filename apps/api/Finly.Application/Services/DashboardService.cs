using Finly.Application.DTOs.Dashboard;
using Finly.Application.Interfaces;
using Finly.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Finly.Application.Services;

public class DashboardService : IDashboardService
{
    private readonly IAppDbContext _context;

    public DashboardService(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<DashboardSummaryResponseDto> GetSummaryAsync(
        Guid userId,
        Guid financialProfileId,
        CancellationToken cancellationToken = default)
    {
        var profile = await _context.FinancialProfiles
            .FirstOrDefaultAsync(
                x => x.Id == financialProfileId && x.UserId == userId,
                cancellationToken);

        if (profile is null)
            throw new InvalidOperationException("Perfil não encontrado para o usuário informado.");

        var transactions = await _context.Transactions
            .Where(x => x.FinancialProfileId == financialProfileId)
            .ToListAsync(cancellationToken);

        var goals = await _context.Goals
            .Where(x => x.FinancialProfileId == financialProfileId)
            .ToListAsync(cancellationToken);

        var today = DateOnly.FromDateTime(DateTime.Today);

        var postedTransactions = transactions
            .Where(x => x.TransactionDate <= today)
            .ToList();

        var totalIncome = postedTransactions
            .Where(x => x.Type == TransactionType.Income)
            .Sum(x => x.Amount);

        var totalExpense = postedTransactions
            .Where(x => x.Type == TransactionType.Expense)
            .Sum(x => x.Amount);

        var currentBalance = profile.InitialBalance + totalIncome - totalExpense;

        var completedGoalCount = goals.Count(x => x.Status == GoalStatus.Completed);

        return new DashboardSummaryResponseDto
        {
            FinancialProfileId = profile.Id,
            ProfileName = profile.Name,
            InitialBalance = profile.InitialBalance,
            TotalIncome = totalIncome,
            TotalExpense = totalExpense,
            CurrentBalance = currentBalance,
            TransactionCount = transactions.Count,
            GoalCount = goals.Count,
            CompletedGoalCount = completedGoalCount
        };
    }
}
