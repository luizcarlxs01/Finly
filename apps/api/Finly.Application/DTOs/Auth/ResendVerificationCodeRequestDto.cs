using System.ComponentModel.DataAnnotations;

namespace Finly.Application.DTOs.Auth;

public class ResendVerificationCodeRequestDto
{
    [Required]
    [EmailAddress]
    [MaxLength(200)]
    public string Email { get; set; } = string.Empty;
}
