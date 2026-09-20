using Finly.Application.DTOs.Auth;
using Finly.Application.Interfaces;
using Finly.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Finly.Application.Services;

public class AuthService : IAuthService
{
    private readonly IAppDbContext _context;
    private readonly IPasswordHasherService _passwordHasherService;
    private readonly ITokenService _tokenService;
    private readonly IEmailDomainValidationService _emailDomainValidationService;
    private readonly IEmailVerificationService _emailVerificationService;

    public AuthService(
        IAppDbContext context,
        IPasswordHasherService passwordHasherService,
        ITokenService tokenService,
        IEmailDomainValidationService emailDomainValidationService,
        IEmailVerificationService emailVerificationService)
    {
        _context = context;
        _passwordHasherService = passwordHasherService;
        _tokenService = tokenService;
        _emailDomainValidationService = emailDomainValidationService;
        _emailVerificationService = emailVerificationService;
    }

    public async Task<AuthResponseDto> RegisterAsync(
        RegisterRequestDto request,
        CancellationToken cancellationToken = default)
    {
        var name = request.Name.Trim();
        var email = request.Email.Trim().ToLowerInvariant();
        var password = request.Password.Trim();

        if (string.IsNullOrWhiteSpace(name))
            throw new InvalidOperationException("O nome é obrigatório.");

        if (string.IsNullOrWhiteSpace(email))
            throw new InvalidOperationException("O e-mail é obrigatório.");

        if (string.IsNullOrWhiteSpace(password))
            throw new InvalidOperationException("A senha é obrigatória.");

        if (password.Length < 8)
            throw new InvalidOperationException("A senha deve ter no mínimo 8 caracteres.");

        var hasValidDomain = await _emailDomainValidationService.HasValidMxRecordAsync(email, cancellationToken);
        if (!hasValidDomain)
            throw new InvalidOperationException("O domínio do e-mail informado não parece existir ou não pode receber e-mails.");

        var userAlreadyExists = await _context.Users
            .AnyAsync(x => x.Email == email, cancellationToken);

        if (userAlreadyExists)
            throw new InvalidOperationException("Já existe um usuário cadastrado com este e-mail.");

        var user = new User
        {
            Name = name,
            Email = email,
            PasswordHash = _passwordHasherService.HashPassword(password)
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync(cancellationToken);

        var defaultProfile = new FinancialProfile
        {
            UserId = user.Id,
            Name = "Perfil principal",
            Description = "Perfil criado automaticamente no cadastro.",
            InitialBalance = 0,
            IsPrimary = true
        };

        _context.FinancialProfiles.Add(defaultProfile);
        await _context.SaveChangesAsync(cancellationToken);

        await _emailVerificationService.GenerateAndSendCodeAsync(user, cancellationToken);

        return new AuthResponseDto
        {
            RequiresVerification = true,
            Name = user.Name,
            Email = user.Email
        };
    }

    public async Task<AuthResponseDto> LoginAsync(
        LoginRequestDto request,
        CancellationToken cancellationToken = default)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var password = request.Password.Trim();

        if (string.IsNullOrWhiteSpace(email))
            throw new InvalidOperationException("O e-mail é obrigatório.");

        if (string.IsNullOrWhiteSpace(password))
            throw new InvalidOperationException("A senha é obrigatória.");

        var user = await _context.Users
            .FirstOrDefaultAsync(x => x.Email == email, cancellationToken);

        if (user is null)
            throw new InvalidOperationException("E-mail ou senha inválidos.");

        var passwordIsValid = _passwordHasherService.VerifyPassword(password, user.PasswordHash);

        if (!passwordIsValid)
            throw new InvalidOperationException("E-mail ou senha inválidos.");

        var newHash = _passwordHasherService.GetRehashIfNeeded(password, user.PasswordHash);
        if (newHash is not null)
        {
            user.PasswordHash = newHash;
            await _context.SaveChangesAsync(cancellationToken);
        }

        if (!user.EmailVerified)
        {
            await _emailVerificationService.GenerateAndSendCodeAsync(user, cancellationToken);

            return new AuthResponseDto
            {
                RequiresVerification = true,
                Name = user.Name,
                Email = user.Email
            };
        }

        return _tokenService.GenerateToken(user);
    }

    public async Task<AuthResponseDto> VerifyEmailCodeAsync(
        VerifyEmailCodeRequestDto request,
        CancellationToken cancellationToken = default)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var code = request.Code.Trim();

        var user = await _context.Users
            .FirstOrDefaultAsync(x => x.Email == email, cancellationToken);

        if (user is null)
            throw new InvalidOperationException("Código inválido ou expirado.");

        var codeIsValid = await _emailVerificationService.VerifyCodeAsync(user, code, cancellationToken);

        if (!codeIsValid)
            throw new InvalidOperationException("Código inválido ou expirado.");

        if (!user.EmailVerified)
        {
            user.EmailVerified = true;
            await _context.SaveChangesAsync(cancellationToken);
        }

        return _tokenService.GenerateToken(user);
    }

    public async Task ResendVerificationCodeAsync(
        ResendVerificationCodeRequestDto request,
        CancellationToken cancellationToken = default)
    {
        var email = request.Email.Trim().ToLowerInvariant();

        var user = await _context.Users
            .FirstOrDefaultAsync(x => x.Email == email, cancellationToken);

        if (user is null)
            throw new InvalidOperationException("Não foi possível reenviar o código.");

        if (user.EmailVerified)
            throw new InvalidOperationException("Este e-mail já foi verificado.");

        await _emailVerificationService.GenerateAndSendCodeAsync(user, cancellationToken);
    }
}
