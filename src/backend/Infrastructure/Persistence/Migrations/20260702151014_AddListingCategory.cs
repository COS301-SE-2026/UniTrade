using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddListingCategory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_listings_created_at",
                schema: "unitrade",
                table: "listings");

            migrationBuilder.DropIndex(
                name: "ix_listings_visibility",
                schema: "unitrade",
                table: "listings");

            migrationBuilder.DropCheckConstraint(
                name: "chk_isbn_validity",
                schema: "unitrade",
                table: "listings");

            migrationBuilder.DropCheckConstraint(
                name: "chk_listing_book_fields",
                schema: "unitrade",
                table: "listings");

            migrationBuilder.DropCheckConstraint(
                name: "chk_listing_type",
                schema: "unitrade",
                table: "listings");

            migrationBuilder.DropColumn(
                name: "author",
                schema: "unitrade",
                table: "listings");

            migrationBuilder.DropColumn(
                name: "edition",
                schema: "unitrade",
                table: "listings");

            migrationBuilder.DropColumn(
                name: "isbn",
                schema: "unitrade",
                table: "listings");

            migrationBuilder.DropColumn(
                name: "listing_type",
                schema: "unitrade",
                table: "listings");

            migrationBuilder.AddColumn<int>(
                name: "category_id",
                schema: "unitrade",
                table: "listings",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "course_id1",
                schema: "unitrade",
                table: "listings",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "listing_category_category_id",
                schema: "unitrade",
                table: "listings",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "metadata",
                schema: "unitrade",
                table: "listings",
                type: "jsonb",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "book_details",
                schema: "unitrade",
                columns: table => new
                {
                    listing_id = table.Column<Guid>(type: "uuid", nullable: false),
                    isbn = table.Column<string>(type: "character varying(13)", maxLength: 13, nullable: true),
                    author = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: true),
                    edition = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_book_details", x => x.listing_id);
                    table.CheckConstraint("chk_isbn_validity", "isbn IS NULL OR length(isbn) IN  (10,13)");
                    table.ForeignKey(
                        name: "fk_book_details_listings_listing_id",
                        column: x => x.listing_id,
                        principalSchema: "unitrade",
                        principalTable: "listings",
                        principalColumn: "listing_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "listing_categories",
                schema: "unitrade",
                columns: table => new
                {
                    category_id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    name = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    root_category_id = table.Column<int>(type: "integer", nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_listing_categories", x => x.category_id);
                    table.ForeignKey(
                        name: "fk_listing_categories_listing_categories_root_category_id",
                        column: x => x.root_category_id,
                        principalSchema: "unitrade",
                        principalTable: "listing_categories",
                        principalColumn: "category_id");
                });

            migrationBuilder.CreateIndex(
                name: "ix_listings_category",
                schema: "unitrade",
                table: "listings",
                column: "category_id");

            migrationBuilder.CreateIndex(
                name: "ix_listings_category_browse",
                schema: "unitrade",
                table: "listings",
                columns: new[] { "category_id", "listing_status", "created_at" },
                descending: new[] { false, false, true },
                filter: "listing_status = 'live'")
                .Annotation("Npgsql:IndexInclude", new[] { "title", "price", "seller_id" });

            migrationBuilder.CreateIndex(
                name: "ix_listings_course_browse",
                schema: "unitrade",
                table: "listings",
                columns: new[] { "course_id", "listing_status", "created_at" },
                descending: new[] { false, true, true },
                filter: "listing_status = 'live'")
                .Annotation("Npgsql:IndexInclude", new[] { "title", "price", "seller_id", "category_id" });

            migrationBuilder.CreateIndex(
                name: "ix_listings_course_id1",
                schema: "unitrade",
                table: "listings",
                column: "course_id1");

            migrationBuilder.CreateIndex(
                name: "ix_listings_listing_category_category_id",
                schema: "unitrade",
                table: "listings",
                column: "listing_category_category_id");

            migrationBuilder.CreateIndex(
                name: "ix_listing_categories_name",
                schema: "unitrade",
                table: "listing_categories",
                column: "name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_listing_categories_root_category_id",
                schema: "unitrade",
                table: "listing_categories",
                column: "root_category_id");

            migrationBuilder.AddForeignKey(
                name: "fk_listings_courses_course_id1",
                schema: "unitrade",
                table: "listings",
                column: "course_id1",
                principalSchema: "unitrade",
                principalTable: "courses",
                principalColumn: "course_id");

            migrationBuilder.AddForeignKey(
                name: "fk_listings_listing_categories_category_id",
                schema: "unitrade",
                table: "listings",
                column: "category_id",
                principalSchema: "unitrade",
                principalTable: "listing_categories",
                principalColumn: "category_id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "fk_listings_listing_categories_listing_category_category_id",
                schema: "unitrade",
                table: "listings",
                column: "listing_category_category_id",
                principalSchema: "unitrade",
                principalTable: "listing_categories",
                principalColumn: "category_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_listings_courses_course_id1",
                schema: "unitrade",
                table: "listings");

            migrationBuilder.DropForeignKey(
                name: "fk_listings_listing_categories_category_id",
                schema: "unitrade",
                table: "listings");

            migrationBuilder.DropForeignKey(
                name: "fk_listings_listing_categories_listing_category_category_id",
                schema: "unitrade",
                table: "listings");

            migrationBuilder.DropTable(
                name: "book_details",
                schema: "unitrade");

            migrationBuilder.DropTable(
                name: "listing_categories",
                schema: "unitrade");

            migrationBuilder.DropIndex(
                name: "ix_listings_category",
                schema: "unitrade",
                table: "listings");

            migrationBuilder.DropIndex(
                name: "ix_listings_category_browse",
                schema: "unitrade",
                table: "listings");

            migrationBuilder.DropIndex(
                name: "ix_listings_course_browse",
                schema: "unitrade",
                table: "listings");

            migrationBuilder.DropIndex(
                name: "ix_listings_course_id1",
                schema: "unitrade",
                table: "listings");

            migrationBuilder.DropIndex(
                name: "ix_listings_listing_category_category_id",
                schema: "unitrade",
                table: "listings");

            migrationBuilder.DropColumn(
                name: "category_id",
                schema: "unitrade",
                table: "listings");

            migrationBuilder.DropColumn(
                name: "course_id1",
                schema: "unitrade",
                table: "listings");

            migrationBuilder.DropColumn(
                name: "listing_category_category_id",
                schema: "unitrade",
                table: "listings");

            migrationBuilder.DropColumn(
                name: "metadata",
                schema: "unitrade",
                table: "listings");

            migrationBuilder.AddColumn<string>(
                name: "author",
                schema: "unitrade",
                table: "listings",
                type: "character varying(120)",
                maxLength: 120,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "edition",
                schema: "unitrade",
                table: "listings",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "isbn",
                schema: "unitrade",
                table: "listings",
                type: "character varying(13)",
                maxLength: 13,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "listing_type",
                schema: "unitrade",
                table: "listings",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "ix_listings_created_at",
                schema: "unitrade",
                table: "listings",
                column: "created_at",
                descending: new bool[0]);

            migrationBuilder.CreateIndex(
                name: "ix_listings_visibility",
                schema: "unitrade",
                table: "listings",
                columns: new[] { "listing_status", "visibility_score" },
                descending: new[] { false, true },
                filter: "listing_status = 'live'");

            migrationBuilder.AddCheckConstraint(
                name: "chk_isbn_validity",
                schema: "unitrade",
                table: "listings",
                sql: "isbn IS NULL OR length(isbn) IN  (10,13)");

            migrationBuilder.AddCheckConstraint(
                name: "chk_listing_book_fields",
                schema: "unitrade",
                table: "listings",
                sql: "listing_type ='book'  OR (course_id IS NULL AND isbn IS NULL AND author IS NULL AND edition IS NULL)");

            migrationBuilder.AddCheckConstraint(
                name: "chk_listing_type",
                schema: "unitrade",
                table: "listings",
                sql: "listing_type IN ('book', 'laptop', 'stationery', 'electronics', 'clothing', 'furniture', 'other')");
        }
    }
}
