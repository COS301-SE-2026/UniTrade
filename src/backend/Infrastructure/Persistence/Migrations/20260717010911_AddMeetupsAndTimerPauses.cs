using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddMeetupsAndTimerPauses : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_res_expires",
                schema: "unitrade",
                table: "reservations");

            migrationBuilder.AddColumn<DateTime>(
                name: "meetup_confirmed_at",
                schema: "unitrade",
                table: "reservations",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "meetups",
                schema: "unitrade",
                columns: table => new
                {
                    meetup_id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    reservation_id = table.Column<Guid>(type: "uuid", nullable: false),
                    agreed_location_name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    agreed_latitude = table.Column<decimal>(type: "numeric(9,6)", precision: 9, scale: 6, nullable: false),
                    agreed_longitude = table.Column<decimal>(type: "numeric(9,6)", precision: 9, scale: 6, nullable: false),
                    agreed_time = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    buyer_checked_in = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    buyer_checkin_time = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    buyer_checkin_latitude = table.Column<decimal>(type: "numeric(9,6)", precision: 9, scale: 6, nullable: true),
                    buyer_checkin_longitude = table.Column<decimal>(type: "numeric(9,6)", precision: 9, scale: 6, nullable: true),
                    checkin_window_closes_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    seller_checked_in = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    seller_checkin_time = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    seller_checkin_latitude = table.Column<decimal>(type: "numeric(9,6)", precision: 9, scale: 6, nullable: true),
                    seller_checkin_longitude = table.Column<decimal>(type: "numeric(9,6)", precision: 9, scale: 6, nullable: true),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_meetups", x => x.meetup_id);
                    table.CheckConstraint("chk_meetup_status", "status IN ('scheduled', 'completed', 'no_show_buyer', 'no_show_seller')");
                    table.ForeignKey(
                        name: "fk_meetups_reservations_reservation_id",
                        column: x => x.reservation_id,
                        principalSchema: "unitrade",
                        principalTable: "reservations",
                        principalColumn: "reservation_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_res_expires",
                schema: "unitrade",
                table: "reservations",
                column: "expires_at",
                filter: "reservation_status = 'active' AND meetup_confirmed_at IS NULL");

            migrationBuilder.CreateIndex(
                name: "ix_meetup_reservation",
                schema: "unitrade",
                table: "meetups",
                column: "reservation_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "meetups",
                schema: "unitrade");

            migrationBuilder.DropIndex(
                name: "ix_res_expires",
                schema: "unitrade",
                table: "reservations");

            migrationBuilder.DropColumn(
                name: "meetup_confirmed_at",
                schema: "unitrade",
                table: "reservations");

            migrationBuilder.CreateIndex(
                name: "ix_res_expires",
                schema: "unitrade",
                table: "reservations",
                column: "expires_at",
                filter: "reservation_status = 'active'");
        }
    }
}
