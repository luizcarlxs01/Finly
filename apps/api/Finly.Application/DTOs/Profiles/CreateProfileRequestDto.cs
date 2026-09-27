using System.ComponentModel.DataAnnotations;

namespace Finly.Application.DTOs.Profiles;

public class CreateProfileRequestDto
{
    [Required]
    [MaxLength(150)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    public decimal InitialBalance { get; set; }

    /// <summary>
    /// "Economico" | "Padrao" | "Gastao" | "Personalizado". Omitido ou vazio = Padrao.
    /// String, não enum: System.Text.Json não desserializa string-&gt;enum neste
    /// projeto (mesmo padrão de UpdateTopicStatusRequestDto).
    /// </summary>
    public string? SpendingProfile { get; set; }

    public decimal? CustomOkThreshold { get; set; }
    public decimal? CustomGoodThreshold { get; set; }
}
