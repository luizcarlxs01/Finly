using System.Security.Claims;
using Finly.Application.DTOs.Rules;
using Finly.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Finly.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class RuleProcessingController : ControllerBase
{
    private readonly IRuleProcessingService _ruleProcessingService;

    public RuleProcessingController(IRuleProcessingService ruleProcessingService)
    {
        _ruleProcessingService = ruleProcessingService;
    }

    [HttpPost("{financialProfileId:guid}")]
    public async Task<IActionResult> Process(
        Guid financialProfileId,
        [FromBody] ProcessFinancialRulesRequestDto request,
        CancellationToken cancellationToken)
    {
        try
        {
            var userId = GetAuthenticatedUserId();

            var response = await _ruleProcessingService.ProcessAsync(
                userId,
                financialProfileId,
                request,
                cancellationToken);

            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    private Guid GetAuthenticatedUserId()
    {
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (string.IsNullOrWhiteSpace(userIdValue))
            throw new UnauthorizedAccessException("Usuário autenticado não encontrado no token.");

        return Guid.Parse(userIdValue);
    }
}
