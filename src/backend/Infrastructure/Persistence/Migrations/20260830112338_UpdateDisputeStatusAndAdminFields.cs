using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class UpdateDisputeStatusAndAdminFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_disputes_users_decided_by_admin_id",
                schema: "unitrade",
                table: "disputes");

            migrationBuilder.DropCheckConstraint(
                name: "chk_dispute_status",
                schema: "unitrade",
                table: "disputes");

            migrationBuilder.DropColumn(
                name: "admin_decision",
                schema: "unitrade",
                table: "disputes");

            migrationBuilder.DropColumn(
                name: "outcomes",
                schema: "unitrade",
                table: "disputes");

            migrationBuilder.RenameColumn(
                name: "reason",
                schema: "unitrade",
                table: "disputes",
                newName: "resolution");

            migrationBuilder.RenameColumn(
                name: "decided_by_admin_id",
                schema: "unitrade",
                table: "disputes",
                newName: "assigned_admin_id");

            migrationBuilder.RenameColumn(
                name: "decided_at",
                schema: "unitrade",
                table: "disputes",
                newName: "resolved_at");

            migrationBuilder.RenameIndex(
                name: "ix_disputes_decided_by_admin_id",
                schema: "unitrade",
                table: "disputes",
                newName: "ix_disputes_assigned_admin_id");

            migrationBuilder.AlterColumn<string>(
                name: "status",
                schema: "unitrade",
                table: "disputes",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "open",
                oldClrType: typeof(string),
                oldType: "character varying(20)",
                oldMaxLength: 20,
                oldDefaultValue: "pending");

            migrationBuilder.AlterColumn<Guid>(
                name: "raised_by",
                schema: "unitrade",
                table: "disputes",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AlterColumn<List<string>>(
                name: "photos",
                schema: "unitrade",
                table: "disputes",
                type: "text[]",
                nullable: true,
                oldClrType: typeof(List<string>),
                oldType: "text[]");

            migrationBuilder.AddCheckConstraint(
                name: "chk_dispute_status",
                schema: "unitrade",
                table: "disputes",
                sql: "status IN ('open','under_review','resolved','closed')");

            migrationBuilder.AddForeignKey(
                name: "fk_disputes_users_assigned_admin_id",
                schema: "unitrade",
                table: "disputes",
                column: "assigned_admin_id",
                principalSchema: "unitrade",
                principalTable: "users",
                principalColumn: "user_id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_disputes_users_assigned_admin_id",
                schema: "unitrade",
                table: "disputes");

            migrationBuilder.DropCheckConstraint(
                name: "chk_dispute_status",
                schema: "unitrade",
                table: "disputes");

            migrationBuilder.RenameColumn(
                name: "resolved_at",
                schema: "unitrade",
                table: "disputes",
                newName: "decided_at");

            migrationBuilder.RenameColumn(
                name: "resolution",
                schema: "unitrade",
                table: "disputes",
                newName: "reason");

            migrationBuilder.RenameColumn(
                name: "assigned_admin_id",
                schema: "unitrade",
                table: "disputes",
                newName: "decided_by_admin_id");

            migrationBuilder.RenameIndex(
                name: "ix_disputes_assigned_admin_id",
                schema: "unitrade",
                table: "disputes",
                newName: "ix_disputes_decided_by_admin_id");

            migrationBuilder.AlterColumn<string>(
                name: "status",
                schema: "unitrade",
                table: "disputes",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "pending",
                oldClrType: typeof(string),
                oldType: "character varying(20)",
                oldMaxLength: 20,
                oldDefaultValue: "open");

            migrationBuilder.AlterColumn<Guid>(
                name: "raised_by",
                schema: "unitrade",
                table: "disputes",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.AlterColumn<List<string>>(
                name: "photos",
                schema: "unitrade",
                table: "disputes",
                type: "text[]",
                nullable: false,
                oldClrType: typeof(List<string>),
                oldType: "text[]",
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "admin_decision",
                schema: "unitrade",
                table: "disputes",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<List<string>>(
                name: "outcomes",
                schema: "unitrade",
                table: "disputes",
                type: "text[]",
                nullable: false);

            migrationBuilder.AddCheckConstraint(
                name: "chk_dispute_status",
                schema: "unitrade",
                table: "disputes",
                sql: "status IN ('pending','under_review','resolved','dismissed')");

            migrationBuilder.AddForeignKey(
                name: "fk_disputes_users_decided_by_admin_id",
                schema: "unitrade",
                table: "disputes",
                column: "decided_by_admin_id",
                principalSchema: "unitrade",
                principalTable: "users",
                principalColumn: "user_id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
