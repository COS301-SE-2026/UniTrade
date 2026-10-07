using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddPerceptualHashToListingImages : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "perceptual_hash",
                schema: "unitrade",
                table: "listing_images",
                type: "character varying(16)",
                maxLength: 16,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "ix_listing_images_perceptual_hash",
                schema: "unitrade",
                table: "listing_images",
                column: "perceptual_hash");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_listing_images_perceptual_hash",
                schema: "unitrade",
                table: "listing_images");

            migrationBuilder.DropColumn(
                name: "perceptual_hash",
                schema: "unitrade",
                table: "listing_images");
        }
    }
}
