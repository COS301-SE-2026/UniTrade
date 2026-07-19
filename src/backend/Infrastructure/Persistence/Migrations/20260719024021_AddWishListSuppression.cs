using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddWishListSuppression : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "suppressed_at",
                schema: "unitrade",
                table: "wishlist_items",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "suppressed_by_reservation_id",
                schema: "unitrade",
                table: "wishlist_items",
                type: "uuid",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "suppressed_at",
                schema: "unitrade",
                table: "wishlist_items");

            migrationBuilder.DropColumn(
                name: "suppressed_by_reservation_id",
                schema: "unitrade",
                table: "wishlist_items");
        }
    }
}
