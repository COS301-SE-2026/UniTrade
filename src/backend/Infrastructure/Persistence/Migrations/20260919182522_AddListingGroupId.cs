using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddListingGroupId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "listing_group_id",
                schema: "unitrade",
                table: "listings",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "ix_listings_group",
                schema: "unitrade",
                table: "listings",
                column: "listing_group_id",
                filter: "listing_group_id IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_listings_group",
                schema: "unitrade",
                table: "listings");

            migrationBuilder.DropColumn(
                name: "listing_group_id",
                schema: "unitrade",
                table: "listings");
        }
    }
}
