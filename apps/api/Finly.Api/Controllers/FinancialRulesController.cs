using Finly.Application.DTOs.Rules;
using Finly.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Finly.Api.Controllers;

[Route("api/[controller]")]
[Authorize]
public class FinancialRulesController : ApiControllerBase
{
    private readonly IFinancialRuleService _financialRuleService;

    public FinancialRulesController(IFinancialRuleService financialRuleService)
    {
        _financialRuleService = financialRuleService;
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
            var rules = await _financialRuleService.GetAllAsync(
                userId,
                financialProfileId,
                cancellationToken);

            return Ok(rules);
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

        var rule = await _financialRuleService.GetByIdAsync(userId, id, cancellationToken);

        if (rule is null)
            return NotFound(new { message = "Regra não encontrada." });

        return Ok(rule);
    }

    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] CreateFinancialRuleRequestDto request,
        CancellationToken cancellationToken)
    {
        if (GetAuthenticatedUserId() is not { } userId)
            return Unauthorized();

        try
        {
            var createdRule = await _financialRuleService.CreateAsync(
                userId,
                request,
                cancellationToken);

            return CreatedAtAction(nameof(GetById), new { id = createdRule.Id }, createdRule);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(
        Guid id,
        [FromBody] UpdateFinancialRuleRequestDto request,
        CancellationToken cancellationToken)
    {
        if (GetAuthenticatedUserId() is not { } userId)
            return Unauthorized();

        try
        {
            var updatedRule = await _financialRuleService.UpdateAsync(
                userId,
                id,
                request,
                cancellationToken);

            return Ok(updatedRule);
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
            await _financialRuleService.DeleteAsync(userId, id, cancellationToken);

            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
