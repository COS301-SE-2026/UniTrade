using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class TimetableEntityAddition : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "timetable_entries",
                schema: "unitrade",
                columns: table => new
                {
                    entry_id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    day_of_week = table.Column<int>(type: "integer", nullable: false),
                    start_time = table.Column<TimeOnly>(type: "time", nullable: false),
                    end_time = table.Column<TimeOnly>(type: "time", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_timetable_entries", x => x.entry_id);
                    table.CheckConstraint("chk_timetable_day", "day_of_week BETWEEN 0 AND 6");
                    table.CheckConstraint("chk_timetable_hours", "start_time >= TIME '08:00' AND end_time <= TIME '20:00'");
                    table.CheckConstraint("chk_timetable_range", "start_time < end_time");
                    table.ForeignKey(
                        name: "fk_timetable_entries_users_user_id",
                        column: x => x.user_id,
                        principalSchema: "unitrade",
                        principalTable: "users",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_timetable_entries_user",
                schema: "unitrade",
                table: "timetable_entries",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "ix_timetable_entries_user_day",
                schema: "unitrade",
                table: "timetable_entries",
                columns: new[] { "user_id", "day_of_week" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "timetable_entries",
                schema: "unitrade");
        }
    }
}
