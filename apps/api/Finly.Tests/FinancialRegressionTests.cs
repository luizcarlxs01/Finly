using System.ComponentModel.DataAnnotations;
using System.Text.Json;
using Finly.Application.DTOs.Goals;
using Finly.Application.DTOs.Occurrences;
using Finly.Application.DTOs.Profiles;
using Finly.Application.DTOs.Rules;
using Finly.Application.DTOs.Transactions;
using Finly.Application.Services;
using Finly.Domain.Entities;
using Finly.Domain.Enums;
using Finly.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Finly.Tests;

public sealed class FinancialRegressionTests
{
    private static readonly DateOnly Future = new(DateTime.Today.Year + 2, 1, 1);

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public async Task ListingLegacyFiniteRecurrenceDoesNotCreateMoreOccurrences(bool untilDate)
    {
        using var db = CreateDb();
        var p = SeedProfile(db);
        var date = DateOnly.FromDateTime(DateTime.Today).AddMonths(-2);
        var t = new Transaction { FinancialProfile = p, FinancialProfileId = p.Id, Title = "Finite", Category = "Test", Amount = 10, Type = TransactionType.Expense, TransactionKind = TransactionKind.Recurring, TransactionDate = date, RecurrenceStartDate = date, RecurrenceDay = date.Day, RecurrenceEndDate = untilDate ? date.AddMonths(1) : null, RecurrenceMonths = untilDate ? null : 2 };
        db.Transactions.Add(t);
        db.Occurrences.AddRange(new OccurrenceGenerationService().Generate(t));
        t.RecurrenceMode = null; // Explicitly model a legacy row, even if generation now infers a mode.
        await db.SaveChangesAsync();
        var response = await Service(db).GetAllAsync(p.UserId, p.Id);
        Assert.Equal(2, Assert.Single(response).Occurrences.Count);
        Assert.Equal(2, await db.Occurrences.CountAsync());
    }

    [Theory]
    [InlineData("Single", 1)]
    [InlineData("Installment", 3)]
    [InlineData("Recurring", 2)]
    public async Task CreatingTransactionReturnsEachOccurrenceExactlyOnce(string kind, int count)
    {
        using var db = CreateDb();
        var p = SeedProfile(db);
        var request = Request(p.Id, kind); request.InstallmentCount = 3; request.RecurrenceMonths = 2;
        var result = await Service(db).CreateAsync(p.UserId, request);
        Assert.Equal(count, result.Occurrences.Count);
        Assert.Equal(count, result.Occurrences.Select(x => x.Id).Distinct().Count());
    }

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public async Task CreatingFiniteRecurrencePersistsItsMode(bool untilDate)
    {
        using var db = CreateDb(); var p = SeedProfile(db);
        var request = Request(p.Id, "Recurring");
        request.RecurrenceEndDate = untilDate ? Future.AddMonths(1) : null;
        request.RecurrenceMonths = untilDate ? null : 2;
        var result = await Service(db).CreateAsync(p.UserId, request);
        Assert.Equal(untilDate ? RecurrenceMode.UntilDate : RecurrenceMode.ForMonths, (await db.Transactions.FindAsync(result.Id))!.RecurrenceMode);
    }

    [Fact]
    public async Task IndefiniteExtensionReturnsUniqueOccurrencesAndIsIdempotent()
    {
        using var db = CreateDb(); var p = SeedProfile(db);
        var date = DateOnly.FromDateTime(DateTime.Today).AddMonths(-13);
        var t = new Transaction { FinancialProfile = p, FinancialProfileId = p.Id, Title = "Indefinite", Category = "Test", Amount = 10, Type = TransactionType.Expense, TransactionKind = TransactionKind.Recurring, TransactionDate = date, RecurrenceStartDate = date, RecurrenceDay = date.Day };
        db.Transactions.Add(t); db.Occurrences.AddRange(new OccurrenceGenerationService().Generate(t)); await db.SaveChangesAsync();
        var result = Assert.Single(await Service(db).GetAllAsync(p.UserId, p.Id));
        Assert.Equal(result.Occurrences.Count, result.Occurrences.Select(o => o.Id).Distinct().Count());
        var count = await db.Occurrences.CountAsync();
        await Service(db).GetAllAsync(p.UserId, p.Id);
        Assert.Equal(count, await db.Occurrences.CountAsync());
    }

