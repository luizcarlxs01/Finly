using Finly.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Finly.Infrastructure.Data.Configurations;

public class OccurrenceConfiguration : IEntityTypeConfiguration<Occurrence>
{
    public void Configure(EntityTypeBuilder<Occurrence> builder)
    {
        builder.ToTable("Occurrences");

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
            .WithMany(x => x.Occurrences)
            .HasForeignKey(x => x.TransactionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(x => new { x.TransactionId, x.DueDate })
            .HasDatabaseName("IX_Occurrences_TransactionId_DueDate");

        builder.HasIndex(x => new { x.DueDate, x.Status })
            .HasDatabaseName("IX_Occurrences_DueDate_Status");

        builder.HasIndex(x => new { x.TransactionId, x.InstallmentIndex })
            .IsUnique()
            .HasDatabaseName("IX_Occurrences_TransactionId_InstallmentIndex")
            .HasFilter("[InstallmentIndex] IS NOT NULL");
    }
}
