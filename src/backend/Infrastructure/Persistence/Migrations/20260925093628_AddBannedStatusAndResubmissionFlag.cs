using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddBannedStatusAndResubmissionFlag : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "chk_dispute_status",
                schema: "unitrade",
                table: "disputes");

            migrationBuilder.AddCheckConstraint(
                name: "chk_dispute_status",
                schema: "unitrade",
                table: "disputes",
                sql: "status IN ('open','under_review','resolved','closed','resubmission')");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "chk_dispute_status",
                schema: "unitrade",
                table: "disputes");

            migrationBuilder.AddCheckConstraint(
                name: "chk_dispute_status",
                schema: "unitrade",
                table: "disputes",
                sql: "status IN ('open','under_review','resolved','closed')");
        }
    }
}
