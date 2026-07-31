using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddReviewsAndReputationScores : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_transactions_reservations_reservation_id",
                schema: "unitrade",
                table: "transactions");

            migrationBuilder.RenameColumn(
                name: "payment_status",
                schema: "unitrade",
                table: "transactions",
                newName: "transaction_status");

            migrationBuilder.RenameColumn(
                name: "pay_fast_payment_id",
                schema: "unitrade",
                table: "transactions",
                newName: "pay_fast_transaction_id");

            migrationBuilder.RenameColumn(
                name: "reputation_score",
                schema: "unitrade",
                table: "student_profiles",
                newName: "seller_trust_score");

            migrationBuilder.AddColumn<decimal>(
                name: "buyer_reliability_score",
                schema: "unitrade",
                table: "student_profiles",
                type: "numeric(4,2)",
                precision: 4,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.CreateTable(
                name: "reviews",
                schema: "unitrade",
                columns: table => new
                {
                    review_id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    transaction_id = table.Column<Guid>(type: "uuid", nullable: false),
                    reviewer_id = table.Column<Guid>(type: "uuid", nullable: false),
                    reviewee_id = table.Column<Guid>(type: "uuid", nullable: false),
                    rating = table.Column<int>(type: "integer", nullable: false),
                    comment = table.Column<string>(type: "text", nullable: true),
                    review_type = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_reviews", x => x.review_id);
                    table.CheckConstraint("chk_rating", "rating BETWEEN 1 AND 5");
                    table.CheckConstraint("chk_review_self", "reviewer_id <> reviewee_id");
                    table.CheckConstraint("chk_review_type", "review_type IN ('buyer_to_seller', 'seller_to_buyer')");
                    table.ForeignKey(
                        name: "fk_reviews_transactions_transaction_id",
                        column: x => x.transaction_id,
                        principalSchema: "unitrade",
                        principalTable: "transactions",
                        principalColumn: "transaction_id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "ix_review_reviewee",
                schema: "unitrade",
                table: "reviews",
                column: "reviewee_id");

            migrationBuilder.CreateIndex(
                name: "review_per_transaction",
                schema: "unitrade",
                table: "reviews",
                columns: new[] { "transaction_id", "reviewer_id" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "fk_transactions_reservations_reservation_id",
                schema: "unitrade",
                table: "transactions",
                column: "reservation_id",
                principalSchema: "unitrade",
                principalTable: "reservations",
                principalColumn: "reservation_id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_transactions_reservations_reservation_id",
                schema: "unitrade",
                table: "transactions");

            migrationBuilder.DropTable(
                name: "reviews",
                schema: "unitrade");

            migrationBuilder.DropColumn(
                name: "buyer_reliability_score",
                schema: "unitrade",
                table: "student_profiles");

            migrationBuilder.RenameColumn(
                name: "transaction_status",
                schema: "unitrade",
                table: "transactions",
                newName: "payment_status");

            migrationBuilder.RenameColumn(
                name: "pay_fast_transaction_id",
                schema: "unitrade",
                table: "transactions",
                newName: "pay_fast_payment_id");

            migrationBuilder.RenameColumn(
                name: "seller_trust_score",
                schema: "unitrade",
                table: "student_profiles",
                newName: "reputation_score");

            migrationBuilder.AddForeignKey(
                name: "fk_transactions_reservations_reservation_id",
                schema: "unitrade",
                table: "transactions",
                column: "reservation_id",
                principalSchema: "unitrade",
                principalTable: "reservations",
                principalColumn: "reservation_id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
