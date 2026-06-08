using Finly.Application.Interfaces;
using Finly.Domain.Common;
using Finly.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Finly.Infrastructure.Data;

public class AppDbContext : DbContext, IAppDbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<FinancialProfile> FinancialProfiles => Set<FinancialProfile>();
    public DbSet<Transaction> Transactions => Set<Transaction>();
    public DbSet<Goal> Goals => Set<Goal>();
    public DbSet<FinancialRule> FinancialRules => Set<FinancialRule>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("Users");

            entity.HasKey(x => x.Id);

            entity.Property(x => x.Name)
                .IsRequired()
                .HasMaxLength(150);

            entity.Property(x => x.Email)
                .IsRequired()
                .HasMaxLength(200);

            entity.Property(x => x.PasswordHash)
                .IsRequired()
                .HasMaxLength(500);

            entity.HasIndex(x => x.Email)
                .IsUnique();
        });

        modelBuilder.Entity<FinancialProfile>(entity =>
        {
            entity.ToTable("FinancialProfiles");

            entity.HasKey(x => x.Id);

            entity.Property(x => x.Name)
                .IsRequired()
                .HasMaxLength(120);

            entity.Property(x => x.Description)
                .HasMaxLength(300);

            entity.Property(x => x.InitialBalance)
                .HasColumnType("decimal(18,2)");

            entity.Property(x => x.IsPrimary)
                .IsRequired();

            entity.HasOne(x => x.User)
                .WithMany(x => x.FinancialProfiles)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Transaction>(entity =>
        {
            entity.ToTable("Transactions");

            entity.HasKey(x => x.Id);

            entity.Property(x => x.Title)
                .IsRequired()
                .HasMaxLength(150);

            entity.Property(x => x.Category)
                .IsRequired()
                .HasMaxLength(100);

            entity.Property(x => x.Amount)
                .HasColumnType("decimal(18,2)");

            entity.HasOne(x => x.FinancialProfile)
                .WithMany(x => x.Transactions)
                .HasForeignKey(x => x.FinancialProfileId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Goal>(entity =>
        {
            entity.ToTable("Goals");

            entity.HasKey(x => x.Id);

            entity.Property(x => x.Title)
                .IsRequired()
                .HasMaxLength(150);

            entity.Property(x => x.TargetAmount)
                .HasColumnType("decimal(18,2)");

            entity.Property(x => x.CurrentAmount)
                .HasColumnType("decimal(18,2)");

            entity.HasOne(x => x.FinancialProfile)
                .WithMany(x => x.Goals)
                .HasForeignKey(x => x.FinancialProfileId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<FinancialRule>(entity =>
        {
            entity.ToTable("FinancialRules");

            entity.HasKey(x => x.Id);

            entity.Property(x => x.Title)
                .IsRequired()
                .HasMaxLength(150);

            entity.Property(x => x.Amount)
                .HasColumnType("decimal(18,2)");

            entity.Property(x => x.DayOfMonth)
                .IsRequired();

            entity.Property(x => x.IsActive)
                .IsRequired();

            entity.HasOne(x => x.FinancialProfile)
                .WithMany(x => x.FinancialRules)
                .HasForeignKey(x => x.FinancialProfileId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        UpdateAuditFields();
        return base.SaveChangesAsync(cancellationToken);
    }

    public override int SaveChanges()
    {
        UpdateAuditFields();
        return base.SaveChanges();
    }

    private void UpdateAuditFields()
    {
        var entries = ChangeTracker
            .Entries()
            .Where(entry => entry.Entity is BaseEntity &&
                            (entry.State == EntityState.Added || entry.State == EntityState.Modified));

        foreach (var entry in entries)
        {
            var entity = (BaseEntity)entry.Entity;

            if (entry.State == EntityState.Added)
            {
                entity.CreatedAt = DateTime.UtcNow;
            }

            entity.UpdatedAt = DateTime.UtcNow;
        }
    }
}