    [Fact]
    public async Task SeriesUpdateReconcilesFuturePendingWhilePreservingPaidCustomAndPast()
    {
        using var db = CreateDb(); var p = SeedProfile(db);
        var service = Service(db);
        var request = Request(p.Id, "Installment"); request.InstallmentCount = 5;
        var created = await service.CreateAsync(p.UserId, request);
        var occurrences = await db.Occurrences.OrderBy(o => o.InstallmentIndex).ToListAsync();
        occurrences[0].Status = OccurrenceStatus.Paid; occurrences[0].PaidAt = DateTime.UtcNow;
        occurrences[1].IsCustomized = true; occurrences[1].Amount = 777;
        occurrences[2].DueDate = DateOnly.FromDateTime(DateTime.Today).AddDays(-1); // pending historical debt
        await db.SaveChangesAsync();
        var fourthId = occurrences[3].Id;
        var update = Update(request); update.Amount = 200; update.InstallmentCount = 6;
        update.TransactionDate = Future.AddDays(14);
        var result = await service.UpdateAsync(p.UserId, created.Id, update);
        Assert.Equal(6, result.Occurrences.Count);
        Assert.Equal(100m, result.Occurrences.Single(o => o.Id == occurrences[0].Id).Amount);
        Assert.Equal(777m, result.Occurrences.Single(o => o.Id == occurrences[1].Id).Amount);
        Assert.Equal(occurrences[2].DueDate, result.Occurrences.Single(o => o.Id == occurrences[2].Id).DueDate);
        var fourth = result.Occurrences.Single(o => o.Id == fourthId);
        Assert.Equal(200m, fourth.Amount); Assert.Equal(Future.AddMonths(3).AddDays(14), fourth.DueDate);
        Assert.Equal(200m, result.Occurrences.Single(o => o.InstallmentIndex == 6).Amount);
    }

    [Fact]
    public async Task ReducingSeriesCancelsOnlyUnprotectedFutureOccurrences()
    {
        using var db = CreateDb(); var p = SeedProfile(db); var service = Service(db);
        var request = Request(p.Id, "Installment"); request.InstallmentCount = 4;
        var created = await service.CreateAsync(p.UserId, request);
        var original = await db.Occurrences.OrderBy(o => o.InstallmentIndex).ToListAsync();
        original[2].IsCustomized = true;
        await db.SaveChangesAsync();
        var update = Update(request); update.InstallmentCount = 2;
        await service.UpdateAsync(p.UserId, created.Id, update);
        Assert.Equal(OccurrenceStatus.Pending, original[2].Status);
        Assert.Equal(OccurrenceStatus.Cancelled, original[3].Status);
        Assert.Equal(4, await db.Occurrences.CountAsync());
    }

    [Fact]
    public async Task UpdatingRecurringScheduleAppliesModeDayAndAmountToFuturePending()
    {
        using var db = CreateDb(); var p = SeedProfile(db); var service = Service(db);
        var request = Request(p.Id, "Recurring"); request.RecurrenceMonths = 2;
        var created = await service.CreateAsync(p.UserId, request);
        var update = Update(request); update.Amount = 250; update.RecurrenceDay = 15;
        update.RecurrenceMonths = null; update.RecurrenceEndDate = Future.AddMonths(2).AddDays(14);
        var result = await service.UpdateAsync(p.UserId, created.Id, update);
        Assert.Equal(3, result.Occurrences.Count);
        Assert.All(result.Occurrences, o => { Assert.Equal(250m, o.Amount); Assert.Equal(15, o.DueDate.Day); });
        Assert.Equal(RecurrenceMode.UntilDate, (await db.Transactions.FindAsync(created.Id))!.RecurrenceMode);
    }

    [Theory]
    [InlineData(-1)]
    [InlineData(0)]
    public async Task OccurrenceUpdateRejectsNonpositiveAmount(decimal amount)
    {
        using var db = CreateDb(); var p = SeedProfile(db);
        var created = await Service(db).CreateAsync(p.UserId, Request(p.Id, "Single"));
        await Assert.ThrowsAsync<InvalidOperationException>(() => new OccurrenceService(db).UpdateAsync(p.UserId, created.Occurrences[0].Id, new() { Amount = amount, DueDate = Future }));
    }

    [Theory]
    [InlineData("{}")]
    [InlineData("{\"amount\":10}")]
    [InlineData("{\"dueDate\":\"2030-01-01\"}")]
    [InlineData("{\"amount\":10,\"dueDate\":\"0001-01-01\"}")]
    public void IncompleteOccurrenceRequestFailsModelValidation(string json)
    {
        var dto = JsonSerializer.Deserialize<UpdateOccurrenceRequestDto>(json, new JsonSerializerOptions(JsonSerializerDefaults.Web))!;
        Assert.False(Validator.TryValidateObject(dto, new ValidationContext(dto), new List<ValidationResult>(), true));
    }

