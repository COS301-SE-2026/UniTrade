using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddUniqueTimetableSlotIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "ix_timetable_entries_user_slot",
                schema: "unitrade",
                table: "timetable_entries",
                columns: new[] { "user_id", "day_of_week", "start_time", "end_time" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_timetable_entries_user_slot",
                schema: "unitrade",
                table: "timetable_entries");
        }
    }
}
