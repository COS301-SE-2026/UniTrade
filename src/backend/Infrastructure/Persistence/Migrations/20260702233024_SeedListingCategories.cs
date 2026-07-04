using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class SeedListingCategories : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                schema: "unitrade",
                table: "listing_categories",
                columns: new[] { "category_id", "is_active", "name" },
                values: new object[,]
                {
                    { 1, true, "book" },
                    { 2, true, "electronics" },
                    { 3, true, "stationery" },
                    { 4, true, "furniture" },
                    { 5, true, "clothing" },
                    { 6, true, "other" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                schema: "unitrade",
                table: "listing_categories",
                keyColumn: "category_id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                schema: "unitrade",
                table: "listing_categories",
                keyColumn: "category_id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                schema: "unitrade",
                table: "listing_categories",
                keyColumn: "category_id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                schema: "unitrade",
                table: "listing_categories",
                keyColumn: "category_id",
                keyValue: 4);

            migrationBuilder.DeleteData(
                schema: "unitrade",
                table: "listing_categories",
                keyColumn: "category_id",
                keyValue: 5);

            migrationBuilder.DeleteData(
                schema: "unitrade",
                table: "listing_categories",
                keyColumn: "category_id",
                keyValue: 6);
        }
    }
}
