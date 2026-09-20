using Finly.Domain.Common;

namespace Finly.Domain.Entities;

public class EmailVerificationCode : BaseEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public string CodeHash { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public DateTime? ConsumedAt { get; set; }
    public int AttemptCount { get; set; }
}
