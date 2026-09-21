namespace Finly.Application.DTOs.Forum;

public class TopicReplyDto
{
    public Guid Id { get; set; }
    public string Body { get; set; } = string.Empty;
    public bool IsFromAdmin { get; set; }
    public DateTime CreatedAt { get; set; }
}
