using Finly.Application.DTOs.Occurrences;
using Finly.Application.Interfaces;
using Finly.Domain.Entities;
using Finly.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Finly.Application.Services;

public class OccurrenceService : IOccurrenceService
{
    private readonly IAppDbContext _context;

    public OccurrenceService(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<OccurrenceResponseDto?> GetByIdAsync(
        Guid userId,
        Guid occurrenceId,
        CancellationToken cancellationToken = default)
    {
        return await _context.Occurrences
            .Where(x => x.Id == occurrenceId && x.Transaction.FinancialProfile.UserId == userId)
            .Select(x => MapToResponse(x))
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<OccurrenceResponseDto> UpdateAsync(
        Guid userId,
        Guid occurrenceId,
        UpdateOccurrenceRequestDto request,
        CancellationToken cancellationToken = default)
    {
        var occurrence = await GetOwnedOccurrenceAsync(userId, occurrenceId, cancellationToken);

        occurrence.DueDate = request.DueDate;
        occurrence.Amount = request.Amount;
        occurrence.IsCustomized = true;

        await _context.SaveChangesAsync(cancellationToken);

        return MapToResponse(occurrence);
    }

    public async Task<OccurrenceResponseDto> MarkAsPaidAsync(
        Guid userId,
        Guid occurrenceId,
        CancellationToken cancellationToken = default)
    {
        var occurrence = await GetOwnedOccurrenceAsync(userId, occurrenceId, cancellationToken);

        occurrence.Status = OccurrenceStatus.Paid;
        occurrence.PaidAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return MapToResponse(occurrence);
    }

    public async Task<OccurrenceResponseDto> MarkAsPendingAsync(
        Guid userId,
        Guid occurrenceId,
        CancellationToken cancellationToken = default)
    {
        var occurrence = await GetOwnedOccurrenceAsync(userId, occurrenceId, cancellationToken);

        occurrence.Status = OccurrenceStatus.Pending;
        occurrence.PaidAt = null;

        await _context.SaveChangesAsync(cancellationToken);

        return MapToResponse(occurrence);
    }

    public async Task<OccurrenceResponseDto> CancelAsync(
        Guid userId,
        Guid occurrenceId,
        CancellationToken cancellationToken = default)
    {
        var occurrence = await GetOwnedOccurrenceAsync(userId, occurrenceId, cancellationToken);

        occurrence.Status = OccurrenceStatus.Cancelled;

        await _context.SaveChangesAsync(cancellationToken);

        return MapToResponse(occurrence);
    }

    private async Task<Occurrence> GetOwnedOccurrenceAsync(
        Guid userId,
        Guid occurrenceId,
        CancellationToken cancellationToken)
    {
        var occurrence = await _context.Occurrences
            .Include(x => x.Transaction)
            .ThenInclude(x => x.FinancialProfile)
            .FirstOrDefaultAsync(
                x => x.Id == occurrenceId && x.Transaction.FinancialProfile.UserId == userId,
                cancellationToken);

        if (occurrence is null)
            throw new InvalidOperationException("Ocorrência não encontrada.");

        return occurrence;
    }

    private static OccurrenceResponseDto MapToResponse(Occurrence occurrence)
    {
        return new OccurrenceResponseDto
        {
            Id = occurrence.Id,
            TransactionId = occurrence.TransactionId,
            InstallmentIndex = occurrence.InstallmentIndex,
            DueDate = occurrence.DueDate,
            Amount = occurrence.Amount,
            Status = occurrence.Status.ToString(),
            PaidAt = occurrence.PaidAt,
            IsCustomized = occurrence.IsCustomized,
            CreatedAt = occurrence.CreatedAt
        };
    }
}
