using Finly.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Finly.Infrastructure.Data.Configurations;

public class ArrangementConfiguration : IEntityTypeConfiguration<Arrangement>
{
    public void Configure(EntityTypeBuilder<Arrangement> builder)
    {
        builder.ToTable("Arrangements");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Amount)
            .HasColumnType("decimal(18,2)");

        builder.Property(x => x.DueDate)
            .IsRequired();

        builder.Property(x => x.Status)
            .IsRequired();

        builder.Property(x => x.IsCustomized)
            .IsRequired();

        builder.HasOne(x => x.Transaction)
            .WithMany(x => x.Arrangements)
            .HasForeignKey(x => x.TransactionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(x => new { x.TransactionId, x.DueDate })
            .HasDatabaseName("IX_Arrangements_TransactionId_DueDate");

        builder.HasIndex(x => new { x.DueDate, x.Status })
            .HasDatabaseName("IX_Arrangements_DueDate_Status");

        builder.HasIndex(x => new { x.TransactionId, x.InstallmentIndex })
            .IsUnique()
            .HasDatabaseName("IX_Arrangements_TransactionId_InstallmentIndex")
            .HasFilter("[InstallmentIndex] IS NOT NULL");
    }
}
