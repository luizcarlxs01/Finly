using System.Security.Claims;
using Finly.Application.DTOs.Profiles;
using Finly.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Finly.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProfilesController : ControllerBase
{
    private readonly IProfileService _profileService;

    public ProfilesController(IProfileService profileService)
    {
        _profileService = profileService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var userId = GetAuthenticatedUserId();

        var profiles = await _profileService.GetAllAsync(userId, cancellationToken);

        return Ok(profiles);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var userId = GetAuthenticatedUserId();

        var profile = await _profileService.GetByIdAsync(userId, id, cancellationToken);

        if (profile is null)
            return NotFound(new { message = "Perfil não encontrado." });

        return Ok(profile);
    }

    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] CreateProfileRequestDto request,
        CancellationToken cancellationToken)
    {
        try
        {
            var userId = GetAuthenticatedUserId();

            var createdProfile = await _profileService.CreateAsync(userId, request, cancellationToken);

            return CreatedAtAction(nameof(GetById), new { id = createdProfile.Id }, createdProfile);
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
