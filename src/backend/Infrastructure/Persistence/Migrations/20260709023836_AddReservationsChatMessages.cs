using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddReservationsChatMessages : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_listings_listing_categories_listing_category_category_id",
                schema: "unitrade",
                table: "listings");

            migrationBuilder.DropIndex(
                name: "ix_listings_listing_category_category_id",
                schema: "unitrade",
                table: "listings");

            migrationBuilder.DropCheckConstraint(
                name: "chk_listing_status",
                schema: "unitrade",
                table: "listings");

            migrationBuilder.DropColumn(
                name: "listing_category_category_id",
                schema: "unitrade",
                table: "listings");

            migrationBuilder.CreateTable(
                name: "reservations",
                schema: "unitrade",
                columns: table => new
                {
                    reservation_id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    buyer_id = table.Column<Guid>(type: "uuid", nullable: false),
                    seller_id = table.Column<Guid>(type: "uuid", nullable: false),
                    is_bundle = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    reservation_status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    seller_acknowledged_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    buyer_responded_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    expires_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_reservations", x => x.reservation_id);
                    table.CheckConstraint("chk_res_status", "reservation_status IN ('active', 'expired', 'cancelled', 'completed')");
                    table.ForeignKey(
                        name: "fk_reservations_users_buyer_id",
                        column: x => x.buyer_id,
                        principalSchema: "unitrade",
                        principalTable: "users",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_reservations_users_seller_id",
                        column: x => x.seller_id,
                        principalSchema: "unitrade",
                        principalTable: "users",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "chat_messages",
                schema: "unitrade",
                columns: table => new
                {
                    message_id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    reservation_id = table.Column<Guid>(type: "uuid", nullable: false),
                    sender_id = table.Column<Guid>(type: "uuid", nullable: true),
                    message_type = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "text"),
                    content = table.Column<string>(type: "text", nullable: false),
                    payload = table.Column<string>(type: "jsonb", nullable: true),
                    sent_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    read_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_chat_messages", x => x.message_id);
                    table.CheckConstraint("chk_message_type", "message_type IN ('text', 'system', 'meetup_proposal',  'meetup_response')");
                    table.CheckConstraint("chk_payload_type", "(message_type IN ('meetup_proposal', 'meetup_response') AND payload IS NOT NULL ) OR( message_type IN ('text', 'system')  AND payload IS NULL )");
                    table.CheckConstraint("chk_system_sender", "(message_type = 'system' AND sender_id IS NULL) OR (message_type <> 'system' AND sender_id IS NOT NULL)");
                    table.ForeignKey(
                        name: "fk_chat_messages_reservations_reservation_id",
                        column: x => x.reservation_id,
                        principalSchema: "unitrade",
                        principalTable: "reservations",
                        principalColumn: "reservation_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_chat_messages_users_sender_id",
                        column: x => x.sender_id,
                        principalSchema: "unitrade",
                        principalTable: "users",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "reservation_listings",
                schema: "unitrade",
                columns: table => new
                {
                    reservation_id = table.Column<Guid>(type: "uuid", nullable: false),
                    listing_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_reservation_listings", x => new { x.reservation_id, x.listing_id });
                    table.ForeignKey(
                        name: "fk_reservation_listings_listings_listing_id",
                        column: x => x.listing_id,
                        principalSchema: "unitrade",
                        principalTable: "listings",
                        principalColumn: "listing_id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_reservation_listings_reservations_reservation_id",
                        column: x => x.reservation_id,
                        principalSchema: "unitrade",
                        principalTable: "reservations",
                        principalColumn: "reservation_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.AddCheckConstraint(
                name: "chk_listing_status",
                schema: "unitrade",
                table: "listings",
                sql: "listing_status IN ('draft', 'pending', 'live', 'reserved', 'low_visibility', 'rejected', 'sold', 'removed')");

            migrationBuilder.CreateIndex(
                name: "ix_chat_messages_sender_id",
                schema: "unitrade",
                table: "chat_messages",
                column: "sender_id");

            migrationBuilder.CreateIndex(
                name: "ix_chat_reservation",
                schema: "unitrade",
                table: "chat_messages",
                columns: new[] { "reservation_id", "sent_at" });

            migrationBuilder.CreateIndex(
                name: "ix_chat_unread",
                schema: "unitrade",
                table: "chat_messages",
                columns: new[] { "reservation_id", "read_at" },
                filter: "read_at IS NULL");

            migrationBuilder.CreateIndex(
                name: "ix_reservation_listings_listing_id",
                schema: "unitrade",
                table: "reservation_listings",
                column: "listing_id");

            migrationBuilder.CreateIndex(
                name: "ix_res_buyer",
                schema: "unitrade",
                table: "reservations",
                column: "buyer_id");

            migrationBuilder.CreateIndex(
                name: "ix_res_expires",
                schema: "unitrade",
                table: "reservations",
                column: "expires_at",
                filter: "reservation_status = 'active'");

            migrationBuilder.CreateIndex(
                name: "ix_res_seller",
                schema: "unitrade",
                table: "reservations",
                column: "seller_id");

            migrationBuilder.CreateIndex(
                name: "ix_res_status",
                schema: "unitrade",
                table: "reservations",
                column: "reservation_status");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "chat_messages",
                schema: "unitrade");

            migrationBuilder.DropTable(
                name: "reservation_listings",
                schema: "unitrade");

            migrationBuilder.DropTable(
                name: "reservations",
                schema: "unitrade");

            migrationBuilder.DropCheckConstraint(
                name: "chk_listing_status",
                schema: "unitrade",
                table: "listings");

            migrationBuilder.AddColumn<int>(
                name: "listing_category_category_id",
                schema: "unitrade",
                table: "listings",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "ix_listings_listing_category_category_id",
                schema: "unitrade",
                table: "listings",
                column: "listing_category_category_id");

            migrationBuilder.AddCheckConstraint(
                name: "chk_listing_status",
                schema: "unitrade",
                table: "listings",
                sql: "listing_status IN ('draft', 'pending', 'live', 'low_visibility', 'rejected', 'sold', 'removed')");

            migrationBuilder.AddForeignKey(
                name: "fk_listings_listing_categories_listing_category_category_id",
                schema: "unitrade",
                table: "listings",
                column: "listing_category_category_id",
                principalSchema: "unitrade",
                principalTable: "listing_categories",
                principalColumn: "category_id");
        }
    }
}
