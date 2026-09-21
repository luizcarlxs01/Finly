using Finly.Application.DTOs.Forum;
using Finly.Application.Interfaces;
using Finly.Domain.Enums;
using Finly.Infrastructure.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Options;

namespace Finly.Api.Controllers;

[Route("api/forum")]
public class ForumController : ApiControllerBase
{
    private readonly IForumService _forumService;
    private readonly AdminSettings _adminSettings;

    public ForumController(IForumService forumService, IOptions<AdminSettings> adminOptions)
    {
        _forumService = forumService;
        _adminSettings = adminOptions.Value;
    }

    [AllowAnonymous]
    [EnableRateLimiting("forum-post")]
    [HttpPost("topics")]
    public async Task<IActionResult> CreateTopic(
        [FromBody] CreateTopicRequestDto request,
        CancellationToken cancellationToken)
    {
        try
        {
            var topic = await _forumService.CreateTopicAsync(request, GetAuthenticatedUserId(), cancellationToken);
            return CreatedAtAction(nameof(GetTopic), new { id = topic.Id }, topic);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [AllowAnonymous]
    [HttpGet("topics")]
    public async Task<IActionResult> GetTopics(CancellationToken cancellationToken)
    {
        var topics = await _forumService.GetPublishedTopicsAsync(cancellationToken);
        return Ok(topics);
    }

    [AllowAnonymous]
    [HttpGet("topics/{id:guid}")]
    public async Task<IActionResult> GetTopic(Guid id, CancellationToken cancellationToken)
    {
        var topic = await _forumService.GetPublishedTopicByIdAsync(id, cancellationToken);

        if (topic is null)
            return NotFound(new { message = "Tópico não encontrado." });

        return Ok(topic);
    }

    [Authorize]
    [HttpGet("admin/topics")]
    public async Task<IActionResult> GetAdminTopics(
        [FromQuery] TopicStatus? status,
        CancellationToken cancellationToken)
    {
        if (!IsAdmin())
            return Forbid();

        var topics = await _forumService.GetAdminTopicsAsync(status, cancellationToken);
        return Ok(topics);
    }

    [Authorize]
    [HttpGet("admin/topics/{id:guid}")]
    public async Task<IActionResult> GetAdminTopic(Guid id, CancellationToken cancellationToken)
    {
        if (!IsAdmin())
            return Forbid();

        var topic = await _forumService.GetAdminTopicByIdAsync(id, cancellationToken);

        if (topic is null)
            return NotFound(new { message = "Tópico não encontrado." });

        return Ok(topic);
    }

    [Authorize]
    [HttpPut("admin/topics/{id:guid}/status")]
    public async Task<IActionResult> UpdateStatus(
        Guid id,
        [FromBody] UpdateTopicStatusRequestDto request,
        CancellationToken cancellationToken)
    {
        if (!IsAdmin())
            return Forbid();

        if (!Enum.TryParse<TopicStatus>(request.Status, ignoreCase: true, out var status))
            return BadRequest(new { message = "Status inválido." });

        try
        {
            await _forumService.SetStatusAsync(id, status, cancellationToken);
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [Authorize]
    [HttpPost("admin/topics/{id:guid}/reply")]
    public async Task<IActionResult> Reply(
        Guid id,
        [FromBody] CreateReplyRequestDto request,
        CancellationToken cancellationToken)
    {
        if (!IsAdmin())
            return Forbid();

        try
        {
            var reply = await _forumService.ReplyAsync(id, request, cancellationToken);
            return Ok(reply);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    private bool IsAdmin()
    {
        var email = GetAuthenticatedEmail();
        return !string.IsNullOrWhiteSpace(email)
               && !string.IsNullOrWhiteSpace(_adminSettings.Email)
               && string.Equals(email, _adminSettings.Email, StringComparison.OrdinalIgnoreCase);
    }
}
