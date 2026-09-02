using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddProofOfRegistration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "saved_searches",
                schema: "unitrade",
                columns: table => new
                {
                    search_id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    buyer_id = table.Column<Guid>(type: "uuid", nullable: false),
                    query = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    category_id = table.Column<int>(type: "integer", nullable: true),
                    min_price = table.Column<decimal>(type: "numeric", nullable: true),
                    max_price = table.Column<decimal>(type: "numeric", nullable: true),
                    course_id = table.Column<int>(type: "integer", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_saved_searches", x => x.search_id);
                });

            migrationBuilder.CreateIndex(
                name: "ix_saved_searches_buyer_id",
                schema: "unitrade",
                table: "saved_searches",
                column: "buyer_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "saved_searches",
                schema: "unitrade");
        }
    }
}
