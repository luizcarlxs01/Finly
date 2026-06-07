using Finly.Application.DTOs.Goals;
using Finly.Application.Interfaces;
using Finly.Domain.Entities;
using Finly.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Finly.Application.Services;

public class GoalService : IGoalService
{
    private readonly IAppDbContext _context;

    public GoalService(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<GoalResponseDto>> GetAllAsync(
        Guid userId,
        Guid financialProfileId,
        CancellationToken cancellationToken = default)
    {
        var profileExists = await _context.FinancialProfiles
            .AnyAsync(x => x.Id == financialProfileId && x.UserId == userId, cancellationToken);

        if (!profileExists)
            throw new InvalidOperationException("Perfil não encontrado para o usuário informado.");

        return await _context.Goals
            .Where(x => x.FinancialProfileId == financialProfileId)
            .OrderByDescending(x => x.CreatedAt)
            .Select(x => MapToResponse(x))
            .ToListAsync(cancellationToken);
    }

    public async Task<GoalResponseDto?> GetByIdAsync(
        Guid userId,
        Guid goalId,
        CancellationToken cancellationToken = default)
    {
        return await _context.Goals
            .Where(x => x.Id == goalId && x.FinancialProfile.UserId == userId)
            .Select(x => MapToResponse(x))
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<GoalResponseDto> CreateAsync(
        Guid userId,
        CreateGoalRequestDto request,
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
            throw new InvalidOperationException("O título da meta é obrigatório.");

        if (request.TargetAmount <= 0)
            throw new InvalidOperationException("O valor alvo da meta deve ser maior que zero.");

        if (request.CurrentAmount < 0)
            throw new InvalidOperationException("O valor atual da meta não pode ser negativo.");

        var status = request.CurrentAmount >= request.TargetAmount
            ? GoalStatus.Completed
            : GoalStatus.Active;

        var goal = new Goal
        {
            FinancialProfileId = request.FinancialProfileId,
            Title = title,
            TargetAmount = request.TargetAmount,
            CurrentAmount = request.CurrentAmount,
            Deadline = request.Deadline,
            Status = status
        };

        _context.Goals.Add(goal);
        await _context.SaveChangesAsync(cancellationToken);

        return MapToResponse(goal);
    }

    public async Task<GoalResponseDto> UpdateAsync(
        Guid userId,
        Guid goalId,
        UpdateGoalRequestDto request,
        CancellationToken cancellationToken = default)
    {
        var goal = await _context.Goals
            .Include(x => x.FinancialProfile)
            .FirstOrDefaultAsync(
                x => x.Id == goalId && x.FinancialProfile.UserId == userId,
                cancellationToken);

        if (goal is null)
            throw new InvalidOperationException("Meta não encontrada.");

        var targetProfile = await _context.FinancialProfiles
            .FirstOrDefaultAsync(
                x => x.Id == request.FinancialProfileId && x.UserId == userId,
                cancellationToken);

        if (targetProfile is null)
            throw new InvalidOperationException("Perfil não encontrado para o usuário informado.");

        var title = request.Title.Trim();

        if (string.IsNullOrWhiteSpace(title))
            throw new InvalidOperationException("O título da meta é obrigatório.");

        if (request.TargetAmount <= 0)
            throw new InvalidOperationException("O valor alvo da meta deve ser maior que zero.");

        if (request.CurrentAmount < 0)
            throw new InvalidOperationException("O valor atual da meta não pode ser negativo.");

        goal.FinancialProfileId = request.FinancialProfileId;
        goal.Title = title;
        goal.TargetAmount = request.TargetAmount;
        goal.CurrentAmount = request.CurrentAmount;
        goal.Deadline = request.Deadline;
        goal.Status = goal.CurrentAmount >= goal.TargetAmount
            ? GoalStatus.Completed
            : GoalStatus.Active;

        await _context.SaveChangesAsync(cancellationToken);

        return MapToResponse(goal);
    }

    public async Task<GoalResponseDto> UpdateProgressAsync(
        Guid userId,
        Guid goalId,
        UpdateGoalProgressRequestDto request,
        CancellationToken cancellationToken = default)
    {
        var goal = await _context.Goals
            .FirstOrDefaultAsync(
                x => x.Id == goalId && x.FinancialProfile.UserId == userId,
                cancellationToken);

        if (goal is null)
            throw new InvalidOperationException("Meta não encontrada.");

        if (request.CurrentAmount < 0)
            throw new InvalidOperationException("O valor atual da meta não pode ser negativo.");

        goal.CurrentAmount = request.CurrentAmount;
        goal.Status = goal.CurrentAmount >= goal.TargetAmount
            ? GoalStatus.Completed
            : GoalStatus.Active;

        await _context.SaveChangesAsync(cancellationToken);

        return MapToResponse(goal);
    }

    public async Task DeleteAsync(
        Guid userId,
        Guid goalId,
        CancellationToken cancellationToken = default)
    {
        var goal = await _context.Goals
            .FirstOrDefaultAsync(
                x => x.Id == goalId && x.FinancialProfile.UserId == userId,
                cancellationToken);

        if (goal is null)
            throw new InvalidOperationException("Meta não encontrada.");

        _context.Goals.Remove(goal);
        await _context.SaveChangesAsync(cancellationToken);
    }

    private static GoalResponseDto MapToResponse(Goal goal)
    {
        return new GoalResponseDto
        {
            Id = goal.Id,
            FinancialProfileId = goal.FinancialProfileId,
            Title = goal.Title,
            TargetAmount = goal.TargetAmount,
            CurrentAmount = goal.CurrentAmount,
            Deadline = goal.Deadline,
            Status = goal.Status.ToString(),
            CreatedAt = goal.CreatedAt
        };
    }
}
