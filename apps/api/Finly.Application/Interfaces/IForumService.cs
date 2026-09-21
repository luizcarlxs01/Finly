using Finly.Application.DTOs.Forum;
using Finly.Domain.Enums;

namespace Finly.Application.Interfaces;

public interface IForumService
{
    Task<TopicDetailDto> CreateTopicAsync(
        CreateTopicRequestDto request,
        Guid? userId,
        CancellationToken cancellationToken = default);

    Task<List<TopicSummaryDto>> GetPublishedTopicsAsync(CancellationToken cancellationToken = default);

    Task<TopicDetailDto?> GetPublishedTopicByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<List<TopicSummaryDto>> GetAdminTopicsAsync(
        TopicStatus? statusFilter,
        CancellationToken cancellationToken = default);

    Task<TopicDetailDto?> GetAdminTopicByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task SetStatusAsync(Guid id, TopicStatus status, CancellationToken cancellationToken = default);

    Task<TopicReplyDto> ReplyAsync(
        Guid topicId,
        CreateReplyRequestDto request,
        CancellationToken cancellationToken = default);
}
