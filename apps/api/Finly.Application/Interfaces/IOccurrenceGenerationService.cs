using Finly.Domain.Entities;

namespace Finly.Application.Interfaces;

public interface IOccurrenceGenerationService
{
    List<Occurrence> Generate(Transaction transaction);
}
