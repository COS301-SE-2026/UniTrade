using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class ChangeAiRiskReasonsToJsonb : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                CREATE OR REPLACE FUNCTION unitrade.fn_risk_reasons_to_jsonb(reasons text[])
                RETURNS jsonb AS $$
                    SELECT CASE
                        WHEN reasons IS NULL THEN NULL
                        ELSE(
                            SELECT jsonb_agg(jsonb_build_object('code',code,'detail',NULL))
                            FROM unnest(reasons) AS code
                        )
                    END
                $$ LANGUAGE sql IMMUTABLE;
            ");

            migrationBuilder.Sql(@"
                ALTER TABLE unitrade.listings
                ALTER COLUMN ai_risk_reasons TYPE jsonb
                USING unitrade.fn_risk_reasons_to_jsonb(ai_risk_reasons);
            ");

            migrationBuilder.Sql(@"DROP FUNCTION unitrade.fn_risk_reasons_to_jsonb(text[]);");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                CREATE OR REPLACE FUNCTION unitrade.fn_risk_reasons_to_textarray(reasons text[])
                RETURNS text[] AS $$
                    SELECT CASE
                        WHEN reasons IS NULL THEN NULL
                        ELSE(
                            SELECT ARRAY_AGG(jsonb_extract_path(elem,'code'))
                            FROM jsonb_array_elements(reasons) AS elem
                        )
                    END
                $$ LANGUAGE sql IMMUTABLE;
            ");

            migrationBuilder.Sql(@"
                ALTER TABLE unitrade.listings
                ALTER COLUMN ai_risk_reasons TYPE jsonb
                USING unitrade.fn_risk_reasons_to_textarray(ai_risk_reasons);
            ");

            migrationBuilder.Sql(@"DROP FUNCTION unitrade.fn_risk_reasons_to_textarray(jsonb);");
        }
    }
}
