using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class UpdateVerificationAuditTrigger : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                @"
            CREATE OR REPLACE FUNCTION unitrade.fn_audit_verification_decision() RETURNS trigger AS $$
            BEGIN
                IF NEW.admin_decision IS DISTINCT FROM OLD.admin_decision
                AND NEW.admin_decision IS NOT NULL THEN
                    INSERT INTO unitrade.audit_logs 
                        (actor_id, action, entity_type, entity_id, old_value, new_value, reason)
                    VALUES
                        (NEW.admin_id, 'verification_decision', 'verification_request', NEW.verification_id::TEXT, OLD.status, NEW.status, COALESCE(NEW.rejection_reason, NEW.admin_decision));
                END IF;
                RETURN NULL;
            END;
            $$ LANGUAGE plpgsql;
            "
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                @"CREATE OR REPLACE FUNCTION unitrade.fn_audit_verification_decision() 
                RETURNS trigger AS $$
                BEGIN
                    IF NEW.status <> OLD.status
                    AND NEW.status IN ('approved', 'rejected') THEN
                        INSERT INTO unitrade.audit_logs 
                            (actor_id, action, entity_type, entity_id, old_value, new_value, reason)
                        VALUES
                            (NEW.admin_id, 'verification_decision', 'verification_request', NEW.verification_id::TEXT, OLD.status, NEW.status, COALESCE(NEW.rejection_reason, NEW.admin_decision));
                    END IF;
                    RETURN NULL;
                END;
                $$ LANGUAGE plpgsql;"
            );
        }
    }
}
