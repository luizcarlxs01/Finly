using System.Security.Claims;
using Finly.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Finly.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboardService;

    public DashboardController(IDashboardService dashboardService)
    {
        _dashboardService = dashboardService;
    }

    [HttpGet("{financialProfileId:guid}")]
    public async Task<IActionResult> GetSummary(Guid financialProfileId, CancellationToken cancellationToken)
    {
        try
        {
            var userId = GetAuthenticatedUserId();

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

    private Guid GetAuthenticatedUserId()
    {
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (string.IsNullOrWhiteSpace(userIdValue))
            throw new UnauthorizedAccessException("Usuário autenticado não encontrado no token.");

        return Guid.Parse(userIdValue);
    }
}
