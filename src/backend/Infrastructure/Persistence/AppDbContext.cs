using Microsoft.EntityFrameworkCore;
using Modules.Identity.Models;
using Modules.Listings.Models;
using Modules.ReferenceData.Course;
using Modules.ReferenceData.University;

namespace Infrastructure.Persistence;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options) { }

    // Identity
    public DbSet<User> Users => Set<User>();
    public DbSet<StudentProfile> StudentProfiles => Set<StudentProfile>();
    public DbSet<AdminProfile> AdminProfiles => Set<AdminProfile>();
    public DbSet<VerificationRequest> VerificationRequests => Set<VerificationRequest>();

    ///add listing model after resolving conflicts
    // Listings
    public DbSet<Listing> Listings => Set<Listing>();
    public DbSet<ListingImage> ListingImages => Set<ListingImage>();

    // Reference data
    public DbSet<University> Universities => Set<University>();
    public DbSet<Course> Courses => Set<Course>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.HasDefaultSchema("unitrade");

        // FOR User
        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable(tb => tb.HasTrigger("tr_users_updated_at"));

            entity.HasKey(x => x.UserId);

            entity.Property(x => x.Role).HasMaxLength(10).IsRequired();
            entity.Property(x => x.FirstName).HasMaxLength(50).IsRequired();
            entity.Property(x => x.LastName).HasMaxLength(50).IsRequired();
            entity.Property(x => x.Email).HasMaxLength(255).IsRequired();
            entity.Property(x => x.PhoneNumber).HasMaxLength(20);
            entity.Property(x => x.PasswordHash).IsRequired();

            entity.Property(x => x.CreatedAt);
            entity.Property(x => x.UpdatedAt);

            entity.HasCheckConstraint("chk_user_role", "role IN ('student', 'admin')");

            entity.HasIndex(x => x.Email).IsUnique();
            entity.HasIndex(x => x.Role).HasDatabaseName("ix_users_role");
        });

        // FOR StudentProfile

        modelBuilder.Entity<StudentProfile>(entity =>
        {
            entity.HasKey(x => x.StudentId);

            entity.Property(x => x.StudentNumber).HasMaxLength(50);

            entity.Property(x => x.UniversityId).IsRequired();

            entity.Property(x => x.CourseId);

            entity.Property(x => x.YearOfStudy).IsRequired();

            entity
                .Property(x => x.VerificationStatus)
                .HasMaxLength(20)
                .IsRequired()
                .HasDefaultValue("pending");

            entity.Property(x => x.ReputationScore).HasPrecision(4, 2).HasDefaultValue(0);

            entity.HasCheckConstraint("chk_student_year", "year_of_study BETWEEN 1 AND 8");
            entity.HasCheckConstraint(
                "chk_student_verification",
                "verification_status IN ('pending', 'partial', 'verified', 'rejected')"
            );

            entity
                .HasOne(x => x.User)
                .WithOne(x => x.StudentProfile)
                .HasForeignKey<StudentProfile>(x => x.StudentId)
                .OnDelete(DeleteBehavior.Cascade);

            entity
                .HasOne<University>()
                .WithMany()
                .HasForeignKey(x => x.UniversityId)
                .OnDelete(DeleteBehavior.Restrict);

            entity
                .HasOne<Course>()
                .WithMany()
                .HasForeignKey(x => x.CourseId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(x => x.UniversityId).HasDatabaseName("ix_student_university");
            entity.HasIndex(x => x.CourseId).HasDatabaseName("ix_student_course");
            entity.HasIndex(x => x.VerificationStatus).HasDatabaseName("ix_student_status");
        });

        //ADMIN

        modelBuilder.Entity<AdminProfile>(entity =>
        {
            entity.HasKey(x => x.AdminId);

            entity.Property(x => x.UniversityId).IsRequired();

            entity.Property(x => x.UserId);

            entity
                .HasOne(x => x.User)
                .WithOne(x => x.AdminProfile)
                .HasForeignKey<AdminProfile>(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity
                .HasOne<University>()
                .WithMany()
                .HasForeignKey(x => x.UniversityId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // University
        modelBuilder.Entity<University>(entity =>
        {
            entity.HasKey(x => x.UniversityId);

            entity.Property(x => x.Name).IsRequired();

            entity.Property(x => x.IsActive).HasDefaultValue(true);

            entity.Property(x => x.EmailDomain).IsRequired();

            entity.HasIndex(x => x.EmailDomain).IsUnique();
        });

        // Course

        modelBuilder.Entity<Course>(entity =>
        {
            entity.HasKey(x => x.CourseId);

            entity.Property(x => x.CourseCode).IsRequired();

            entity.Property(x => x.CourseName).IsRequired();

            entity
                .HasOne<University>()
                .WithMany()
                .HasForeignKey(x => x.UniversityId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(x => x.CourseCode).IsUnique();
        });

        // Verification Requests
        modelBuilder.Entity<VerificationRequest>(entity =>
        {
            entity.ToTable(tb =>
            {
                tb.HasTrigger("tr_verification_set_current");
                // tb.HasTrigger("tr_audit_verification_decision");

                // NOTE: When we implement the AI Verification subsystem, add the missing constraints
                tb.HasCheckConstraint(
                    "chk_vr_status",
                    "status IN ('otp_pending', 'por_pending','under_review','approved', 'rejected')"
                );
            });

            entity.HasKey(x => x.VerificationId);

            entity.HasIndex(x => new { x.UserId, x.AttemptNumber }).IsUnique();

            entity.Property(x => x.UserId);

            entity.Property(x => x.AiConfidenceScore).HasPrecision(5, 2);

            entity.Property(x => x.Status).HasMaxLength(20).HasDefaultValue("otp_pending");

            entity.Property(x => x.AiDecision).HasMaxLength(20);

            entity.Property(x => x.AdminDecision).HasMaxLength(20);

            entity.Property(x => x.OtpCodeHash).HasMaxLength(255);

            entity
                .HasOne<User>()
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(x => x.UserId).HasDatabaseName("ix_vr_user");
            entity.HasIndex(x => x.Status).HasDatabaseName("ix_vr_status");

            entity
                .HasIndex(x => x.UserId)
                .HasDatabaseName("uix_vr_current")
                .IsUnique()
                .HasFilter("is_current = true");
        });

        // Listings

        modelBuilder.Entity<Listing>(entity =>
        {
            entity.ToTable(tb =>
            {
                tb.HasTrigger("tr_listings_updated_at");
                //tb.HasTrigger("tr_audit_listing_status");

                tb.HasCheckConstraint("chk_listing_price", "price > 0");

                tb.HasCheckConstraint(
                    "chk_listing_condition",
                    "condition IN ('new', 'good', 'fair', 'poor')"
                );
                tb.HasCheckConstraint(
                    "chk_listing_type",
                    "listing_type IN ('book', 'laptop', 'stationery', 'electronics', 'clothing', 'furniture', 'other')"
                );
                tb.HasCheckConstraint(
                    "chk_listing_risk",
                    "ai_risk_level IS NULL OR ai_risk_level IN ('low', 'medium', 'high')"
                );
                tb.HasCheckConstraint(
                    "chk_isbn_validity",
                    "isbn IS NULL OR length(isbn) IN  (10,13)"
                );
                tb.HasCheckConstraint(
                    "chk_listing_book_fields",
                    "listing_type ='book'  OR (course_id IS NULL AND isbn IS NULL AND author IS NULL AND edition IS NULL)"
                );
            });

            //LISTING_ID
            entity.Property(x => x.ListingId).HasDefaultValueSql("gen_random_uuid()");
            entity.HasKey(x => x.ListingId);

            entity.Property(x => x.SellerId).IsRequired();

            entity.Property(x => x.Title).HasMaxLength(150).IsRequired();
            entity.Property(x => x.Description).IsRequired();
            entity.Property(x => x.Price).HasPrecision(10, 2).IsRequired();
            entity.Property(x => x.Condition).HasMaxLength(5).IsRequired();
            entity.Property(x => x.ListingType).HasMaxLength(20).IsRequired();

            // book-specific

            entity.Property(x => x.CourseId);
            entity.Property(x => x.Isbn).HasMaxLength(13);
            entity.Property(x => x.Author).HasMaxLength(120);
            entity.Property(x => x.Edition).HasMaxLength(50);

            entity.Property(x => x.ListingStatus).HasMaxLength(20).IsRequired();

            //AI mod
            entity.Property(x => x.AiRiskScore).HasPrecision(5, 2);
            entity.Property(x => x.AiRiskLevel).HasMaxLength(10);
            entity.Property(x => x.VisibilityScore).HasDefaultValue(100);

            entity.Property(x => x.RejectionReason);

            entity.Property(x => x.isBundle).HasDefaultValue(false);
            entity.Property(x => x.ViewCount).HasDefaultValue(0);
            entity.Property(x => x.CreatedAt).HasDefaultValueSql("now()").ValueGeneratedOnAdd();

            entity
                .Property(x => x.UpdatedAt)
                .HasDefaultValueSql("now()")
                .ValueGeneratedOnAddOrUpdate();

            entity
                .HasOne<User>()
                .WithMany()
                .HasForeignKey(x => x.SellerId)
                .OnDelete(DeleteBehavior.Restrict);

            entity
                .HasOne<Course>()
                .WithMany()
                .HasForeignKey(x => x.CourseId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(x => x.SellerId).HasDatabaseName("ix_listings_seller");

            entity.HasIndex(x => x.CourseId).HasDatabaseName("ix_listings_course");
            entity
                .HasIndex(x => new { x.ListingStatus, x.VisibilityScore })
                .HasDatabaseName("ix_listings_visibility")
                .HasFilter("listing_status = 'live'")
                .IsDescending(false, true);
            entity
                .HasIndex(x => x.CreatedAt)
                .HasDatabaseName("ix_listings_created_at")
                .IsDescending();
            entity
                .HasIndex(x => new
                {
                    x.ListingStatus,
                    x.VisibilityScore,
                    x.CreatedAt,
                })
                .HasDatabaseName("ix_listings_feed")
                .HasFilter("listing_status = 'live'")
                .IsDescending(false, true, true);
        });

        //Listing Images
        modelBuilder.Entity<ListingImage>(entity =>
        {
            entity.Property(x => x.ImageId).ValueGeneratedOnAdd();
            entity.HasKey(x => x.ImageId);

            entity.Property(x => x.ListingId).IsRequired();

            entity.Property(x => x.ImageData).hasColumnType("bytea").IsRequired();
            entity.Property(x => x.ContentType).HasMaxLength(100).IsRequired();
            entity.Property(x => x.FileSize).IsRequired();

            entity.Property(x => x.IsPrimary).HasDefaultValue(false).IsRequired();

            entity.Property(x => x.UploadedAt).HasDefaultValueSql("now()").ValueGeneratedOnAdd();

            entity
                .HasOne(x => x.Listing)
                .WithMany(x => x.Images)
                .HasForeignKey(x => x.ListingId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(x => x.ListingId).HasDatabaseName("ix_listing_images_listing");
        });
    }
}
