using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddReviewReputationTrigger : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                @"
                CREATE
                OR REPLACE FUNCTION fn_reputation_on_review() RETURNS trigger AS $$
                BEGIN
                    IF NEW.review_type = 'buyer_to_seller' THEN 

                        UPDATE unitrade.student_profiles
                        SET seller_trust_score = (
                                SELECT
                                    AVG(r.rating :: NUMERIC(4, 2))
                                FROM unitrade.reviews r
                                WHERE r.reviewee_id = NEW.reviewee_id
                                    AND r.review_type = 'buyer_to_seller'
                        )
                        WHERE
                            student_id = NEW.reviewee_id;
                    ELSIF NEW.review_type = 'seller_to_buyer' THEN 
                        UPDATE unitrade.student_profiles
                        SET buyer_reliability_score = (
                                SELECT
                                    AVG(r.rating :: NUMERIC(4, 2))
                                FROM unitrade.reviews r
                                WHERE r.reviewee_id = NEW.reviewee_id
                                    AND r.review_type = 'seller_to_buyer'
                        )
                        WHERE
                            student_id = NEW.reviewee_id;
                    END IF;
                    RETURN NULL;

                END;

                $$ LANGUAGE plpgsql;

                CREATE TRIGGER tr_reputation_on_review
                AFTER INSERT ON unitrade.reviews FOR EACH ROW EXECUTE FUNCTION fn_reputation_on_review();
       ");
}

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"DROP TRIGGER IF EXISTS tr_reputation_on_review ON unitrade.reviews;
            DROP FUNCTION IF EXISTS fn_reputation_on_review()");
        }
    }
}
