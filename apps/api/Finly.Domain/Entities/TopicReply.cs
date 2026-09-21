using Finly.Domain.Common;

namespace Finly.Domain.Entities;

public class TopicReply : BaseEntity
{
    public Guid TopicId { get; set; }
    public Topic Topic { get; set; } = null!;
    public string Body { get; set; } = string.Empty;
    public bool IsFromAdmin { get; set; }
}
