using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class UpdateTransactionsAndReviews : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_meetup_reservation",
                schema: "unitrade",
                table: "meetups");

            migrationBuilder.CreateIndex(
                name: "ix_meetup_reservation",
                schema: "unitrade",
                table: "meetups",
                column: "reservation_id",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_meetup_reservation",
                schema: "unitrade",
                table: "meetups");

            migrationBuilder.CreateIndex(
                name: "ix_meetup_reservation",
                schema: "unitrade",
                table: "meetups",
                column: "reservation_id");
        }
    }
}
