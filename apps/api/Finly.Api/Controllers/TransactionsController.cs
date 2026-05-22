using System.Security.Claims;
using Finly.Application.DTOs.Transactions;
using Finly.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Finly.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TransactionsController : ControllerBase
{
    private readonly ITransactionService _transactionService;

    public TransactionsController(ITransactionService transactionService)
    {
        _transactionService = transactionService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] Guid financialProfileId,
        CancellationToken cancellationToken)
    {
        try
        {
            var userId = GetAuthenticatedUserId();

            var transactions = await _transactionService.GetAllAsync(
                userId,
                financialProfileId,
                cancellationToken);

            return Ok(transactions);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var userId = GetAuthenticatedUserId();

        var transaction = await _transactionService.GetByIdAsync(userId, id, cancellationToken);

        if (transaction is null)
            return NotFound(new { message = "Transação não encontrada." });

        return Ok(transaction);
    }

    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] CreateTransactionRequestDto request,
        CancellationToken cancellationToken)
    {
        try
        {
            var userId = GetAuthenticatedUserId();

            var createdTransaction = await _transactionService.CreateAsync(
                userId,
                request,
                cancellationToken);

            return CreatedAtAction(nameof(GetById), new { id = createdTransaction.Id }, createdTransaction);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        try
        {
            var userId = GetAuthenticatedUserId();

            await _transactionService.DeleteAsync(userId, id, cancellationToken);

            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    private Guid GetAuthenticatedUserId()
    {
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (string.IsNullOrWhiteSpace(userIdValue))
            throw new UnauthorizedAccessException("Usuário autenticado não encontrado no token.");

        return Guid.Parse(userIdValue);
    }
}
