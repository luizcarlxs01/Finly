using Finly.Application.Interfaces;
using Microsoft.Extensions.Options;

namespace Finly.Infrastructure.Security;

public class FrontendUrlProvider : IFrontendUrlProvider
{
    private readonly FrontendSettings _settings;

    public FrontendUrlProvider(IOptions<FrontendSettings> options)
    {
        _settings = options.Value;
    }

    public string BaseUrl => _settings.BaseUrl.TrimEnd('/');
}
