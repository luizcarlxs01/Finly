using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Finly.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddSpendingProfileToFinancialProfile : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "CustomGoodThreshold",
                table: "FinancialProfiles",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "CustomOkThreshold",
                table: "FinancialProfiles",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SpendingProfile",
                table: "FinancialProfiles",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CustomGoodThreshold",
                table: "FinancialProfiles");

            migrationBuilder.DropColumn(
                name: "CustomOkThreshold",
                table: "FinancialProfiles");

            migrationBuilder.DropColumn(
                name: "SpendingProfile",
                table: "FinancialProfiles");
        }
    }
}
