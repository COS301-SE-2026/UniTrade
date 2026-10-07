using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AllowMultiplePerReservation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_listing_snapshot_reservation_id",
                schema: "unitrade",
                table: "listing_snapshot");

            migrationBuilder.CreateIndex(
                name: "ix_listing_snapshot_reservation_id",
                schema: "unitrade",
                table: "listing_snapshot",
                column: "reservation_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_listing_snapshot_reservation_id",
                schema: "unitrade",
                table: "listing_snapshot");

            migrationBuilder.CreateIndex(
                name: "ix_listing_snapshot_reservation_id",
                schema: "unitrade",
                table: "listing_snapshot",
                column: "reservation_id",
                unique: true);
        }
    }
}
