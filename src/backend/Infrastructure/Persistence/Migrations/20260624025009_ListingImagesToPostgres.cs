using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class ListingImagesToPostgres : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "image_url",
                schema: "unitrade",
                table: "listing_images");

            migrationBuilder.AddColumn<string>(
                name: "content_type",
                schema: "unitrade",
                table: "listing_images",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "file_size",
                schema: "unitrade",
                table: "listing_images",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<byte[]>(
                name: "image_data",
                schema: "unitrade",
                table: "listing_images",
                type: "bytea",
                nullable: false,
                defaultValue: new byte[0]);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "content_type",
                schema: "unitrade",
                table: "listing_images");

            migrationBuilder.DropColumn(
                name: "file_size",
                schema: "unitrade",
                table: "listing_images");

            migrationBuilder.DropColumn(
                name: "image_data",
                schema: "unitrade",
                table: "listing_images");

            migrationBuilder.AddColumn<string>(
                name: "image_url",
                schema: "unitrade",
                table: "listing_images",
                type: "text",
                nullable: false,
                defaultValue: "");
        }
    }
}
