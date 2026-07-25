using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddTimelineTimestamps : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "paid_at",
                schema: "unitrade",
                table: "transactions",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "completed_at",
                schema: "unitrade",
                table: "reservations",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "handover_confirmed_at",
                schema: "unitrade",
                table: "reservations",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "buyer_checked_in_at",
                schema: "unitrade",
                table: "meetups",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "seller_checked_in_at",
                schema: "unitrade",
                table: "meetups",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "paid_at",
                schema: "unitrade",
                table: "transactions");

            migrationBuilder.DropColumn(
                name: "completed_at",
                schema: "unitrade",
                table: "reservations");

            migrationBuilder.DropColumn(
                name: "handover_confirmed_at",
                schema: "unitrade",
                table: "reservations");

            migrationBuilder.DropColumn(
                name: "buyer_checked_in_at",
                schema: "unitrade",
                table: "meetups");

            migrationBuilder.DropColumn(
                name: "seller_checked_in_at",
                schema: "unitrade",
                table: "meetups");
        }
    }
}
