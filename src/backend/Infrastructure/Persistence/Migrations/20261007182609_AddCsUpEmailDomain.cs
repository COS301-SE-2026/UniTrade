using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddCsUpEmailDomain : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                @"INSERT INTO unitrade.university_email_domains (university_id, email_domain, is_active)
                  VALUES (2, 'cs.up.ac.za',true)
                  ON CONFLICT (email_domain) DO NOTHING;"
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                @"DELETE FROM unitrade.university_email_domains
                  WHERE email_domain = 'cs.up.ac.za';"
            );
        }
    }
}
