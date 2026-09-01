using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class FixSavedSearchCourseIdType : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "course_id",
                schema: "unitrade",
                table: "saved_searches"
            );

            migrationBuilder.AddColumn<int>(
                name: "course_id",
                schema: "unitrade",
                table: "saved_searches",
                nullable: true
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "course_id",
                schema: "unitrade",
                table: "saved_searches"
            );

            migrationBuilder.AddColumn<Guid>(
                name: "course_id",
                schema: "unitrade",
                table: "saved_searches",
                type: "uuid",
                nullable: true
            );
        }
    }
}
