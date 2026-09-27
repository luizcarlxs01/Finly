using System.ComponentModel.DataAnnotations;

namespace Finly.Application.DTOs.Profiles;

public class UpdateProfileRequestDto
{
    [Required]
    [MaxLength(150)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    public decimal InitialBalance { get; set; }

    /// <summary>
    /// "Economico" | "Padrao" | "Gastao" | "Personalizado". Omitido ou vazio =
    /// mantém o perfil de gastos atual (não reseta) — importa pra chamadas que
    /// reaproveitam este endpoint só pra outro campo, como a edição in-place do
    /// saldo inicial em use-update-initial-balance.ts.
    /// </summary>
    public string? SpendingProfile { get; set; }

    public decimal? CustomOkThreshold { get; set; }
    public decimal? CustomGoodThreshold { get; set; }
}
