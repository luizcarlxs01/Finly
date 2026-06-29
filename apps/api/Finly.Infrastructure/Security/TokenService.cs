using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Finly.Application.DTOs.Auth;
using Finly.Application.Interfaces;
using Finly.Domain.Entities;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace Finly.Infrastructure.Security;

public class TokenService : ITokenService
{
    private readonly JwtSettings _jwtSettings;

    public TokenService(IOptions<JwtSettings> jwtOptions)
    {
        _jwtSettings = jwtOptions.Value;
    }

    public AuthResponseDto GenerateToken(User user)
    {
        var expiresAt = DateTime.UtcNow.AddMinutes(_jwtSettings.ExpirationInMinutes);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new(JwtRegisteredClaimNames.UniqueName, user.Name),
            new(ClaimTypes.NameIdentifier, user.Id.ToString())
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.SecretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var tokenDescriptor = new JwtSecurityToken(
            issuer: _jwtSettings.Issuer,
            audience: _jwtSettings.Audience,
            claims: claims,
            expires: expiresAt,
            signingCredentials: credentials
        );

        var token = new JwtSecurityTokenHandler().WriteToken(tokenDescriptor);

        return new AuthResponseDto
        {
            Token = token,
            ExpiresAt = expiresAt,
            UserId = user.Id,
            Name = user.Name,
            Email = user.Email
        };
    }
}
