using Finly.Application.DTOs.Profiles;
using Finly.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Finly.Api.Controllers;

[Route("api/[controller]")]
[Authorize]
public class ProfilesController : ApiControllerBase
{
    private readonly IProfileService _profileService;

    public ProfilesController(IProfileService profileService)
    {
        _profileService = profileService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        if (GetAuthenticatedUserId() is not { } userId)
            return Unauthorized();

        var profiles = await _profileService.GetAllAsync(userId, cancellationToken);

        return Ok(profiles);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        if (GetAuthenticatedUserId() is not { } userId)
            return Unauthorized();

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
        if (GetAuthenticatedUserId() is not { } userId)
            return Unauthorized();

        try
        {
            var createdProfile = await _profileService.CreateAsync(userId, request, cancellationToken);

            return CreatedAtAction(nameof(GetById), new { id = createdProfile.Id }, createdProfile);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(
        Guid id,
        [FromBody] UpdateProfileRequestDto request,
        CancellationToken cancellationToken)
    {
        if (GetAuthenticatedUserId() is not { } userId)
            return Unauthorized();

        try
        {
            var updatedProfile = await _profileService.UpdateAsync(userId, id, request, cancellationToken);

            return Ok(updatedProfile);
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
            await _profileService.DeleteAsync(userId, id, cancellationToken);

            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
