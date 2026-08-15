using Finly.Application.DTOs.Occurrences;
using Finly.Application.DTOs.Transactions;
using Finly.Application.Interfaces;
using Finly.Domain.Entities;
using Finly.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Finly.Application.Services;

public class TransactionService : ITransactionService
{
    private readonly IAppDbContext _context;
    private readonly IOccurrenceGenerationService _occurrenceGenerationService;

    public TransactionService(IAppDbContext context, IOccurrenceGenerationService occurrenceGenerationService)
    {
        _context = context;
        _occurrenceGenerationService = occurrenceGenerationService;
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

        var transactions = await _context.Transactions
            .Include(x => x.Occurrences)
            .Where(x => x.FinancialProfileId == financialProfileId)
            .OrderByDescending(x => x.TransactionDate)
            .ThenByDescending(x => x.CreatedAt)
            .ToListAsync(cancellationToken);

        await ExtendIndefiniteRecurrencesIfNeededAsync(transactions, cancellationToken);

        return transactions.Select(MapToResponse).ToList();
    }

    private async Task ExtendIndefiniteRecurrencesIfNeededAsync(
        List<Transaction> transactions,
        CancellationToken cancellationToken)
    {
        var today = DateOnly.FromDateTime(DateTime.Today);
        var thresholdDate = today.AddMonths(6);
        var horizonEnd = today.AddMonths(12);

        // Pré-check: qualquer transação indefinida no perfil?
        var indefiniteTransactions = transactions
            .Where(t =>
                t.TransactionKind == TransactionKind.Recurring &&
                (t.RecurrenceMode == null || t.RecurrenceMode == RecurrenceMode.Indefinite))
            .ToList();

        if (indefiniteTransactions.Count == 0)
            return;

        var needsSave = false;

        foreach (var transaction in indefiniteTransactions)
        {
            var activeOccurrences = transaction.Occurrences
                .Where(o => o.Status != OccurrenceStatus.Cancelled)
                .ToList();

            if (activeOccurrences.Count == 0)
                continue;

            var maxDueDate = activeOccurrences.Max(o => o.DueDate);

            // Se o horizonte ainda é suficiente, pula
            if (maxDueDate >= thresholdDate)
                continue;

            var maxInstallmentIndex = activeOccurrences
                .Where(o => o.InstallmentIndex.HasValue)
                .Max(o => o.InstallmentIndex!.Value);

            // Primeiro mês a gerar = mês seguinte ao último existente
            var fromDate = maxDueDate.AddMonths(1);

            var newOccurrences = _occurrenceGenerationService.GenerateExtension(
                transaction,
                nextInstallmentIndex: maxInstallmentIndex + 1,
                fromDate: fromDate,
                horizonEnd: horizonEnd);

            // Dedup por InstallmentIndex — mesma estratégia do RuleProcessingService
            var existingIndexes = activeOccurrences
                .Where(o => o.InstallmentIndex.HasValue)
                .Select(o => o.InstallmentIndex!.Value)
                .ToHashSet();

            foreach (var occurrence in newOccurrences)
            {
                if (occurrence.InstallmentIndex.HasValue &&
                    existingIndexes.Contains(occurrence.InstallmentIndex.Value))
                    continue;

                _context.Occurrences.Add(occurrence);
                transaction.Occurrences.Add(occurrence);
                needsSave = true;
            }
        }

        if (needsSave)
            await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<TransactionResponseDto?> GetByIdAsync(
        Guid userId,
        Guid transactionId,
        CancellationToken cancellationToken = default)
    {
        var transaction = await _context.Transactions
            .Include(x => x.Occurrences)
            .FirstOrDefaultAsync(
                x => x.Id == transactionId && x.FinancialProfile.UserId == userId,
                cancellationToken);

        return transaction is null ? null : MapToResponse(transaction);
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
            InstallmentCount = request.InstallmentCount,
            IsRecurring = request.IsRecurring,
            RecurrenceStartDate = request.RecurrenceStartDate,
            RecurrenceEndDate = request.RecurrenceEndDate,
            RecurrenceDay = request.RecurrenceDay,
            RecurrenceMonths = request.RecurrenceMonths
        };

        _context.Transactions.Add(transaction);

        var occurrences = _occurrenceGenerationService.Generate(transaction);
        foreach (var occurrence in occurrences)
        {
            _context.Occurrences.Add(occurrence);
            transaction.Occurrences.Add(occurrence);
        }

        await _context.SaveChangesAsync(cancellationToken);

        return MapToResponse(transaction);
    }

    public async Task<TransactionResponseDto> UpdateAsync(
        Guid userId,
        Guid transactionId,
        UpdateTransactionRequestDto request,
        CancellationToken cancellationToken = default)
    {
        var transaction = await _context.Transactions
            .Include(x => x.FinancialProfile)
            .Include(x => x.Occurrences)
            .FirstOrDefaultAsync(
                x => x.Id == transactionId && x.FinancialProfile.UserId == userId,
                cancellationToken);

        if (transaction is null)
            throw new InvalidOperationException("Transação não encontrada.");

        var targetProfile = await _context.FinancialProfiles
            .FirstOrDefaultAsync(
                x => x.Id == request.FinancialProfileId && x.UserId == userId,
                cancellationToken);

        if (targetProfile is null)
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

        transaction.FinancialProfileId = request.FinancialProfileId;
        transaction.Title = title;
        transaction.Amount = request.Amount;
        transaction.Type = transactionType;
        transaction.Category = category;
        transaction.TransactionKind = transactionKind;
        transaction.TransactionDate = request.TransactionDate;
        transaction.SourceId = request.SourceId;
        transaction.InstallmentCount = request.InstallmentCount;
        transaction.IsRecurring = request.IsRecurring;
        transaction.RecurrenceStartDate = request.RecurrenceStartDate;
        transaction.RecurrenceEndDate = request.RecurrenceEndDate;
        transaction.RecurrenceDay = request.RecurrenceDay;
        transaction.RecurrenceMonths = request.RecurrenceMonths;

        if (transactionKind == TransactionKind.Single)
        {
            var occurrence = transaction.Occurrences.FirstOrDefault();

            if (occurrence is not null)
            {
                occurrence.Amount = request.Amount;
                occurrence.DueDate = request.TransactionDate;
            }
        }

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
            InstallmentCount = transaction.InstallmentCount,
            IsRecurring = transaction.IsRecurring,
            RecurrenceStartDate = transaction.RecurrenceStartDate,
            RecurrenceEndDate = transaction.RecurrenceEndDate,
            RecurrenceDay = transaction.RecurrenceDay,
            RecurrenceMonths = transaction.RecurrenceMonths,
            CreatedAt = transaction.CreatedAt,
            Occurrences = transaction.Occurrences
                .Where(x => x.Status != OccurrenceStatus.Cancelled)
                .OrderBy(x => x.DueDate)
                .Select(x => new OccurrenceResponseDto
                {
                    Id = x.Id,
                    TransactionId = x.TransactionId,
                    InstallmentIndex = x.InstallmentIndex,
                    DueDate = x.DueDate,
                    Amount = x.Amount,
                    Status = x.Status.ToString(),
                    PaidAt = x.PaidAt,
                    IsCustomized = x.IsCustomized,
                    CreatedAt = x.CreatedAt
                })
                .ToList()
        };
    }
}
