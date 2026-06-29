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
}