    [Theory]
    [InlineData("type")]
    [InlineData("kind")]
    [InlineData("profile")]
    public async Task UndefinedNumericEnumValuesAreRejected(string field)
    {
        using var db = CreateDb(); var p = SeedProfile(db);
        if (field == "profile")
            await Assert.ThrowsAsync<InvalidOperationException>(() => new ProfileService(db).UpdateAsync(p.UserId, p.Id, new() { Name = "Test", SpendingProfile = "999" }));
        else {
            var request = Request(p.Id, "Single");
            if (field == "type") request.Type = "999"; else request.TransactionKind = "999";
            await Assert.ThrowsAsync<InvalidOperationException>(() => Service(db).CreateAsync(p.UserId, request));
        }
    }

    [Theory]
    [InlineData("Installment", 0)]
    [InlineData("Installment", -1)]
    [InlineData("Recurring", 0)]
    [InlineData("Recurring", -1)]
    public async Task NonpositiveScheduleCountsAreRejected(string kind, int count)
    {
        using var db = CreateDb(); var p = SeedProfile(db); var request = Request(p.Id, kind);
        if (kind == "Installment") request.InstallmentCount = count; else request.RecurrenceMonths = count;
        await Assert.ThrowsAsync<InvalidOperationException>(() => Service(db).CreateAsync(p.UserId, request));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(32)]
    public async Task InvalidRecurrenceDaysAreRejectedAsValidationErrors(int day)
    {
        using var db = CreateDb(); var p = SeedProfile(db); var request = Request(p.Id, "Recurring");
        request.RecurrenceDay = day; request.RecurrenceMonths = 2;
        await Assert.ThrowsAsync<InvalidOperationException>(() => Service(db).CreateAsync(p.UserId, request));
    }

    [Fact]
    public async Task ReversedRecurrenceDatesAreRejected()
    {
        using var db = CreateDb(); var p = SeedProfile(db); var request = Request(p.Id, "Recurring");
        request.RecurrenceEndDate = Future.AddDays(-1);
        await Assert.ThrowsAsync<InvalidOperationException>(() => Service(db).CreateAsync(p.UserId, request));
    }

    [Theory]
    [InlineData("goal", 151)]
    [InlineData("transaction", 151)]
    [InlineData("rule", 151)]
    [InlineData("profileName", 121)]
    [InlineData("profileDescription", 301)]
    public void TextExceedingDatabaseCapacityFailsRequestValidation(string field, int length)
    {
        object dto = field switch {
            "goal" => new CreateGoalRequestDto { Title = new string('x', length) },
            "transaction" => new CreateTransactionRequestDto { Title = new string('x', length), Type = "Income", Category = "Test" },
            "rule" => new CreateFinancialRuleRequestDto { Title = new string('x', length), RuleType = "Salary" },
            "profileName" => new CreateProfileRequestDto { Name = new string('x', length) },
            _ => new CreateProfileRequestDto { Name = "Test", Description = new string('x', length) }
        };
        Assert.False(Validator.TryValidateObject(dto, new ValidationContext(dto), new List<ValidationResult>(), true));
    }

    [Theory]
    [InlineData("type")]
    [InlineData("mode")]
    public async Task FinancialRulesRejectUndefinedNumericEnums(string field)
    {
        using var db = CreateDb(); var p = SeedProfile(db);
        var request = new CreateFinancialRuleRequestDto { FinancialProfileId = p.Id, Title = "Rule", Amount = 100, RuleType = field == "type" ? "999" : "Salary", RecurrenceMode = field == "mode" ? "999" : "Indefinite", StartDate = Future, DayOfMonth = 1 };
        await Assert.ThrowsAsync<InvalidOperationException>(() => new FinancialRuleService(db).CreateAsync(p.UserId, request));
    }

    [Fact]
    public async Task RuleProcessingDoesNotDuplicateNavigationOccurrences()
    {
        using var db = CreateDb(); var p = SeedProfile(db);
        var rule = new FinancialRule { FinancialProfile = p, FinancialProfileId = p.Id, Title = "Rule", Amount = 100, RuleType = RuleType.InstallmentExpense, TotalMonths = 3, StartDate = Future, DayOfMonth = 1, IsActive = true };
        db.FinancialRules.Add(rule); await db.SaveChangesAsync();
        var processor = new RuleProcessingService(db, new OccurrenceGenerationService());
        var first = await processor.ProcessAsync(p.UserId, p.Id, new() { ReferenceDate = Future });
        Assert.Equal(3, first.CreatedTransactionCount);
        Assert.Equal(3, Assert.Single(await Service(db).GetAllAsync(p.UserId, p.Id)).Occurrences.Count);
        var second = await processor.ProcessAsync(p.UserId, p.Id, new() { ReferenceDate = Future });
        Assert.Equal(0, second.CreatedTransactionCount);
        Assert.Equal(3, await db.Occurrences.CountAsync());
    }

