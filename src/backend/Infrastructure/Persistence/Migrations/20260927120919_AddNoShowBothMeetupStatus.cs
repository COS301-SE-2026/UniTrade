using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddNoShowBothMeetupStatus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "chk_meetup_status",
                schema: "unitrade",
                table: "meetups");

            migrationBuilder.AddCheckConstraint(
                name: "chk_meetup_status",
                schema: "unitrade",
                table: "meetups",
                sql: "status IN ('scheduled', 'completed', 'no_show_buyer', 'no_show_seller','no_show_both')");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "chk_meetup_status",
                schema: "unitrade",
                table: "meetups");

            migrationBuilder.AddCheckConstraint(
                name: "chk_meetup_status",
                schema: "unitrade",
                table: "meetups",
                sql: "status IN ('scheduled', 'completed', 'no_show_buyer', 'no_show_seller')");
        }
    }
}
