using Finly.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Finly.Infrastructure.Data.Configurations;

public class EmailVerificationCodeConfiguration : IEntityTypeConfiguration<EmailVerificationCode>
{
    public void Configure(EntityTypeBuilder<EmailVerificationCode> builder)
    {
        builder.ToTable("EmailVerificationCodes");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.CodeHash)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(x => x.ExpiresAt)
            .IsRequired();

        builder.Property(x => x.AttemptCount)
            .IsRequired();

        builder.HasOne(x => x.User)
            .WithMany()
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(x => new { x.UserId, x.ConsumedAt })
            .HasDatabaseName("IX_EmailVerificationCodes_UserId_ConsumedAt");
    }
}
