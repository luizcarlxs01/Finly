using Finly.Domain.Entities;

namespace Finly.Application.Interfaces;

public interface IArrangementGenerationService
{
    List<Arrangement> Generate(Transaction transaction);
}
