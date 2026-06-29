using Finly.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Finly.Api.Controllers;

[Route("api/[controller]")]
[Authorize]
public class DashboardController : ApiControllerBase
{
    private readonly IDashboardService _dashboardService;

    public DashboardController(IDashboardService dashboardService)
    {
        _dashboardService = dashboardService;
    }

    [HttpGet("{financialProfileId:guid}")]
    public async Task<IActionResult> GetSummary(Guid financialProfileId, CancellationToken cancellationToken)
    {
        if (GetAuthenticatedUserId() is not { } userId)
            return Unauthorized();

        try
        {
            var summary = await _dashboardService.GetSummaryAsync(
                userId,
                financialProfileId,
                cancellationToken);

            return Ok(summary);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
