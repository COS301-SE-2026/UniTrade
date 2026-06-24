using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(name: "unitrade");

            migrationBuilder.CreateTable(
                name: "universities",
                schema: "unitrade",
                columns: table => new
                {
                    university_id = table
                        .Column<int>(type: "integer", nullable: false)
                        .Annotation(
                            "Npgsql:ValueGenerationStrategy",
                            NpgsqlValueGenerationStrategy.IdentityByDefaultColumn
                        ),
                    name = table.Column<string>(type: "text", nullable: false),
                    email_domain = table.Column<string>(type: "text", nullable: false),
                    is_active = table.Column<bool>(
                        type: "boolean",
                        nullable: false,
                        defaultValue: true
                    ),
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_universities", x => x.university_id);
                }
            );

            migrationBuilder.CreateTable(
                name: "users",
                schema: "unitrade",
                columns: table => new
                {
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    first_name = table.Column<string>(
                        type: "character varying(50)",
                        maxLength: 50,
                        nullable: false
                    ),
                    last_name = table.Column<string>(
                        type: "character varying(50)",
                        maxLength: 50,
                        nullable: false
                    ),
                    email = table.Column<string>(
                        type: "character varying(255)",
                        maxLength: 255,
                        nullable: false
                    ),
                    phone_number = table.Column<string>(
                        type: "character varying(20)",
                        maxLength: 20,
                        nullable: true
                    ),
                    password_hash = table.Column<string>(type: "text", nullable: false),
                    role = table.Column<string>(
                        type: "character varying(10)",
                        maxLength: 10,
                        nullable: false
                    ),
                    created_at = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: false
                    ),
                    updated_at = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: false
                    ),
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_users", x => x.user_id);
                    table.CheckConstraint("chk_user_role", "role IN ('student', 'admin')");
                }
            );

            migrationBuilder.CreateTable(
                name: "courses",
                schema: "unitrade",
                columns: table => new
                {
                    course_id = table
                        .Column<int>(type: "integer", nullable: false)
                        .Annotation(
                            "Npgsql:ValueGenerationStrategy",
                            NpgsqlValueGenerationStrategy.IdentityByDefaultColumn
                        ),
                    university_id = table.Column<int>(type: "integer", nullable: false),
                    course_code = table.Column<string>(type: "text", nullable: false),
                    course_name = table.Column<string>(type: "text", nullable: false),
                    faculty = table.Column<string>(type: "text", nullable: true),
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_courses", x => x.course_id);
                    table.ForeignKey(
                        name: "fk_courses_universities_university_id",
                        column: x => x.university_id,
                        principalSchema: "unitrade",
                        principalTable: "universities",
                        principalColumn: "university_id",
                        onDelete: ReferentialAction.Cascade
                    );
                }
            );

            migrationBuilder.CreateTable(
                name: "admin_profiles",
                schema: "unitrade",
                columns: table => new
                {
                    admin_id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    university_id = table.Column<int>(type: "integer", nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_admin_profiles", x => x.admin_id);
                    table.ForeignKey(
                        name: "fk_admin_profiles_universities_university_id",
                        column: x => x.university_id,
                        principalSchema: "unitrade",
                        principalTable: "universities",
                        principalColumn: "university_id",
                        onDelete: ReferentialAction.Cascade
                    );
                    table.ForeignKey(
                        name: "fk_admin_profiles_users_user_id",
                        column: x => x.user_id,
                        principalSchema: "unitrade",
                        principalTable: "users",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Cascade
                    );
                }
            );

            migrationBuilder.CreateTable(
                name: "verification_requests",
                schema: "unitrade",
                columns: table => new
                {
                    verification_id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    attempt_number = table.Column<int>(type: "integer", nullable: false),
                    is_current = table.Column<bool>(type: "boolean", nullable: false),
                    otp_code_hash = table.Column<string>(
                        type: "character varying(255)",
                        maxLength: 255,
                        nullable: true
                    ),
                    otp_sent_at = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: true
                    ),
                    otp_expires_at = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: false
                    ),
                    otp_verified_at = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: true
                    ),
                    otp_resend_count = table.Column<int>(type: "integer", nullable: true),
                    por_file_path = table.Column<string>(type: "text", nullable: true),
                    ai_confidence_score = table.Column<decimal>(
                        type: "numeric(5,2)",
                        precision: 5,
                        scale: 2,
                        nullable: true
                    ),
                    ai_decision = table.Column<string>(
                        type: "character varying(20)",
                        maxLength: 20,
                        nullable: true
                    ),
                    admin_id = table.Column<Guid>(type: "uuid", nullable: true),
                    admin_decision = table.Column<string>(
                        type: "character varying(20)",
                        maxLength: 20,
                        nullable: true
                    ),
                    rejection_reason = table.Column<string>(type: "text", nullable: true),
                    status = table.Column<string>(
                        type: "character varying(20)",
                        maxLength: 20,
                        nullable: false,
                        defaultValue: "otp_pending"
                    ),
                    submitted_at = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: false
                    ),
                    decided_at = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: true
                    ),
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_verification_requests", x => x.verification_id);
                    table.CheckConstraint(
                        "chk_vr_status",
                        "status IN ('otp_pending', 'por_pending','under_review','approved', 'rejected')"
                    );
                    table.ForeignKey(
                        name: "fk_verification_requests_users_user_id",
                        column: x => x.user_id,
                        principalSchema: "unitrade",
                        principalTable: "users",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Cascade
                    );
                }
            );

            migrationBuilder.CreateTable(
                name: "listings",
                schema: "unitrade",
                columns: table => new
                {
                    listing_id = table.Column<Guid>(
                        type: "uuid",
                        nullable: false,
                        defaultValueSql: "gen_random_uuid()"
                    ),
                    seller_id = table.Column<Guid>(type: "uuid", nullable: false),
                    title = table.Column<string>(
                        type: "character varying(150)",
                        maxLength: 150,
                        nullable: false
                    ),
                    description = table.Column<string>(type: "text", nullable: false),
                    price = table.Column<decimal>(
                        type: "numeric(10,2)",
                        precision: 10,
                        scale: 2,
                        nullable: false
                    ),
                    condition = table.Column<string>(
                        type: "character varying(5)",
                        maxLength: 5,
                        nullable: false
                    ),
                    listing_type = table.Column<string>(
                        type: "character varying(20)",
                        maxLength: 20,
                        nullable: false
                    ),
                    course_id = table.Column<int>(type: "integer", nullable: true),
                    isbn = table.Column<string>(
                        type: "character varying(13)",
                        maxLength: 13,
                        nullable: true
                    ),
                    author = table.Column<string>(
                        type: "character varying(120)",
                        maxLength: 120,
                        nullable: true
                    ),
                    edition = table.Column<string>(
                        type: "character varying(50)",
                        maxLength: 50,
                        nullable: true
                    ),
                    listing_status = table.Column<string>(
                        type: "character varying(20)",
                        maxLength: 20,
                        nullable: false
                    ),
                    ai_risk_score = table.Column<decimal>(
                        type: "numeric(5,2)",
                        precision: 5,
                        scale: 2,
                        nullable: true
                    ),
                    ai_risk_level = table.Column<string>(
                        type: "character varying(10)",
                        maxLength: 10,
                        nullable: true
                    ),
                    visibility_score = table.Column<int>(
                        type: "integer",
                        nullable: true,
                        defaultValue: 100
                    ),
                    is_bundle = table.Column<bool>(
                        type: "boolean",
                        nullable: true,
                        defaultValue: false
                    ),
                    rejection_reason = table.Column<string>(type: "text", nullable: true),
                    view_count = table.Column<int>(
                        type: "integer",
                        nullable: true,
                        defaultValue: 0
                    ),
                    created_at = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: false,
                        defaultValueSql: "now()"
                    ),
                    updated_at = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: false,
                        defaultValueSql: "now()"
                    ),
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_listings", x => x.listing_id);
                    table.CheckConstraint(
                        "chk_isbn_validity",
                        "isbn IS NULL OR length(isbn) IN  (10,13)"
                    );
                    table.CheckConstraint(
                        "chk_listing_book_fields",
                        "listing_type ='book'  OR (course_id IS NULL AND isbn IS NULL AND author IS NULL AND edition IS NULL)"
                    );
                    table.CheckConstraint(
                        "chk_listing_condition",
                        "condition IN ('new', 'good', 'fair', 'poor')"
                    );
                    table.CheckConstraint("chk_listing_price", "price > 0");
                    table.CheckConstraint(
                        "chk_listing_risk",
                        "ai_risk_level IS NULL OR ai_risk_level IN ('low', 'medium', 'high')"
                    );
                    table.CheckConstraint(
                        "chk_listing_type",
                        "listing_type IN ('book', 'laptop', 'stationery', 'electronics', 'clothing', 'furniture', 'other')"
                    );
                    table.ForeignKey(
                        name: "fk_listings_courses_course_id",
                        column: x => x.course_id,
                        principalSchema: "unitrade",
                        principalTable: "courses",
                        principalColumn: "course_id",
                        onDelete: ReferentialAction.Restrict
                    );
                    table.ForeignKey(
                        name: "fk_listings_users_seller_id",
                        column: x => x.seller_id,
                        principalSchema: "unitrade",
                        principalTable: "users",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Restrict
                    );
                }
            );

            migrationBuilder.CreateTable(
                name: "student_profiles",
                schema: "unitrade",
                columns: table => new
                {
                    student_id = table.Column<Guid>(type: "uuid", nullable: false),
                    student_number = table.Column<string>(
                        type: "character varying(50)",
                        maxLength: 50,
                        nullable: true
                    ),
                    university_id = table.Column<int>(type: "integer", nullable: false),
                    course_id = table.Column<int>(type: "integer", nullable: true),
                    year_of_study = table.Column<int>(type: "integer", nullable: false),
                    verification_status = table.Column<string>(
                        type: "character varying(20)",
                        maxLength: 20,
                        nullable: false,
                        defaultValue: "pending"
                    ),
                    reputation_score = table.Column<decimal>(
                        type: "numeric(4,2)",
                        precision: 4,
                        scale: 2,
                        nullable: false,
                        defaultValue: 0m
                    ),
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_student_profiles", x => x.student_id);
                    table.CheckConstraint(
                        "chk_student_verification",
                        "verification_status IN ('pending', 'partial', 'verified', 'rejected')"
                    );
                    table.CheckConstraint("chk_student_year", "year_of_study BETWEEN 1 AND 8");
                    table.ForeignKey(
                        name: "fk_student_profiles_courses_course_id",
                        column: x => x.course_id,
                        principalSchema: "unitrade",
                        principalTable: "courses",
                        principalColumn: "course_id",
                        onDelete: ReferentialAction.Restrict
                    );
                    table.ForeignKey(
                        name: "fk_student_profiles_universities_university_id",
                        column: x => x.university_id,
                        principalSchema: "unitrade",
                        principalTable: "universities",
                        principalColumn: "university_id",
                        onDelete: ReferentialAction.Restrict
                    );
                    table.ForeignKey(
                        name: "fk_student_profiles_users_student_id",
                        column: x => x.student_id,
                        principalSchema: "unitrade",
                        principalTable: "users",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Cascade
                    );
                }
            );

            migrationBuilder.CreateTable(
                name: "listing_images",
                schema: "unitrade",
                columns: table => new
                {
                    image_id = table
                        .Column<int>(type: "integer", nullable: false)
                        .Annotation(
                            "Npgsql:ValueGenerationStrategy",
                            NpgsqlValueGenerationStrategy.IdentityByDefaultColumn
                        ),
                    listing_id = table.Column<Guid>(type: "uuid", nullable: false),
                    image_url = table.Column<string>(type: "text", nullable: false),
                    is_primary = table.Column<bool>(
                        type: "boolean",
                        nullable: false,
                        defaultValue: false
                    ),
                    uploaded_at = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: false,
                        defaultValueSql: "now()"
                    ),
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_listing_images", x => x.image_id);
                    table.ForeignKey(
                        name: "fk_listing_images_listings_listing_id",
                        column: x => x.listing_id,
                        principalSchema: "unitrade",
                        principalTable: "listings",
                        principalColumn: "listing_id",
                        onDelete: ReferentialAction.Cascade
                    );
                }
            );

            migrationBuilder.CreateIndex(
                name: "ix_admin_profiles_university_id",
                schema: "unitrade",
                table: "admin_profiles",
                column: "university_id"
            );

            migrationBuilder.CreateIndex(
                name: "ix_admin_profiles_user_id",
                schema: "unitrade",
                table: "admin_profiles",
                column: "user_id",
                unique: true
            );

            migrationBuilder.CreateIndex(
                name: "ix_courses_course_code",
                schema: "unitrade",
                table: "courses",
                column: "course_code",
                unique: true
            );

            migrationBuilder.CreateIndex(
                name: "ix_courses_university_id",
                schema: "unitrade",
                table: "courses",
                column: "university_id"
            );

            migrationBuilder.CreateIndex(
                name: "ix_listing_images_listing",
                schema: "unitrade",
                table: "listing_images",
                column: "listing_id"
            );

            migrationBuilder.CreateIndex(
                name: "ix_listings_course",
                schema: "unitrade",
                table: "listings",
                column: "course_id"
            );

            migrationBuilder.CreateIndex(
                name: "ix_listings_created_at",
                schema: "unitrade",
                table: "listings",
                column: "created_at",
                descending: new bool[0]
            );

            migrationBuilder.CreateIndex(
                name: "ix_listings_feed",
                schema: "unitrade",
                table: "listings",
                columns: new[] { "listing_status", "visibility_score", "created_at" },
                descending: new[] { false, true, true },
                filter: "listing_status = 'live'"
            );

            migrationBuilder.CreateIndex(
                name: "ix_listings_seller",
                schema: "unitrade",
                table: "listings",
                column: "seller_id"
            );

            migrationBuilder.CreateIndex(
                name: "ix_listings_visibility",
                schema: "unitrade",
                table: "listings",
                columns: new[] { "listing_status", "visibility_score" },
                descending: new[] { false, true },
                filter: "listing_status = 'live'"
            );

            migrationBuilder.CreateIndex(
                name: "ix_student_course",
                schema: "unitrade",
                table: "student_profiles",
                column: "course_id"
            );

            migrationBuilder.CreateIndex(
                name: "ix_student_status",
                schema: "unitrade",
                table: "student_profiles",
                column: "verification_status"
            );

            migrationBuilder.CreateIndex(
                name: "ix_student_university",
                schema: "unitrade",
                table: "student_profiles",
                column: "university_id"
            );

            migrationBuilder.CreateIndex(
                name: "ix_universities_email_domain",
                schema: "unitrade",
                table: "universities",
                column: "email_domain",
                unique: true
            );

            migrationBuilder.CreateIndex(
                name: "ix_users_email",
                schema: "unitrade",
                table: "users",
                column: "email",
                unique: true
            );

            migrationBuilder.CreateIndex(
                name: "ix_users_role",
                schema: "unitrade",
                table: "users",
                column: "role"
            );

            migrationBuilder.CreateIndex(
                name: "ix_verification_requests_user_id_attempt_number",
                schema: "unitrade",
                table: "verification_requests",
                columns: new[] { "user_id", "attempt_number" },
                unique: true
            );

            migrationBuilder.CreateIndex(
                name: "ix_vr_status",
                schema: "unitrade",
                table: "verification_requests",
                column: "status"
            );

            migrationBuilder.CreateIndex(
                name: "uix_vr_current",
                schema: "unitrade",
                table: "verification_requests",
                column: "user_id",
                unique: true,
                filter: "is_current = true"
            );
            migrationBuilder.Sql(
                @"
                CREATE
                OR REPLACE FUNCTION unitrade.fn_set_updated_at() RETURNS trigger AS $$ BEGIN NEW.updated_at := now();

                RETURN NEW;

                END;

                $$ LANGUAGE plpgsql;

                CREATE TRIGGER tr_users_updated_at BEFORE
                UPDATE
                    ON unitrade.users FOR EACH ROW EXECUTE FUNCTION unitrade.fn_set_updated_at();

                --listing updates 
                CREATE TRIGGER tr_listings_updated_at BEFORE
                UPDATE
                    ON unitrade.listings FOR EACH ROW EXECUTE FUNCTION unitrade.fn_set_updated_at();

            "
            );

            migrationBuilder.Sql(
                @"
                CREATE
                OR REPLACE FUNCTION unitrade.fn_verification_set_current() RETURNS trigger AS $$ BEGIN
                UPDATE
                    unitrade.verification_requests
                SET
                    is_current = FALSE
                WHERE
                    user_id = NEW.user_id
                    AND verification_id <> NEW.verification_id;

                RETURN NULL;

                END;

                $$ LANGUAGE plpgsql;

                CREATE TRIGGER tr_verification_set_current
                AFTER
                INSERT
                    ON unitrade.verification_requests FOR EACH ROW EXECUTE FUNCTION unitrade.fn_verification_set_current();

            "
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                @"
                DROP TRIGGER IF EXISTS tr_verification_set_current ON unitrade.verification_requests;
                DROP TRIGGER IF EXISTS tr_listings_updated_at ON unitrade.listings;
                DROP TRIGGER IF EXISTS tr_users_updated_at ON unitrade.users;
                    
                DROP FUNCTION IF EXISTS unitrade.fn_verification_set_current();
                DROP FUNCTION IF EXISTS unitrade.fn_set_updated_at();

                "
            );
            migrationBuilder.DropTable(name: "admin_profiles", schema: "unitrade");

            migrationBuilder.DropTable(name: "listing_images", schema: "unitrade");

            migrationBuilder.DropTable(name: "student_profiles", schema: "unitrade");

            migrationBuilder.DropTable(name: "verification_requests", schema: "unitrade");

            migrationBuilder.DropTable(name: "listings", schema: "unitrade");

            migrationBuilder.DropTable(name: "courses", schema: "unitrade");

            migrationBuilder.DropTable(name: "users", schema: "unitrade");

            migrationBuilder.DropTable(name: "universities", schema: "unitrade");
        }
    }
}
