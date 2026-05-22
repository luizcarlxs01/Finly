using Finly.Application.Interfaces;
using Microsoft.Extensions.DependencyInjection;

namespace Finly.Application.Services;

public static class ApplicationServiceExtensions
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IProfileService, ProfileService>();
        services.AddScoped<ITransactionService, TransactionService>();

        return services;
    }
}
