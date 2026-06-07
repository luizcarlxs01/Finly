using Finly.Application.DTOs.Profiles;
using Finly.Application.Interfaces;
using Finly.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Finly.Application.Services;

public class ProfileService : IProfileService
{
    private readonly IAppDbContext _context;

    public ProfileService(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<ProfileResponseDto>> GetAllAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        return await _context.FinancialProfiles
            .Where(x => x.UserId == userId)
            .OrderBy(x => x.CreatedAt)
            .Select(x => new ProfileResponseDto
            {
                Id = x.Id,
                Name = x.Name,
                Description = x.Description,
                InitialBalance = x.InitialBalance,
                CreatedAt = x.CreatedAt
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<ProfileResponseDto?> GetByIdAsync(
        Guid userId,
        Guid profileId,
        CancellationToken cancellationToken = default)
    {
        return await _context.FinancialProfiles
            .Where(x => x.UserId == userId && x.Id == profileId)
            .Select(x => new ProfileResponseDto
            {
                Id = x.Id,
                Name = x.Name,
                Description = x.Description,
                InitialBalance = x.InitialBalance,
                CreatedAt = x.CreatedAt
            })
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<ProfileResponseDto> CreateAsync(
        Guid userId,
        CreateProfileRequestDto request,
        CancellationToken cancellationToken = default)
    {
        var name = request.Name.Trim();
        var description = string.IsNullOrWhiteSpace(request.Description)
            ? null
            : request.Description.Trim();

        if (string.IsNullOrWhiteSpace(name))
            throw new InvalidOperationException("O nome do perfil é obrigatório.");

        var profile = new FinancialProfile
        {
            UserId = userId,
            Name = name,
            Description = description,
            InitialBalance = request.InitialBalance
        };

        _context.FinancialProfiles.Add(profile);
        await _context.SaveChangesAsync(cancellationToken);

        return new ProfileResponseDto
        {
            Id = profile.Id,
            Name = profile.Name,
            Description = profile.Description,
            InitialBalance = profile.InitialBalance,
            CreatedAt = profile.CreatedAt
        };
    }

    public async Task<ProfileResponseDto> UpdateAsync(
        Guid userId,
        Guid profileId,
        UpdateProfileRequestDto request,
        CancellationToken cancellationToken = default)
    {
        var profile = await _context.FinancialProfiles
            .FirstOrDefaultAsync(x => x.Id == profileId && x.UserId == userId, cancellationToken);

        if (profile is null)
            throw new InvalidOperationException("Perfil não encontrado.");

        var name = request.Name.Trim();
        var description = string.IsNullOrWhiteSpace(request.Description)
            ? null
            : request.Description.Trim();

        if (string.IsNullOrWhiteSpace(name))
            throw new InvalidOperationException("O nome do perfil é obrigatório.");

        profile.Name = name;
        profile.Description = description;
        profile.InitialBalance = request.InitialBalance;

        await _context.SaveChangesAsync(cancellationToken);

        return new ProfileResponseDto
        {
            Id = profile.Id,
            Name = profile.Name,
            Description = profile.Description,
            InitialBalance = profile.InitialBalance,
            CreatedAt = profile.CreatedAt
        };
    }
}
