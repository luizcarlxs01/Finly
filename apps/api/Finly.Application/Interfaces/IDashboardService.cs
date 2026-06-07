using Finly.Application.DTOs.Dashboard;

namespace Finly.Application.Interfaces;

public interface IDashboardService
{
    Task<DashboardSummaryResponseDto> GetSummaryAsync(
        Guid userId,
        Guid financialProfileId,
        CancellationToken cancellationToken = default);
}
