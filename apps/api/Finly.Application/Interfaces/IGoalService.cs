using Finly.Application.DTOs.Goals;

namespace Finly.Application.Interfaces;

public interface IGoalService
{
    Task<IReadOnlyList<GoalResponseDto>> GetAllAsync(
        Guid userId,
        Guid financialProfileId,
        CancellationToken cancellationToken = default);

    Task<GoalResponseDto?> GetByIdAsync(
        Guid userId,
        Guid goalId,
        CancellationToken cancellationToken = default);

    Task<GoalResponseDto> CreateAsync(
        Guid userId,
        CreateGoalRequestDto request,
        CancellationToken cancellationToken = default);

    Task<GoalResponseDto> UpdateAsync(
        Guid userId,
        Guid goalId,
        UpdateGoalRequestDto request,
        CancellationToken cancellationToken = default);

    Task<GoalResponseDto> UpdateProgressAsync(
        Guid userId,
        Guid goalId,
        UpdateGoalProgressRequestDto request,
        CancellationToken cancellationToken = default);

    Task DeleteAsync(
        Guid userId,
        Guid goalId,
        CancellationToken cancellationToken = default);
}
