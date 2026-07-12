using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddWishlist : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "wishlist_items",
                schema: "unitrade",
                columns: table => new
                {
                    wishlist_id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    student_id = table.Column<Guid>(type: "uuid", nullable: false),
                    listing_id = table.Column<Guid>(type: "uuid", nullable: false),
                    added_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_wishlist_items", x => x.wishlist_id);
                    table.ForeignKey(
                        name: "fk_wishlist_items_listings_listing_id",
                        column: x => x.listing_id,
                        principalSchema: "unitrade",
                        principalTable: "listings",
                        principalColumn: "listing_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_wishlist_items_student_profiles_student_id",
                        column: x => x.student_id,
                        principalSchema: "unitrade",
                        principalTable: "student_profiles",
                        principalColumn: "student_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_wishlist_items_listing_id",
                schema: "unitrade",
                table: "wishlist_items",
                column: "listing_id");

            migrationBuilder.CreateIndex(
                name: "ix_wishlist_student",
                schema: "unitrade",
                table: "wishlist_items",
                column: "student_id");

            migrationBuilder.CreateIndex(
                name: "wishlist_entry",
                schema: "unitrade",
                table: "wishlist_items",
                columns: new[] { "student_id", "listing_id" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "wishlist_items",
                schema: "unitrade");
        }
    }
}
