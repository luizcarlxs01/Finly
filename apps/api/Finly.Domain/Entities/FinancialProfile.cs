using Finly.Domain.Common;
using Finly.Domain.Enums;

namespace Finly.Domain.Entities;

public class FinancialProfile : BaseEntity
{
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal InitialBalance { get; set; }
    public bool IsPrimary { get; set; }
    public SpendingProfile SpendingProfile { get; set; } = SpendingProfile.Padrao;
    public decimal? CustomOkThreshold { get; set; }
    public decimal? CustomGoodThreshold { get; set; }

    public User User { get; set; } = null!;
    public ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
    public ICollection<Goal> Goals { get; set; } = new List<Goal>();
    public ICollection<FinancialRule> FinancialRules { get; set; } = new List<FinancialRule>();
}
