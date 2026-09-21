namespace Finly.Application.Interfaces;

public class ModerationResult
{
    public bool IsFlagged { get; init; }
    public string? Reason { get; init; }

    public static ModerationResult Clean() => new() { IsFlagged = false };

    public static ModerationResult Flagged(string reason) =>
        new() { IsFlagged = true, Reason = reason };
}

public interface IContentModerationService
{
    ModerationResult Analyze(string title, string body);
}
