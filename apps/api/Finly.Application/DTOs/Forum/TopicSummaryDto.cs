namespace Finly.Application.DTOs.Forum;

public class TopicSummaryDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string AuthorName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? ModerationReason { get; set; }
    public int ReplyCount { get; set; }
    public DateTime CreatedAt { get; set; }
}
