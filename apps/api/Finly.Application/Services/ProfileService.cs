using Finly.Application.DTOs.Profiles;
using Finly.Application.Interfaces;
using Finly.Domain.Entities;
using Finly.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Finly.Application.Services;

public class ProfileService : IProfileService
{
    // Perfil Personalizado sem "Mais ou menos" explícito: deriva proporcionalmente
    // do valor de "Bom" informado, mesma razão do perfil Padrao (500/2000).
    private const decimal PersonalizadoOkRatio = 0.25m;

    private readonly IAppDbContext _context;

    public ProfileService(IAppDbContext context)
    {
        _context = context;
    }

    private static SpendingProfile ParseSpendingProfileOrDefault(string? value, SpendingProfile fallback)
    {
        if (string.IsNullOrWhiteSpace(value))
            return fallback;

        if (!Enum.TryParse<SpendingProfile>(value, ignoreCase: true, out var parsed))
            throw new InvalidOperationException("Perfil de gastos inválido.");

        return parsed;
    }

    /// <summary>
    /// Valida e normaliza os limiares do perfil Personalizado. Perfis prontos
    /// (Economico/Padrao/Gastao) não guardam limiar no banco — os valores fixos
    /// vivem no cliente (web/mobile), mesma lógica em ambos.
    /// </summary>
    private static (decimal? Ok, decimal? Good) NormalizeThresholds(
        SpendingProfile spendingProfile,
        decimal? okThreshold,
        decimal? goodThreshold)
    {
        if (spendingProfile != SpendingProfile.Personalizado)
            return (null, null);

        if (goodThreshold is null || goodThreshold <= 0)
            throw new InvalidOperationException(
                "Informe o valor de \"Bom\" para o perfil de gastos personalizado.");

        if (okThreshold is null)
            return (Math.Round(goodThreshold.Value * PersonalizadoOkRatio, 2), goodThreshold);

        if (okThreshold < 0)
            throw new InvalidOperationException(
                "O valor de \"Mais ou menos\" não pode ser negativo.");

        if (okThreshold >= goodThreshold)
            throw new InvalidOperationException(
                "O valor de \"Mais ou menos\" deve ser menor que o valor de \"Bom\".");

        return (okThreshold, goodThreshold);
    }

    public async Task<IReadOnlyList<ProfileResponseDto>> GetAllAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        // Materializa antes de mapear: Enum.ToString() (em MapToResponse) não é
        // traduzível pelo EF Core numa projeção LINQ-to-SQL (mesma questão do
        // ForumService com TopicStatus).
        var profiles = await _context.FinancialProfiles
            .Where(x => x.UserId == userId)
            .OrderByDescending(x => x.IsPrimary)
            .ThenBy(x => x.CreatedAt)
            .ToListAsync(cancellationToken);

        return profiles.Select(MapToResponse).ToList();
    }

    public async Task<ProfileResponseDto?> GetByIdAsync(
        Guid userId,
        Guid profileId,
        CancellationToken cancellationToken = default)
    {
        var profile = await _context.FinancialProfiles
            .FirstOrDefaultAsync(x => x.UserId == userId && x.Id == profileId, cancellationToken);

        return profile is null ? null : MapToResponse(profile);
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

        var spendingProfile = ParseSpendingProfileOrDefault(request.SpendingProfile, SpendingProfile.Padrao);
        var (okThreshold, goodThreshold) = NormalizeThresholds(
            spendingProfile, request.CustomOkThreshold, request.CustomGoodThreshold);

        var profile = new FinancialProfile
        {
            UserId = userId,
            Name = name,
            Description = description,
            InitialBalance = request.InitialBalance,
            IsPrimary = false,
            SpendingProfile = spendingProfile,
            CustomOkThreshold = okThreshold,
            CustomGoodThreshold = goodThreshold
        };

        _context.FinancialProfiles.Add(profile);
        await _context.SaveChangesAsync(cancellationToken);

        return MapToResponse(profile);
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

        if (!string.IsNullOrWhiteSpace(request.SpendingProfile))
        {
            var spendingProfile = ParseSpendingProfileOrDefault(request.SpendingProfile, profile.SpendingProfile);
            var (okThreshold, goodThreshold) = NormalizeThresholds(
                spendingProfile, request.CustomOkThreshold, request.CustomGoodThreshold);

            profile.SpendingProfile = spendingProfile;
            profile.CustomOkThreshold = okThreshold;
            profile.CustomGoodThreshold = goodThreshold;
        }

        await _context.SaveChangesAsync(cancellationToken);

        return MapToResponse(profile);
    }

    public async Task DeleteAsync(
        Guid userId,
        Guid profileId,
        CancellationToken cancellationToken = default)
    {
        var profile = await _context.FinancialProfiles
            .FirstOrDefaultAsync(x => x.Id == profileId && x.UserId == userId, cancellationToken);

        if (profile is null)
            throw new InvalidOperationException("Perfil não encontrado.");

        if (profile.IsPrimary)
            throw new InvalidOperationException("O perfil principal não pode ser excluído.");

        _context.FinancialProfiles.Remove(profile);
        await _context.SaveChangesAsync(cancellationToken);
    }

    private static ProfileResponseDto MapToResponse(FinancialProfile profile) => new()
    {
        Id = profile.Id,
        Name = profile.Name,
        Description = profile.Description,
        InitialBalance = profile.InitialBalance,
        IsPrimary = profile.IsPrimary,
        SpendingProfile = profile.SpendingProfile.ToString(),
        CustomOkThreshold = profile.CustomOkThreshold,
        CustomGoodThreshold = profile.CustomGoodThreshold,
        CreatedAt = profile.CreatedAt
    };
}
