namespace Finly.Application.DTOs.Profiles;

public class CreateProfileRequestDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal InitialBalance { get; set; }
}
