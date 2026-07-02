using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Finly.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddOccurrencesAndReshapeTransactions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "InstallmentIndex",
                table: "Transactions");

            migrationBuilder.AddColumn<int>(
                name: "RecurrenceMode",
                table: "Transactions",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Occurrences",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TransactionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    InstallmentIndex = table.Column<int>(type: "int", nullable: true),
                    DueDate = table.Column<DateOnly>(type: "date", nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    PaidAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsCustomized = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Occurrences", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Occurrences_Transactions_TransactionId",
                        column: x => x.TransactionId,
                        principalTable: "Transactions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Occurrences_DueDate_Status",
                table: "Occurrences",
                columns: new[] { "DueDate", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_Occurrences_TransactionId_DueDate",
                table: "Occurrences",
                columns: new[] { "TransactionId", "DueDate" });

            migrationBuilder.CreateIndex(
                name: "IX_Occurrences_TransactionId_InstallmentIndex",
                table: "Occurrences",
                columns: new[] { "TransactionId", "InstallmentIndex" },
                unique: true,
                filter: "[InstallmentIndex] IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Occurrences");

            migrationBuilder.DropColumn(
                name: "RecurrenceMode",
                table: "Transactions");

            migrationBuilder.AddColumn<int>(
                name: "InstallmentIndex",
                table: "Transactions",
                type: "int",
                nullable: true);
        }
    }
}
