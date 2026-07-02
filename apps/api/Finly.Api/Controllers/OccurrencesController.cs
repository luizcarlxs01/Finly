using Finly.Application.DTOs.Occurrences;
using Finly.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Finly.Api.Controllers;

[Route("api/[controller]")]
[Authorize]
public class OccurrencesController : ApiControllerBase
{
    private readonly IOccurrenceService _occurrenceService;

    public OccurrencesController(IOccurrenceService occurrenceService)
    {
        _occurrenceService = occurrenceService;
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        if (GetAuthenticatedUserId() is not { } userId)
            return Unauthorized();

        var occurrence = await _occurrenceService.GetByIdAsync(userId, id, cancellationToken);

        if (occurrence is null)
            return NotFound(new { message = "Ocorrência não encontrada." });

        return Ok(occurrence);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(
        Guid id,
        [FromBody] UpdateOccurrenceRequestDto request,
        CancellationToken cancellationToken)
    {
        if (GetAuthenticatedUserId() is not { } userId)
            return Unauthorized();

        try
        {
            var updatedOccurrence = await _occurrenceService.UpdateAsync(userId, id, request, cancellationToken);

            return Ok(updatedOccurrence);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPatch("{id:guid}/mark-paid")]
    public async Task<IActionResult> MarkAsPaid(Guid id, CancellationToken cancellationToken)
    {
        if (GetAuthenticatedUserId() is not { } userId)
            return Unauthorized();

        try
        {
            var updatedOccurrence = await _occurrenceService.MarkAsPaidAsync(userId, id, cancellationToken);

            return Ok(updatedOccurrence);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPatch("{id:guid}/mark-pending")]
    public async Task<IActionResult> MarkAsPending(Guid id, CancellationToken cancellationToken)
    {
        if (GetAuthenticatedUserId() is not { } userId)
            return Unauthorized();

        try
        {
            var updatedOccurrence = await _occurrenceService.MarkAsPendingAsync(userId, id, cancellationToken);

            return Ok(updatedOccurrence);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
