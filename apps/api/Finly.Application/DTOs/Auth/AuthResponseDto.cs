namespace Finly.Application.DTOs.Auth;

public class AuthResponseDto
{
    public bool RequiresVerification { get; set; }
    public string? Token { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public Guid? UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
}
