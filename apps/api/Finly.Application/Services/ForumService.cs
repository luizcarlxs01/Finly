using Finly.Application.DTOs.Forum;
using Finly.Application.Interfaces;
using Finly.Domain.Entities;
using Finly.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Finly.Application.Services;

public class ForumService : IForumService
{
    private readonly IAppDbContext _context;
    private readonly IEmailDomainValidationService _emailDomainValidationService;
    private readonly IContentModerationService _moderationService;
    private readonly IEmailSender _emailSender;

    public ForumService(
        IAppDbContext context,
        IEmailDomainValidationService emailDomainValidationService,
        IContentModerationService moderationService,
        IEmailSender emailSender)
    {
        _context = context;
        _emailDomainValidationService = emailDomainValidationService;
        _moderationService = moderationService;
        _emailSender = emailSender;
    }

    public async Task<TopicDetailDto> CreateTopicAsync(
        CreateTopicRequestDto request,
        Guid? userId,
        CancellationToken cancellationToken = default)
    {
        var title = request.Title.Trim();
        var body = request.Body.Trim();
        var authorName = request.AuthorName.Trim();
        var authorEmail = request.AuthorEmail.Trim().ToLowerInvariant();

        if (string.IsNullOrWhiteSpace(title))
            throw new InvalidOperationException("O título é obrigatório.");

        if (string.IsNullOrWhiteSpace(body))
            throw new InvalidOperationException("A descrição é obrigatória.");

        if (string.IsNullOrWhiteSpace(authorName))
            throw new InvalidOperationException("O nome é obrigatório.");

        var hasValidDomain = await _emailDomainValidationService.HasValidMxRecordAsync(authorEmail, cancellationToken);
        if (!hasValidDomain)
            throw new InvalidOperationException("O domínio do e-mail informado não parece existir ou não pode receber e-mails.");

        var moderation = _moderationService.Analyze(title, body);

        var topic = new Topic
        {
            Title = title,
            Body = body,
            AuthorName = authorName,
            AuthorEmail = authorEmail,
            UserId = userId,
            Status = moderation.IsFlagged ? TopicStatus.PendingReview : TopicStatus.Published,
            ModerationReason = moderation.Reason
        };

        _context.Topics.Add(topic);
        await _context.SaveChangesAsync(cancellationToken);

        return MapToDetail(topic);
    }

    public async Task<List<TopicSummaryDto>> GetPublishedTopicsAsync(CancellationToken cancellationToken = default)
    {
        // Mapeamento em memória, não em .Select() traduzido pro SQL: Enum.ToString()
        // não é traduzível pelo EF Core, e MapToSummary depende de Replies carregado.
        var topics = await _context.Topics
            .Include(x => x.Replies)
            .Where(x => x.Status == TopicStatus.Published)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync(cancellationToken);

        return topics.Select(MapToSummary).ToList();
    }

    public async Task<TopicDetailDto?> GetPublishedTopicByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var topic = await _context.Topics
            .Include(x => x.Replies)
            .FirstOrDefaultAsync(x => x.Id == id && x.Status == TopicStatus.Published, cancellationToken);

        return topic is null ? null : MapToDetail(topic);
    }

    public async Task<List<TopicSummaryDto>> GetAdminTopicsAsync(
        TopicStatus? statusFilter,
        CancellationToken cancellationToken = default)
    {
        var query = _context.Topics.Include(x => x.Replies).AsQueryable();

        if (statusFilter is { } status)
        {
            query = query.Where(x => x.Status == status);
        }

        var topics = await query
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync(cancellationToken);

        return topics.Select(MapToSummary).ToList();
    }

    public async Task<TopicDetailDto?> GetAdminTopicByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var topic = await _context.Topics
            .Include(x => x.Replies)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

        return topic is null ? null : MapToDetail(topic);
    }

    public async Task SetStatusAsync(Guid id, TopicStatus status, CancellationToken cancellationToken = default)
    {
        var topic = await _context.Topics.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

        if (topic is null)
            throw new InvalidOperationException("Tópico não encontrado.");

        topic.Status = status;
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<TopicReplyDto> ReplyAsync(
        Guid topicId,
        CreateReplyRequestDto request,
        CancellationToken cancellationToken = default)
    {
        var body = request.Body.Trim();

        if (string.IsNullOrWhiteSpace(body))
            throw new InvalidOperationException("A resposta não pode ser vazia.");

        var topic = await _context.Topics.FirstOrDefaultAsync(x => x.Id == topicId, cancellationToken);

        if (topic is null)
            throw new InvalidOperationException("Tópico não encontrado.");

        var reply = new TopicReply
        {
            TopicId = topicId,
            Body = body,
            IsFromAdmin = true
        };

        _context.TopicReplies.Add(reply);
        await _context.SaveChangesAsync(cancellationToken);

        var subject = $"Resposta ao seu tópico \"{topic.Title}\" no Finly";
        var html = $"""
            <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
                <h2 style="color: #0B275E;">Você recebeu uma resposta</h2>
                <p>Sobre o tópico <strong>{topic.Title}</strong>:</p>
                <p style="border-left: 3px solid #0B275E; padding-left: 12px; color: #333;">{body}</p>
                <p style="color: #666; font-size: 13px;">Você pode ver a conversa completa no fórum do Finly.</p>
            </div>
            """;

        await _emailSender.SendAsync(topic.AuthorEmail, subject, html, cancellationToken);

        return MapToReplyDto(reply);
    }

    private static TopicSummaryDto MapToSummary(Topic topic) => new()
    {
        Id = topic.Id,
        Title = topic.Title,
        AuthorName = topic.AuthorName,
        Status = topic.Status.ToString(),
        ModerationReason = topic.ModerationReason,
        ReplyCount = topic.Replies.Count,
        CreatedAt = topic.CreatedAt
    };

    private static TopicDetailDto MapToDetail(Topic topic) => new()
    {
        Id = topic.Id,
        Title = topic.Title,
        Body = topic.Body,
        AuthorName = topic.AuthorName,
        Status = topic.Status.ToString(),
        ModerationReason = topic.ModerationReason,
        CreatedAt = topic.CreatedAt,
        Replies = topic.Replies
            .OrderBy(x => x.CreatedAt)
            .Select(MapToReplyDto)
            .ToList()
    };

    private static TopicReplyDto MapToReplyDto(TopicReply reply) => new()
    {
        Id = reply.Id,
        Body = reply.Body,
        IsFromAdmin = reply.IsFromAdmin,
        CreatedAt = reply.CreatedAt
    };
}
