using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddBundleDiscount : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "bundle_discount_percent",
                schema: "unitrade",
                table: "student_profiles",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "bundle_min_items",
                schema: "unitrade",
                table: "student_profiles",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "bundle_discount_percent",
                schema: "unitrade",
                table: "reservations",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "subtotal_amount",
                schema: "unitrade",
                table: "reservations",
                type: "numeric(10,2)",
                precision: 10,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "total_amount",
                schema: "unitrade",
                table: "reservations",
                type: "numeric(10,2)",
                precision: 10,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddCheckConstraint(
                name: "chk_student_bundle_rule",
                schema: "unitrade",
                table: "student_profiles",
                sql: "(bundle_min_items IS NULL AND bundle_discount_percent IS NULL) OR (bundle_min_items BETWEEN 3 AND 10 AND bundle_discount_percent BETWEEN 1 AND 30)");

            migrationBuilder.AddCheckConstraint(
                name: "chk_res_amount",
                schema: "unitrade",
                table: "reservations",
                sql: "subtotal_amount >= 0 AND total_amount >=0 AND total_amount <= subtotal_amount");

            migrationBuilder.AddCheckConstraint(
                name: "chk_res_discount_percent",
                schema: "unitrade",
                table: "reservations",
                sql: "bundle_discount_percent IS NULL OR bundle_discount_percent BETWEEN 1 AND 30");
            
            migrationBuilder.Sql(@"
            UPDATE unitrade.reservations r 
            SET subtotal_amount = t.total, total_amount = t.total
            FROM (
                SELECT rl.reservation_id,
                        SUM(COALESCE(
                            (SELECT ls.price FROM unitrade.listing_snapshot ls
                            WHERE ls.reservation_id = rl.reservation_id AND ls.listing_id = rl.listing_id
                            LIMIT 1),
                            l.price)) AS total
                FROM unitrade.reservation_listings rl
                JOIN unitrade.listings l ON l.listing_id = rl.listing_id
                GROUP BY rl.reservation_id
            ) t
            WHERE r.reservation_id = t.reservation_id;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "chk_student_bundle_rule",
                schema: "unitrade",
                table: "student_profiles");

            migrationBuilder.DropCheckConstraint(
                name: "chk_res_amount",
                schema: "unitrade",
                table: "reservations");

            migrationBuilder.DropCheckConstraint(
                name: "chk_res_discount_percent",
                schema: "unitrade",
                table: "reservations");

            migrationBuilder.DropColumn(
                name: "bundle_discount_percent",
                schema: "unitrade",
                table: "student_profiles");

            migrationBuilder.DropColumn(
                name: "bundle_min_items",
                schema: "unitrade",
                table: "student_profiles");

            migrationBuilder.DropColumn(
                name: "bundle_discount_percent",
                schema: "unitrade",
                table: "reservations");

            migrationBuilder.DropColumn(
                name: "subtotal_amount",
                schema: "unitrade",
                table: "reservations");

            migrationBuilder.DropColumn(
                name: "total_amount",
                schema: "unitrade",
                table: "reservations");
        }
    }
}
