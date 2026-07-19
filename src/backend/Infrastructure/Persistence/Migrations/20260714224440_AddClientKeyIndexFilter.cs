using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddClientKeyIndexFilter : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "client_key",
                schema: "unitrade",
                table: "chat_messages",
                type: "character varying(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "uix_chat_client_key",
                schema: "unitrade",
                table: "chat_messages",
                columns: new[] { "reservation_id", "client_key" },
                filter: "client_key IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "uix_chat_client_key",
                schema: "unitrade",
                table: "chat_messages");

            migrationBuilder.DropColumn(
                name: "client_key",
                schema: "unitrade",
                table: "chat_messages");
        }
    }
}
