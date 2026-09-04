using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddProofOfRegistrationDocuments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "proof_of_registration_documents",
                schema: "unitrade",
                columns: table => new
                {
                    document_id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    verification_id = table.Column<Guid>(type: "uuid", nullable: false),
                    file_data = table.Column<byte[]>(type: "bytea", nullable: false),
                    content_type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    file_size = table.Column<int>(type: "integer", nullable: false),
                    file_name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    uploaded_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_proof_of_registration_documents", x => x.document_id);
                    table.ForeignKey(
                        name: "fk_proof_of_registration_documents_verification_requests_verif",
                        column: x => x.verification_id,
                        principalSchema: "unitrade",
                        principalTable: "verification_requests",
                        principalColumn: "verification_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "uix_por_verification",
                schema: "unitrade",
                table: "proof_of_registration_documents",
                column: "verification_id",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "proof_of_registration_documents",
                schema: "unitrade");
        }
    }
}
