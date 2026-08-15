using Finly.Domain.Entities;

namespace Finly.Application.Interfaces;

public interface IOccurrenceGenerationService
{
    List<Occurrence> Generate(Transaction transaction);

    /// <summary>
    /// Gera occurrences adicionais para uma recorrência indefinida cujo horizonte está se esgotando.
    /// Continua o InstallmentIndex sequencialmente a partir de nextInstallmentIndex.
    /// fromDate é a primeira DueDate a gerar (mês seguinte ao último existente).
    /// horizonEnd é a data limite (hoje + 12 meses).
    /// </summary>
    List<Occurrence> GenerateExtension(
        Transaction transaction,
        int nextInstallmentIndex,
        DateOnly fromDate,
        DateOnly horizonEnd);
}
