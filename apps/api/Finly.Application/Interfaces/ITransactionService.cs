using Finly.Application.DTOs.Transactions;

namespace Finly.Application.Interfaces;

public interface ITransactionService
{
    Task<IReadOnlyList<TransactionResponseDto>> GetAllAsync(
        Guid userId,
        Guid financialProfileId,
        CancellationToken cancellationToken = default);

    Task<TransactionResponseDto?> GetByIdAsync(
        Guid userId,
        Guid transactionId,
        CancellationToken cancellationToken = default);

    Task<TransactionResponseDto> CreateAsync(
        Guid userId,
        CreateTransactionRequestDto request,
        CancellationToken cancellationToken = default);

    Task<TransactionResponseDto> UpdateAsync(
        Guid userId,
        Guid transactionId,
        UpdateTransactionRequestDto request,
        CancellationToken cancellationToken = default);

    Task DeleteAsync(
        Guid userId,
        Guid transactionId,
        CancellationToken cancellationToken = default);
}
