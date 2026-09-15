using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddListingSnapshot : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "listing_snapshot",
                schema: "unitrade",
                columns: table => new
                {
                    reservation_id = table.Column<Guid>(type: "uuid", nullable: false),
                    listing_id = table.Column<Guid>(type: "uuid", nullable: false),
                    title = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    price = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false),
                    condition = table.Column<string>(type: "character varying(5)", maxLength: 5, nullable: false),
                    photo_refs = table.Column<List<string>>(type: "text[]", nullable: true),
                    course_tags = table.Column<List<string>>(type: "text[]", nullable: true),
                    captured_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_listing_snapshot", x => x.reservation_id);
                    table.CheckConstraint("chk_listing_snapshot_price", "price > 0");
                    table.ForeignKey(
                        name: "fk_listing_snapshot_listings_listing_id",
                        column: x => x.listing_id,
                        principalSchema: "unitrade",
                        principalTable: "listings",
                        principalColumn: "listing_id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_listing_snapshot_reservations_reservation_id",
                        column: x => x.reservation_id,
                        principalSchema: "unitrade",
                        principalTable: "reservations",
                        principalColumn: "reservation_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_listing_snapshots_listing_id",
                schema: "unitrade",
                table: "listing_snapshot",
                column: "listing_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "listing_snapshot",
                schema: "unitrade");
        }
    }
}
