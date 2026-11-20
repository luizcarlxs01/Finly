# Finly API

Run the API regression suite with the .NET 8 SDK:

```sh
dotnet test Finly.sln --configuration Release
dotnet build Finly.sln --configuration Release
```

The tests use the real application services and EF model with an isolated InMemory store. They do not connect to SQL Server, run migrations, send email, or use production accounts. SQL-specific constraint enforcement and production authentication require a separate integration environment.

## Transaction schedules

Recurring contracts persist their inferred recurrence mode when created or edited. For legacy rows without a mode, an end date means `UntilDate`, a month count means `ForMonths`, and no limit means `Indefinite`. Listing transactions extends only indefinite schedules. Existing finite schedules that were incorrectly extended before this fix are not automatically deleted or rewritten.

Editing a contract reconciles its occurrences by installment/competency index:

- Only future `Pending` occurrences without customization are edited automatically. Their IDs are retained when the index still exists.
- Paid, customized, cancelled, and due-today/past occurrences retain their values, dates, and status. Their indexes are not recreated.
- New future indexes are added; removed future indexes are cancelled and retained for audit. Previously cancelled indexes stay cancelled if a series is expanded again.
- A future pending occurrence moved to a past date remains pending; editing a contract does not mark it paid. New past occurrences are not fabricated.

Dates, positive installment/month counts, recurrence days (1–31), and enum values are validated before generation. Updating an occurrence requires a valid non-default date and a positive amount.

Request text limits match the existing database model: transaction/goal/rule titles 150 characters, profile names 120, and profile descriptions 300. No schema migration is needed.
