using Finly.Application.DTOs.Transactions;
using Finly.Application.Interfaces;
using Finly.Domain.Entities;
using Finly.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Finly.Application.Services;

public class TransactionService : ITransactionService
{
    private readonly IAppDbContext _context;

    public TransactionService(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<TransactionResponseDto>> GetAllAsync(
        Guid userId,
        Guid financialProfileId,
        CancellationToken cancellationToken = default)
    {
        var profileExists = await _context.FinancialProfiles
            .AnyAsync(x => x.Id == financialProfileId && x.UserId == userId, cancellationToken);

        if (!profileExists)
            throw new InvalidOperationException("Perfil não encontrado para o usuário informado.");

        return await _context.Transactions
            .Where(x => x.FinancialProfileId == financialProfileId)
            .OrderByDescending(x => x.TransactionDate)
            .ThenByDescending(x => x.CreatedAt)
            .Select(x => MapToResponse(x))
            .ToListAsync(cancellationToken);
    }

    public async Task<TransactionResponseDto?> GetByIdAsync(
        Guid userId,
        Guid transactionId,
        CancellationToken cancellationToken = default)
    {
        return await _context.Transactions
            .Where(x => x.Id == transactionId && x.FinancialProfile.UserId == userId)
            .Select(x => MapToResponse(x))
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<TransactionResponseDto> CreateAsync(
        Guid userId,
        CreateTransactionRequestDto request,
        CancellationToken cancellationToken = default)
    {
        var profile = await _context.FinancialProfiles
            .FirstOrDefaultAsync(
                x => x.Id == request.FinancialProfileId && x.UserId == userId,
                cancellationToken);

        if (profile is null)
            throw new InvalidOperationException("Perfil não encontrado para o usuário informado.");

        var title = request.Title.Trim();
        var category = request.Category.Trim();

        if (string.IsNullOrWhiteSpace(title))
            throw new InvalidOperationException("O título da transação é obrigatório.");

        if (request.Amount <= 0)
            throw new InvalidOperationException("O valor da transação deve ser maior que zero.");

        if (string.IsNullOrWhiteSpace(category))
            throw new InvalidOperationException("A categoria da transação é obrigatória.");

        if (!Enum.TryParse<TransactionType>(request.Type, true, out var transactionType))
            throw new InvalidOperationException("O tipo da transação é inválido.");

        if (!Enum.TryParse<TransactionKind>(request.TransactionKind, true, out var transactionKind))
            throw new InvalidOperationException("O tipo estrutural da transação é inválido.");

        var transaction = new Transaction
        {
            FinancialProfileId = request.FinancialProfileId,
            Title = title,
            Amount = request.Amount,
            Type = transactionType,
            Category = category,
            TransactionKind = transactionKind,
            TransactionDate = request.TransactionDate,
            SourceId = request.SourceId,
            InstallmentIndex = request.InstallmentIndex,
            InstallmentCount = request.InstallmentCount,
            IsRecurring = request.IsRecurring,
            RecurrenceStartDate = request.RecurrenceStartDate,
            RecurrenceEndDate = request.RecurrenceEndDate,
            RecurrenceDay = request.RecurrenceDay,
            RecurrenceMonths = request.RecurrenceMonths
        };

        _context.Transactions.Add(transaction);
        await _context.SaveChangesAsync(cancellationToken);

        return MapToResponse(transaction);
    }

    public async Task DeleteAsync(
        Guid userId,
        Guid transactionId,
        CancellationToken cancellationToken = default)
    {
        var transaction = await _context.Transactions
            .FirstOrDefaultAsync(
                x => x.Id == transactionId && x.FinancialProfile.UserId == userId,
                cancellationToken);

        if (transaction is null)
            throw new InvalidOperationException("Transação não encontrada.");

        _context.Transactions.Remove(transaction);
        await _context.SaveChangesAsync(cancellationToken);
    }

    private static TransactionResponseDto MapToResponse(Transaction transaction)
    {
        return new TransactionResponseDto
        {
            Id = transaction.Id,
            FinancialProfileId = transaction.FinancialProfileId,
            Title = transaction.Title,
            Amount = transaction.Amount,
            Type = transaction.Type.ToString(),
            Category = transaction.Category,
            TransactionKind = transaction.TransactionKind.ToString(),
            TransactionDate = transaction.TransactionDate,
            SourceId = transaction.SourceId,
            InstallmentIndex = transaction.InstallmentIndex,
            InstallmentCount = transaction.InstallmentCount,
            IsRecurring = transaction.IsRecurring,
            RecurrenceStartDate = transaction.RecurrenceStartDate,
            RecurrenceEndDate = transaction.RecurrenceEndDate,
            RecurrenceDay = transaction.RecurrenceDay,
            RecurrenceMonths = transaction.RecurrenceMonths,
            CreatedAt = transaction.CreatedAt
        };
    }
}
