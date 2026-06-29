using Finly.Application.DTOs.Goals;
using Finly.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Finly.Api.Controllers;

[Route("api/[controller]")]
[Authorize]
public class GoalsController : ApiControllerBase
{
    private readonly IGoalService _goalService;

    public GoalsController(IGoalService goalService)
    {
        _goalService = goalService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] Guid financialProfileId,
        CancellationToken cancellationToken)
    {
        if (GetAuthenticatedUserId() is not { } userId)
            return Unauthorized();

        try
        {
            var goals = await _goalService.GetAllAsync(userId, financialProfileId, cancellationToken);

            return Ok(goals);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        if (GetAuthenticatedUserId() is not { } userId)
            return Unauthorized();

        var goal = await _goalService.GetByIdAsync(userId, id, cancellationToken);

        if (goal is null)
            return NotFound(new { message = "Meta não encontrada." });

        return Ok(goal);
    }

    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] CreateGoalRequestDto request,
        CancellationToken cancellationToken)
    {
        if (GetAuthenticatedUserId() is not { } userId)
            return Unauthorized();

        try
        {
            var createdGoal = await _goalService.CreateAsync(userId, request, cancellationToken);

            return CreatedAtAction(nameof(GetById), new { id = createdGoal.Id }, createdGoal);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(
        Guid id,
        [FromBody] UpdateGoalRequestDto request,
        CancellationToken cancellationToken)
    {
        if (GetAuthenticatedUserId() is not { } userId)
            return Unauthorized();

        try
        {
            var updatedGoal = await _goalService.UpdateAsync(userId, id, request, cancellationToken);

            return Ok(updatedGoal);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPatch("{id:guid}/progress")]
    public async Task<IActionResult> UpdateProgress(
        Guid id,
        [FromBody] UpdateGoalProgressRequestDto request,
        CancellationToken cancellationToken)
    {
        if (GetAuthenticatedUserId() is not { } userId)
            return Unauthorized();

        try
        {
            var updatedGoal = await _goalService.UpdateProgressAsync(userId, id, request, cancellationToken);

            return Ok(updatedGoal);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        if (GetAuthenticatedUserId() is not { } userId)
            return Unauthorized();

        try
        {
            await _goalService.DeleteAsync(userId, id, cancellationToken);

            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
