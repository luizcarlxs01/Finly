using Finly.Application.DTOs.Profiles;

namespace Finly.Application.Interfaces;

public interface IProfileService
{
    Task<IReadOnlyList<ProfileResponseDto>> GetAllAsync(Guid userId, CancellationToken cancellationToken = default);

    Task<ProfileResponseDto?> GetByIdAsync(Guid userId, Guid profileId, CancellationToken cancellationToken = default);

    Task<ProfileResponseDto> CreateAsync(Guid userId, CreateProfileRequestDto request, CancellationToken cancellationToken = default);

    Task<ProfileResponseDto> UpdateAsync(Guid userId, Guid profileId, UpdateProfileRequestDto request, CancellationToken cancellationToken = default);
}
