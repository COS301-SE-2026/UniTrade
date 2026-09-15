using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class UpdateNotificationTypes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                @"ALTER TABLE unitrade.notifications DROP CONSTRAINT chk_notif_type;"
            );

            migrationBuilder.Sql(
                @"ALTER TABLE unitrade.notifications ADD CONSTRAINT chk_notif_type CHECK (type IN ('listing_status', 'reservation_status', 'meetup_reminder', 'chat', 'dispute', 'verification', 'saved_search', 'listing_question', 'dispute_outcome'));"
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                @"ALTER TABLE unitrade.notifications DROP CONSTRAINT chk_notif_type;"
            );

            migrationBuilder.Sql(
                @"ALTER TABLE unitrade.notifications ADD CONSTRAINT chk_notif_type CHECK (type IN ('listing_status', 'reservation_status', 'meetup_reminder', 'chat', 'dispute', 'verification', 'saved_search', 'listing_question'));"
            );
        }
    }
}
