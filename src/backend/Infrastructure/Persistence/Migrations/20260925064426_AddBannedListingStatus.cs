using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddBannedListingStatus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "chk_listing_status",
                schema: "unitrade",
                table: "listings");

            migrationBuilder.AddCheckConstraint(
                name: "chk_listing_status",
                schema: "unitrade",
                table: "listings",
                sql: "listing_status IN ('draft', 'pending', 'live', 'reserved', 'low_visibility', 'rejected', 'sold', 'removed','under_review','screening', 'banned')");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "chk_listing_status",
                schema: "unitrade",
                table: "listings");

            migrationBuilder.AddCheckConstraint(
                name: "chk_listing_status",
                schema: "unitrade",
                table: "listings",
                sql: "listing_status IN ('draft', 'pending', 'live', 'reserved', 'low_visibility', 'rejected', 'sold', 'removed','under_review','screening')");
        }
    }
}
