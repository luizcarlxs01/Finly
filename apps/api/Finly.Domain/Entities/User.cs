using Finly.Domain.Common;

namespace Finly.Domain.Entities;

public class User : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;

    public ICollection<FinancialProfile> FinancialProfiles { get; set; } = new List<FinancialProfile>();
}
