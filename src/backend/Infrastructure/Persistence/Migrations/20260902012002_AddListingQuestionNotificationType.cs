using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddListingQuestionNotificationType : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "listing_questions",
                schema: "unitrade",
                columns: table => new
                {
                    question_id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    listing_id = table.Column<Guid>(type: "uuid", nullable: false),
                    asker_id = table.Column<Guid>(type: "uuid", nullable: false),
                    question_text = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    answer_text = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    asked_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    answered_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_listing_questions", x => x.question_id);
                });

            migrationBuilder.CreateIndex(
                name: "ix_listing_questions_listing_id",
                schema: "unitrade",
                table: "listing_questions",
                column: "listing_id");

             migrationBuilder.Sql(
                @"ALTER TABLE unitrade.notifications DROP CONSTRAINT chk_notif_type;"
            );

            migrationBuilder.Sql(
                @"ALTER TABLE unitrade.notifications ADD CONSTRAINT chk_notif_type CHECK (type IN ('listing_status', 'reservation_status', 'meetup_reminder', 'chat', 'dispute', 'verification', 'saved_search', 'listing_question'));"
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "listing_questions",
                schema: "unitrade");

            migrationBuilder.Sql(
                @"ALTER TABLE unitrade.notifications DROP CONSTRAINT chk_notif_type;"
            );

            migrationBuilder.Sql(
                @"ALTER TABLE unitrade.notifications ADD CONSTRAINT chk_notif_type CHECK (type IN ('listing_status', 'reservation_status', 'meetup_reminder', 'chat', 'dispute', 'verification', 'saved_search'));"
            );
        }
    }
}
