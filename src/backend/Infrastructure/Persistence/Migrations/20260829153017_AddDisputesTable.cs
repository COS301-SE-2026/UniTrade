using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddDisputesTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "disputes",
                schema: "unitrade",
                columns: table => new
                {
                    dispute_id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    type = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "pending"),
                    subject_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    raised_by = table.Column<Guid>(type: "uuid", nullable: false),
                    reservation_id = table.Column<Guid>(type: "uuid", nullable: true),
                    listing_id = table.Column<Guid>(type: "uuid", nullable: true),
                    meetup_id = table.Column<int>(type: "integer", nullable: true),
                    seller_refused_photos = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    photos = table.Column<List<string>>(type: "text[]", nullable: false),
                    description = table.Column<string>(type: "text", nullable: true),
                    submitted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    admin_decision = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    outcomes = table.Column<List<string>>(type: "text[]", nullable: false),
                    reason = table.Column<string>(type: "text", nullable: true),
                    decided_by_admin_id = table.Column<Guid>(type: "uuid", nullable: true),
                    decided_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_disputes", x => x.dispute_id);
                    table.CheckConstraint("chk_dispute_status", "status IN ('pending','under_review','resolved','dismissed')");
                    table.CheckConstraint("chk_dispute_type", "type IN ('listing_quality','report_listing','no_show')");
                    table.ForeignKey(
                        name: "fk_disputes_listings_listing_id",
                        column: x => x.listing_id,
                        principalSchema: "unitrade",
                        principalTable: "listings",
                        principalColumn: "listing_id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_disputes_meetups_meetup_id",
                        column: x => x.meetup_id,
                        principalSchema: "unitrade",
                        principalTable: "meetups",
                        principalColumn: "meetup_id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_disputes_reservations_reservation_id",
                        column: x => x.reservation_id,
                        principalSchema: "unitrade",
                        principalTable: "reservations",
                        principalColumn: "reservation_id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_disputes_users_decided_by_admin_id",
                        column: x => x.decided_by_admin_id,
                        principalSchema: "unitrade",
                        principalTable: "users",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_disputes_users_raised_by",
                        column: x => x.raised_by,
                        principalSchema: "unitrade",
                        principalTable: "users",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_disputes_users_subject_user_id",
                        column: x => x.subject_user_id,
                        principalSchema: "unitrade",
                        principalTable: "users",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "ix_disputes_decided_by_admin_id",
                schema: "unitrade",
                table: "disputes",
                column: "decided_by_admin_id");

            migrationBuilder.CreateIndex(
                name: "ix_disputes_listing_id",
                schema: "unitrade",
                table: "disputes",
                column: "listing_id");

            migrationBuilder.CreateIndex(
                name: "ix_disputes_meetup_id",
                schema: "unitrade",
                table: "disputes",
                column: "meetup_id");

            migrationBuilder.CreateIndex(
                name: "ix_disputes_raised_by",
                schema: "unitrade",
                table: "disputes",
                column: "raised_by");

            migrationBuilder.CreateIndex(
                name: "ix_disputes_reservation_id",
                schema: "unitrade",
                table: "disputes",
                column: "reservation_id");

            migrationBuilder.CreateIndex(
                name: "ix_disputes_status",
                schema: "unitrade",
                table: "disputes",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "ix_disputes_subject",
                schema: "unitrade",
                table: "disputes",
                column: "subject_user_id");

            migrationBuilder.CreateIndex(
                name: "ix_disputes_submitted",
                schema: "unitrade",
                table: "disputes",
                column: "submitted_at",
                descending: new bool[0]);

            migrationBuilder.CreateIndex(
                name: "ix_disputes_type",
                schema: "unitrade",
                table: "disputes",
                column: "type");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "disputes",
                schema: "unitrade");
        }
    }
}
