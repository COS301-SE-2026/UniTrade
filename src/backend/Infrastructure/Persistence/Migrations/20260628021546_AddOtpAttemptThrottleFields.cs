using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddOtpAttemptThrottleFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_verification_requests_user_id_attempt_number",
                schema: "unitrade",
                table: "verification_requests");

            migrationBuilder.AlterColumn<int>(
                name: "otp_resend_count",
                schema: "unitrade",
                table: "verification_requests",
                type: "integer",
                nullable: true,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "attempt_number",
                schema: "unitrade",
                table: "verification_requests",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AddColumn<DateTime>(
                name: "last_attempt_at",
                schema: "unitrade",
                table: "verification_requests",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "total_attempt_count",
                schema: "unitrade",
                table: "verification_requests",
                type: "integer",
                nullable: true,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "last_attempt_at",
                schema: "unitrade",
                table: "verification_requests");

            migrationBuilder.DropColumn(
                name: "total_attempt_count",
                schema: "unitrade",
                table: "verification_requests");

            migrationBuilder.AlterColumn<int>(
                name: "otp_resend_count",
                schema: "unitrade",
                table: "verification_requests",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true,
                oldDefaultValue: 0);

            migrationBuilder.AlterColumn<int>(
                name: "attempt_number",
                schema: "unitrade",
                table: "verification_requests",
                type: "integer",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer",
                oldDefaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "ix_verification_requests_user_id_attempt_number",
                schema: "unitrade",
                table: "verification_requests",
                columns: new[] { "user_id", "attempt_number" },
                unique: true);
        }
    }
}
