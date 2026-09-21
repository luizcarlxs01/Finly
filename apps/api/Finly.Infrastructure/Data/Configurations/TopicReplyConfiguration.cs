using Finly.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Finly.Infrastructure.Data.Configurations;

public class TopicReplyConfiguration : IEntityTypeConfiguration<TopicReply>
{
    public void Configure(EntityTypeBuilder<TopicReply> builder)
    {
        builder.ToTable("TopicReplies");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Body)
            .IsRequired()
            .HasMaxLength(2000);

        builder.Property(x => x.IsFromAdmin)
            .IsRequired();

        builder.HasOne(x => x.Topic)
            .WithMany(x => x.Replies)
            .HasForeignKey(x => x.TopicId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
