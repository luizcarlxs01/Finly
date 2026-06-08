using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Finly.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddIsPrimaryToFinancialProfile : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsPrimary",
                table: "FinancialProfiles",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsPrimary",
                table: "FinancialProfiles");
        }
    }
}
