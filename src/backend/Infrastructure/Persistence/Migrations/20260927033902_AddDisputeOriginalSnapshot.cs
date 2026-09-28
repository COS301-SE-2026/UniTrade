using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddDisputeOriginalSnapshot : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "original_snapshot_id",
                schema: "unitrade",
                table: "disputes",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "ix_disputes_original_snapshot_id",
                schema: "unitrade",
                table: "disputes",
                column: "original_snapshot_id");

            migrationBuilder.AddForeignKey(
                name: "fk_disputes_listing_snapshot_original_snapshot_id",
                schema: "unitrade",
                table: "disputes",
                column: "original_snapshot_id",
                principalSchema: "unitrade",
                principalTable: "listing_snapshot",
                principalColumn: "snapshot_id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_disputes_listing_snapshot_original_snapshot_id",
                schema: "unitrade",
                table: "disputes");

            migrationBuilder.DropIndex(
                name: "ix_disputes_original_snapshot_id",
                schema: "unitrade",
                table: "disputes");

            migrationBuilder.DropColumn(
                name: "original_snapshot_id",
                schema: "unitrade",
                table: "disputes");
        }
    }
}
