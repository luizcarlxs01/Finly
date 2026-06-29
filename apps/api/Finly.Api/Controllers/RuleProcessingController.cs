using Finly.Application.DTOs.Rules;
using Finly.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Finly.Api.Controllers;

[Route("api/[controller]")]
[Authorize]
public class RuleProcessingController : ApiControllerBase
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
        if (GetAuthenticatedUserId() is not { } userId)
            return Unauthorized();

        try
        {
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
}
