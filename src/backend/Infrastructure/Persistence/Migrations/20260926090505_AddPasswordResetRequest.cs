using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddPasswordResetRequest : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "password_reset_requests",
                schema: "unitrade",
                columns: table => new
                {
                    password_reset_request_id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    otp_code_hash = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    otp_sent_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    otp_expires_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    otp_verified_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    attempt_number = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    is_current = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_password_reset_requests", x => x.password_reset_request_id);
                    table.ForeignKey(
                        name: "fk_password_reset_requests_users_user_id",
                        column: x => x.user_id,
                        principalSchema: "unitrade",
                        principalTable: "users",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "uix_prr_current",
                schema: "unitrade",
                table: "password_reset_requests",
                column: "user_id",
                unique: true,
                filter: "is_current = true");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "password_reset_requests",
                schema: "unitrade");
        }
    }
}
