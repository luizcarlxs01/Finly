namespace Finly.Application.Interfaces;

public interface IPasswordHasherService
{
    string HashPassword(string password);
    bool VerifyPassword(string password, string passwordHash);
    string? GetRehashIfNeeded(string password, string existingHash);
}
