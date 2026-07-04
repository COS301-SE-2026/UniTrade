using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddListingStatusCheckConstraint : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_listing_categories_listing_categories_root_category_id",
                schema: "unitrade",
                table: "listing_categories");

            migrationBuilder.DropIndex(
                name: "ix_listing_categories_root_category_id",
                schema: "unitrade",
                table: "listing_categories");

            migrationBuilder.DropColumn(
                name: "root_category_id",
                schema: "unitrade",
                table: "listing_categories");

            migrationBuilder.AddCheckConstraint(
                name: "chk_listing_status",
                schema: "unitrade",
                table: "listings",
                sql: "listing_status IN ('draft', 'pending', 'live', 'low_visibility', 'rejected', 'sold', 'removed')");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "chk_listing_status",
                schema: "unitrade",
                table: "listings");

            migrationBuilder.AddColumn<int>(
                name: "root_category_id",
                schema: "unitrade",
                table: "listing_categories",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "ix_listing_categories_root_category_id",
                schema: "unitrade",
                table: "listing_categories",
                column: "root_category_id");

            migrationBuilder.AddForeignKey(
                name: "fk_listing_categories_listing_categories_root_category_id",
                schema: "unitrade",
                table: "listing_categories",
                column: "root_category_id",
                principalSchema: "unitrade",
                principalTable: "listing_categories",
                principalColumn: "category_id");
        }
    }
}
