using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddNotes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "case_notes",
                schema: "unitrade",
                columns: table => new
                {
                    note_id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    case_id = table.Column<Guid>(type: "uuid", nullable: false),
                    author_admin_id = table.Column<Guid>(type: "uuid", nullable: false),
                    content = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_case_notes", x => x.note_id);
                    table.ForeignKey(
                        name: "fk_case_notes_users_author_admin_id",
                        column: x => x.author_admin_id,
                        principalSchema: "unitrade",
                        principalTable: "users",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "ix_case_notes_author_admin_id",
                schema: "unitrade",
                table: "case_notes",
                column: "author_admin_id");

            migrationBuilder.CreateIndex(
                name: "ix_case_notes_case",
                schema: "unitrade",
                table: "case_notes",
                column: "case_id");

            migrationBuilder.CreateIndex(
                name: "ix_case_notes_created",
                schema: "unitrade",
                table: "case_notes",
                column: "created_at",
                descending: new bool[0]);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "case_notes",
                schema: "unitrade");
        }
    }
}