    [Fact]
    public async Task UpdateRejectsInvalidScheduleBeforeChangingTrackedContract()
    {
        using var db = CreateDb(); var p = SeedProfile(db); var service = Service(db);
        var request = Request(p.Id, "Recurring"); request.RecurrenceMonths = 2;
        var created = await service.CreateAsync(p.UserId, request);
        var update = Update(request); update.Amount = 999; update.RecurrenceDay = 0;
        await Assert.ThrowsAsync<InvalidOperationException>(() => service.UpdateAsync(p.UserId, created.Id, update));
        Assert.Equal(100m, (await db.Transactions.FindAsync(created.Id))!.Amount);
    }

    [Fact]
    public async Task ChangingSeriesKindDoesNotViolateOccurrenceIndexesOrRewriteProtectedHistory()
    {
        using var db = CreateDb(); var p = SeedProfile(db); var service = Service(db);
        var request = Request(p.Id, "Installment"); request.InstallmentCount = 3;
        var created = await service.CreateAsync(p.UserId, request);
        var first = await db.Occurrences.OrderBy(o => o.InstallmentIndex).FirstAsync();
        first.Status = OccurrenceStatus.Paid; await db.SaveChangesAsync();
        var update = Update(request); update.TransactionKind = "Recurring"; update.RecurrenceStartDate = Future; update.RecurrenceMonths = 4; update.RecurrenceDay = 15; update.Amount = 200;
        var response = await service.UpdateAsync(p.UserId, created.Id, update);
        Assert.Equal(4, response.Occurrences.Count);
        Assert.Equal(100m, response.Occurrences.Single(o => o.Id == first.Id).Amount);
        Assert.Equal(4, response.Occurrences.Select(o => o.InstallmentIndex).Distinct().Count());
        Assert.All(response.Occurrences.Where(o => o.Id != first.Id), o => Assert.Equal(200m, o.Amount));
    }

    [Fact]
    public async Task UpdatingOldIndefiniteContractKeepsItsFutureHorizon()
    {
        using var db = CreateDb(); var p = SeedProfile(db); var service = Service(db);
        var start = DateOnly.FromDateTime(DateTime.Today).AddMonths(-24);
        var request = Request(p.Id, "Recurring"); request.TransactionDate = start;
        request.RecurrenceStartDate = start; request.RecurrenceDay = start.Day;
        var created = await service.CreateAsync(p.UserId, request);
        await service.GetAllAsync(p.UserId, p.Id); // extend the old contract into its current horizon
        var future = await db.Occurrences.Where(o => o.Status == OccurrenceStatus.Pending).ToListAsync();
        Assert.NotEmpty(future);
        var update = Update(request); update.Amount = 250;
        var result = await service.UpdateAsync(p.UserId, created.Id, update);
        foreach (var previous in future)
        {
            var occurrence = Assert.Single(result.Occurrences, o => o.Id == previous.Id);
            Assert.Equal("Pending", occurrence.Status); Assert.Equal(250m, occurrence.Amount);
        }
        Assert.All(result.Occurrences.Where(o => o.Status == "Paid"), o => Assert.Equal(100m, o.Amount));
    }

    private static AppDbContext CreateDb() => new(new DbContextOptionsBuilder<AppDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);
    private static FinancialProfile SeedProfile(AppDbContext db) {
        var user = new User { Name = "Test", Email = "unit@example.invalid", PasswordHash = "unused" };
        var profile = new FinancialProfile { User = user, UserId = user.Id, Name = "Test", IsPrimary = true };
        db.FinancialProfiles.Add(profile); db.SaveChanges(); return profile;
    }
    private static TransactionService Service(AppDbContext db) => new(db, new OccurrenceGenerationService());
    private static CreateTransactionRequestDto Request(Guid profileId, string kind) => new() { FinancialProfileId = profileId, Title = "Test", Amount = 100, Type = "Expense", Category = "Test", TransactionKind = kind, TransactionDate = Future, IsRecurring = kind == "Recurring", RecurrenceStartDate = kind == "Recurring" ? Future : null, RecurrenceDay = kind == "Recurring" ? 1 : null };
    private static UpdateTransactionRequestDto Update(CreateTransactionRequestDto request) => JsonSerializer.Deserialize<UpdateTransactionRequestDto>(JsonSerializer.Serialize(request))!;
}
