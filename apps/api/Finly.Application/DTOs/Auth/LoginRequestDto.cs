using System.ComponentModel.DataAnnotations;

namespace Finly.Application.DTOs.Auth;

public class LoginRequestDto
{
    [Required]
    [EmailAddress]
    [MaxLength(200)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Password { get; set; } = string.Empty;
}
