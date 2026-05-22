using Finly.Application.DTOs.Auth;
using Finly.Domain.Entities;

namespace Finly.Application.Interfaces;

public interface ITokenService
{
    AuthResponseDto GenerateToken(User user);
}
