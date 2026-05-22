namespace Finly.Application.DTOs.Profiles;

public class ProfileResponseDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal InitialBalance { get; set; }
    public DateTime CreatedAt { get; set; }
}
