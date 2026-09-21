using Finly.Domain.Common;
using Finly.Domain.Enums;

namespace Finly.Domain.Entities;

public class Topic : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public string AuthorName { get; set; } = string.Empty;
    public string AuthorEmail { get; set; } = string.Empty;
    public Guid? UserId { get; set; }
    public TopicStatus Status { get; set; } = TopicStatus.Published;
    public string? ModerationReason { get; set; }

    public ICollection<TopicReply> Replies { get; set; } = new List<TopicReply>();
}
