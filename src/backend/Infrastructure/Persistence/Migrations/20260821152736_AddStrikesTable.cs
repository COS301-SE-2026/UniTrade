using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddStrikesTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "strikes",
                schema: "unitrade",
                columns: table => new
                {
                    strike_id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    source_case_id = table.Column<Guid>(type: "uuid", nullable: true),
                    type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    reason = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    created_by_admin_id = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_strikes", x => x.strike_id);
                    table.ForeignKey(
                        name: "fk_strikes_users_created_by_admin_id",
                        column: x => x.created_by_admin_id,
                        principalSchema: "unitrade",
                        principalTable: "users",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_strikes_users_user_id",
                        column: x => x.user_id,
                        principalSchema: "unitrade",
                        principalTable: "users",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_strikes_created_by_admin",
                schema: "unitrade",
                table: "strikes",
                column: "created_by_admin_id");

            migrationBuilder.CreateIndex(
                name: "ix_strikes_source_case",
                schema: "unitrade",
                table: "strikes",
                column: "source_case_id");

            migrationBuilder.CreateIndex(
                name: "ix_strikes_user",
                schema: "unitrade",
                table: "strikes",
                column: "user_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "strikes",
                schema: "unitrade");
        }
    }
}
