using Finly.Application.DTOs.Occurrences;

namespace Finly.Application.Interfaces;

public interface IOccurrenceService
{
    Task<OccurrenceResponseDto?> GetByIdAsync(
        Guid userId,
        Guid occurrenceId,
        CancellationToken cancellationToken = default);

    Task<OccurrenceResponseDto> UpdateAsync(
        Guid userId,
        Guid occurrenceId,
        UpdateOccurrenceRequestDto request,
        CancellationToken cancellationToken = default);

    Task<OccurrenceResponseDto> MarkAsPaidAsync(
        Guid userId,
        Guid occurrenceId,
        CancellationToken cancellationToken = default);

    Task<OccurrenceResponseDto> MarkAsPendingAsync(
        Guid userId,
        Guid occurrenceId,
        CancellationToken cancellationToken = default);

    Task<OccurrenceResponseDto> CancelAsync(
        Guid userId,
        Guid occurrenceId,
        CancellationToken cancellationToken = default);
}
