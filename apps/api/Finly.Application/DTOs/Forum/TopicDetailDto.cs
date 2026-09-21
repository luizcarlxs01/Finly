namespace Finly.Application.DTOs.Forum;

public class TopicDetailDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public string AuthorName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? ModerationReason { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<TopicReplyDto> Replies { get; set; } = new();
}
