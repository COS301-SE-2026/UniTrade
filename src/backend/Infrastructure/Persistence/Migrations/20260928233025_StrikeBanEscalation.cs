using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class StrikeBanEscalation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "chk_listing_status",
                schema: "unitrade",
                table: "listings");

            migrationBuilder.AddColumn<int>(
                name: "buyer_ban_count",
                schema: "unitrade",
                table: "users",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "buyer_banned_until",
                schema: "unitrade",
                table: "users",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "seller_ban_count",
                schema: "unitrade",
                table: "users",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "seller_banned_until",
                schema: "unitrade",
                table: "users",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "scope",
                schema: "unitrade",
                table: "strikes",
                type: "text",
                nullable: false,
                defaultValue: "seller");

            migrationBuilder.AddCheckConstraint(
                name: "chk_listing_status",
                schema: "unitrade",
                table: "listings",
                sql: "listing_status IN ('draft', 'pending', 'live', 'reserved', 'low_visibility', 'rejected', 'sold', 'removed','under_review','screening', 'banned', 'suspended')");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "chk_listing_status",
                schema: "unitrade",
                table: "listings");

            migrationBuilder.DropColumn(
                name: "buyer_ban_count",
                schema: "unitrade",
                table: "users");

            migrationBuilder.DropColumn(
                name: "buyer_banned_until",
                schema: "unitrade",
                table: "users");

            migrationBuilder.DropColumn(
                name: "seller_ban_count",
                schema: "unitrade",
                table: "users");

            migrationBuilder.DropColumn(
                name: "seller_banned_until",
                schema: "unitrade",
                table: "users");

            migrationBuilder.DropColumn(
                name: "scope",
                schema: "unitrade",
                table: "strikes");

            migrationBuilder.AddCheckConstraint(
                name: "chk_listing_status",
                schema: "unitrade",
                table: "listings",
                sql: "listing_status IN ('draft', 'pending', 'live', 'reserved', 'low_visibility', 'rejected', 'sold', 'removed','under_review','screening', 'banned')");
        }
    }
}
