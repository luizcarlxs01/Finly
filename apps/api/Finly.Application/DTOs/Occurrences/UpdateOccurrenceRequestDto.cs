using System.ComponentModel.DataAnnotations;

namespace Finly.Application.DTOs.Occurrences;

public class UpdateOccurrenceRequestDto : IValidatableObject
{
    public DateOnly DueDate { get; set; }
    public decimal Amount { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (DueDate == default)
            yield return new ValidationResult("Informe uma data válida para a ocorrência.", [nameof(DueDate)]);
        if (Amount <= 0)
            yield return new ValidationResult("O valor da ocorrência deve ser maior que zero.", [nameof(Amount)]);
    }
}
