using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddAuditLogTriggerForVerification : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                @"
            CREATE OR REPLACE FUNCTION unitrade.fn_audit_verification_decision() RETURNS trigger AS $$
            BEGIN
                IF NEW.status <> OLD.status
                AND NEW.status IN ('approved', 'rejected') THEN
                    INSERT INTO unitrade.audit_logs 
                        (actor_id, action, entity_type, entity_id, old_value, new_value, reason)
                    VALUES
                        (NEW.admin_id, 'verification_decision', 'verification_request', NEW.verification_id :: TEXT, OLD.status, NEW.status, COALESCE(NEW.rejection_reason, NEW.admin_decision));
                END IF;
                RETURN NULL;
            END;
            $$ LANGUAGE plpgsql;


            CREATE TRIGGER tr_audit_verification_decision
            AFTER
            UPDATE
            ON unitrade.verification_requests
            FOR EACH ROW EXECUTE FUNCTION unitrade.fn_audit_verification_decision();
            "
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                @"DROP TRIGGER IF EXISTS tr_audit_verification_decision ON unitrade.verification_requests;"
            );
            migrationBuilder.Sql(
                @"DROP FUNCTION IF EXISTS unitrade.fn_audit_verification_decision();"
            );
        }
    }
}
