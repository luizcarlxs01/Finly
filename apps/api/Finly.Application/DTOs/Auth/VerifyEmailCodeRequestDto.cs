using System.ComponentModel.DataAnnotations;

namespace Finly.Application.DTOs.Auth;

public class VerifyEmailCodeRequestDto
{
    [Required]
    [EmailAddress]
    [MaxLength(200)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MaxLength(6)]
    public string Code { get; set; } = string.Empty;
}
