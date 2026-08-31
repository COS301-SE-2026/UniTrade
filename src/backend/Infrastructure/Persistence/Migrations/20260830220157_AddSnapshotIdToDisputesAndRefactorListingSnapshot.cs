using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddSnapshotIdToDisputesAndRefactorListingSnapshot : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "pk_listing_snapshot",
                schema: "unitrade",
                table: "listing_snapshot");

            migrationBuilder.AlterColumn<Guid>(
                name: "reservation_id",
                schema: "unitrade",
                table: "listing_snapshot",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AddColumn<Guid>(
                name: "snapshot_id",
                schema: "unitrade",
                table: "listing_snapshot",
                type: "uuid",
                nullable: false,
                defaultValueSql: "gen_random_uuid()");

            migrationBuilder.AddColumn<Guid>(
                name: "snapshot_id",
                schema: "unitrade",
                table: "disputes",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddPrimaryKey(
                name: "pk_listing_snapshot",
                schema: "unitrade",
                table: "listing_snapshot",
                column: "snapshot_id");

            migrationBuilder.CreateIndex(
                name: "ix_listing_snapshot_reservation_id",
                schema: "unitrade",
                table: "listing_snapshot",
                column: "reservation_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_disputes_snapshot_id",
                schema: "unitrade",
                table: "disputes",
                column: "snapshot_id");

            migrationBuilder.AddForeignKey(
                name: "fk_disputes_listing_snapshot_snapshot_id",
                schema: "unitrade",
                table: "disputes",
                column: "snapshot_id",
                principalSchema: "unitrade",
                principalTable: "listing_snapshot",
                principalColumn: "snapshot_id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_disputes_listing_snapshot_snapshot_id",
                schema: "unitrade",
                table: "disputes");

            migrationBuilder.DropPrimaryKey(
                name: "pk_listing_snapshot",
                schema: "unitrade",
                table: "listing_snapshot");

            migrationBuilder.DropIndex(
                name: "ix_listing_snapshot_reservation_id",
                schema: "unitrade",
                table: "listing_snapshot");

            migrationBuilder.DropIndex(
                name: "ix_disputes_snapshot_id",
                schema: "unitrade",
                table: "disputes");

            migrationBuilder.DropColumn(
                name: "snapshot_id",
                schema: "unitrade",
                table: "listing_snapshot");

            migrationBuilder.DropColumn(
                name: "snapshot_id",
                schema: "unitrade",
                table: "disputes");

            migrationBuilder.AlterColumn<Guid>(
                name: "reservation_id",
                schema: "unitrade",
                table: "listing_snapshot",
                type: "uuid",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.AddPrimaryKey(
                name: "pk_listing_snapshot",
                schema: "unitrade",
                table: "listing_snapshot",
                column: "reservation_id");
        }
    }
}
