using Finly.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Finly.Application.Interfaces;

public interface IAppDbContext
{
    DbSet<User> Users { get; }
    DbSet<FinancialProfile> FinancialProfiles { get; }
    DbSet<Transaction> Transactions { get; }
    DbSet<Goal> Goals { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
