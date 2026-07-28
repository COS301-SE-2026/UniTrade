using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddUniversityEmailDomains : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "university_email_domains",
                schema: "unitrade",
                columns: table => new
                {
                    domain_id = table
                        .Column<int>(type: "integer", nullable: false)
                        .Annotation(
                            "Npgsql:ValueGenerationStrategy",
                            NpgsqlValueGenerationStrategy.IdentityByDefaultColumn
                        ),
                    university_id = table.Column<int>(type: "integer", nullable: false),
                    email_domain = table.Column<string>(type: "text", nullable: false),
                    is_active = table.Column<bool>(
                        type: "boolean",
                        nullable: false,
                        defaultValue: true
                    ),
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_university_email_domains", x => x.domain_id);
                    table.ForeignKey(
                        name: "fk_university_email_domains_universities_university_id",
                        column: x => x.university_id,
                        principalSchema: "unitrade",
                        principalTable: "universities",
                        principalColumn: "university_id",
                        onDelete: ReferentialAction.Cascade
                    );
                }
            );

            migrationBuilder.CreateIndex(
                name: "ix_university_email_domains_email_domain",
                schema: "unitrade",
                table: "university_email_domains",
                column: "email_domain",
                unique: true
            );

            migrationBuilder.CreateIndex(
                name: "ix_university_email_domains_university_id",
                schema: "unitrade",
                table: "university_email_domains",
                column: "university_id"
            );

            migrationBuilder.Sql(
                @"INSERT INTO unitrade.university_email_domains (university_id, email_domain, is_active)
            SELECT university_id, email_domain, is_active
            FROM unitrade.universities;"
            );

            migrationBuilder.Sql(
                @"INSERT INTO unitrade.university_email_domains (university_id, email_domain, is_active)
            VALUES (2, 'up.ac.za', true)
            ON CONFLICT (email_domain) DO NOTHING;"
            );

            migrationBuilder.DropIndex(
                name: "ix_universities_email_domain",
                schema: "unitrade",
                table: "universities"
            );

            migrationBuilder.DropColumn(
                name: "email_domain",
                schema: "unitrade",
                table: "universities"
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "email_domain",
                schema: "unitrade",
                table: "universities",
                type: "text",
                nullable: true
            );

            migrationBuilder.Sql(
                @"UPDATE unitrade.universities u
            SET email_domain = d.email_domain
            FROM(
                SELECT DISTINCT ON (university_id) university_id, email_domain 
                FROM unitrade.university_email_domains
                WHERE is_active = true
                ORDER BY university_id, domain_id
                ) d
                WHERE u.university_id = d.university_id;"
            );

            migrationBuilder.Sql(
                "ALTER TABLE unitrade.universities ALTER COLUMN email_domain SET NOT NULL;"
            );

            migrationBuilder.CreateIndex(
                name: "ix_universities_email_domain",
                schema: "unitrade",
                table: "universities",
                column: "email_domain",
                unique: true
            );

            migrationBuilder.DropTable(name: "university_email_domains", schema: "unitrade");
        }
    }
}
