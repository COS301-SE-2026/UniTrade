using Microsoft.EntityFrameworkCore;
using Modules.Identity.Models;
using Modules.Listings.Models;
using Modules.ReferenceData.University;
using Modules.ReferenceData.Course;
using System.Security.Cryptography.X509Certificates;
using System.Security.Cryptography;
using System.Dynamic;


namespace Infrastructure.Persistence;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    // Identity
    public DbSet<User> Users => Set<User>();
    public DbSet<StudentProfile> StudentProfiles => Set<StudentProfile>();
    public DbSet<AdminProfile> AdminProfiles => Set<AdminProfile>();
    public DbSet<VerificationRequest> VerificationRequests => Set<VerificationRequest>();

    public DbSet<Listing> Listings => Set<Listing>();
    public DbSet<ListingImage> ListingImages => Set<ListingImage>();

    // Reference data 
    public DbSet<University> Universities => Set<University>();
    public DbSet<Course> Courses => Set<Course>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // FOR User
        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("Users", tb => tb.HasTrigger("tr_users_updated_at"));

            entity.HasKey(x => x.UserId);
            entity.Property(x => x.UserId).HasColumnName("user_id");

            entity.Property(x => x.Role)
                .HasMaxLength(10)
                .IsRequired().HasColumnName("role");
            entity.Property(x => x.FirstName)
               .IsRequired().HasColumnName("first_name").HasMaxLength(50).IsRequired();

            entity.Property(x => x.LastName)
              .IsRequired().HasColumnName("last_name").HasMaxLength(50).IsRequired();
            entity.Property(x => x.Email)
                          .IsRequired().HasColumnName("email").HasMaxLength(255).IsRequired();

            entity.Property(x => x.PhoneNumber)
               .IsRequired().HasColumnName("phone_number").HasMaxLength(20);

            entity.Property(x => x.PasswordHash)
                .IsRequired().HasColumnName("password_hash").IsRequired();


            entity.Property(x => x.CreatedAt)
                            .HasColumnName("created_at");

            entity.Property(x => x.UpdatedAt)
                                .HasColumnName("updated_at");

            entity.HasIndex(x => x.Email)
               .IsUnique();

        });


        // FOR Student

        modelBuilder.Entity<StudentProfile>(entity =>
   {
       entity.ToTable("Student_profiles");

       entity.HasKey(x => x.StudentId);

       entity.Property(x => x.StudentId)
           .HasColumnName("student_id");

       entity.Property(x => x.StudentNumber)
           .HasColumnName("student_number")
           .HasMaxLength(50);

       entity.Property(x => x.UniversityId)
           .HasColumnName("university_id")
           .IsRequired();

       entity.Property(x => x.CourseId)
           .HasColumnName("course_id");

       entity.Property(x => x.YearOfStudy)
           .HasColumnName("year_of_study")
           .IsRequired();

       entity.Property(x => x.VerificationStatus)
           .HasColumnName("verification_status")
           .HasMaxLength(20)
           .IsRequired()
           .HasDefaultValue("pending");

       entity.Property(x => x.ReputationScore)
           .HasColumnName("reputation_score")
           .HasPrecision(4, 2)
           .HasDefaultValue(0);

       entity.HasOne(x => x.User)
           .WithOne(x => x.StudentProfile)
           .HasForeignKey<StudentProfile>(x => x.StudentId)
           .OnDelete(DeleteBehavior.Cascade);

       entity.HasOne<University>()
           .WithMany()
           .HasForeignKey(x => x.UniversityId)
           .OnDelete(DeleteBehavior.Restrict);

       entity.HasOne<Course>()
            .WithMany()
            .HasForeignKey(x => x.CourseId)
            .OnDelete(DeleteBehavior.Restrict);

   });      //ADMIN

        modelBuilder.Entity<AdminProfile>(entity =>
        {
            entity.ToTable("Admin_profiles");

            entity.Property(x => x.AdminId).HasColumnName("admin_id");

            entity.HasKey(x => x.AdminId);

            entity.Property(x => x.UniversityId).HasColumnName("university_id")
            .IsRequired();

            entity.Property(x => x.UserId).HasColumnName("user_id");

            entity.HasOne(x => x.User)
            .WithOne(x => x.AdminProfile)
            .HasForeignKey<AdminProfile>(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);

            entity.Property(x => x.UniversityId).HasColumnName("university_id");

            entity.HasOne<University>()
            .WithMany()
            .HasForeignKey(x => x.UniversityId)
            .OnDelete(DeleteBehavior.Cascade);
        });


        // University 
        modelBuilder.Entity<University>(entity =>
        {
            entity.ToTable("University");

            entity.Property(x => x.UniversityId).HasColumnName("university_id");

            entity.HasKey(x => x.UniversityId);

            entity.Property(x => x.Name).HasColumnName("name")
            .IsRequired();

            entity.Property(x => x.IsActive).HasColumnName("is_active")
           ;

            entity.Property(x => x.EmailDomain).HasColumnName("email_domain")
                .IsRequired();

            entity.HasIndex(x => x.EmailDomain)
                          .IsUnique();
        });


        // Course

        modelBuilder.Entity<Course>(entity =>
        {
            entity.ToTable("Course");

            entity.Property(x => x.CourseId).HasColumnName("course_id");
            entity.HasKey(x => x.CourseId);

            entity.Property(x => x.CourseCode).HasColumnName("course_code")
               .IsRequired();

            entity.Property(x => x.CourseName).HasColumnName("course_name")
             .IsRequired();

            entity.Property(x => x.UniversityId).HasColumnName("university_id");
            entity.HasOne<University>()
            .WithMany()
           .HasForeignKey(x => x.UniversityId)
           .OnDelete(DeleteBehavior.Cascade);
        });


        // Verification Requests
        modelBuilder.Entity<VerificationRequest>(entity =>
{
    entity.ToTable("Verification_requests", tb =>
    {
        tb.HasTrigger("tr_verification_set_current");
        tb.HasTrigger("tr_audit_verification_decision");
    });

    entity.HasKey(x => x.VerificationId);
    entity.Property(x => x.VerificationId)
          .HasColumnName("verification_id");

    entity.HasIndex(x => new { x.UserId, x.AttemptNumber })
          .IsUnique();

    entity.Property(x => x.UserId).HasColumnName("user_id");

    entity.Property(x => x.AiConfidenceScore)
          .HasColumnName("ai_confidence_score")
          .HasPrecision(4, 2);

    entity.Property(x => x.Status)
          .HasColumnName("status")
          .HasMaxLength(20)
          .HasDefaultValue("otp_pending");

    entity.Property(x => x.AiDecision)
          .HasColumnName("ai_decision")
          .HasMaxLength(20);

    entity.Property(x => x.AdminDecision)
          .HasColumnName("admin_decision")
          .HasMaxLength(20);

    entity.Property(x => x.OtpCodeHash)
          .HasColumnName("otp_code_hash")
          .HasMaxLength(255);

    entity.Property(x => x.IsCurrent).HasColumnName("is_current");
    entity.Property(x => x.AdminId).HasColumnName("admin_id");
    entity.Property(x => x.AttemptNumber).HasColumnName("attempt_number");
    entity.Property(x => x.DecidedAt).HasColumnName("decided_at");
    entity.Property(x => x.OtpExpiresAt).HasColumnName("otp_expires_at");
    entity.Property(x => x.OtpResendCount).HasColumnName("otp_resend_count");
    entity.Property(x => x.OtpSentAt).HasColumnName("otp_sent_at");
    entity.Property(x => x.OtpVerifiedAt).HasColumnName("otp_verified_at");
    entity.Property(x => x.PorFilePath).HasColumnName("por_file_path");
    entity.Property(x => x.RejectionReason).HasColumnName("rejection_reason");
    entity.Property(x => x.SubmittedAt).HasColumnName("submitted_at");


    entity.HasOne<User>()
          .WithMany()
          .HasForeignKey(x => x.UserId)
          .OnDelete(DeleteBehavior.Cascade);
});

        // Listings 

        modelBuilder.Entity<Listing>(entity =>
       {
           entity.ToTable("Listings", tb =>
           {
               tb.HasTrigger("tr_listings_updated_at");
               tb.HasTrigger("tr_audit_listing_status");

               tb.HasCheckConstraint("chk_listing_price", "price>0");

               tb.HasCheckConstraint("chk_listing_condition", "condition IN ('new', 'good', 'fair', 'poor')");
               tb.HasCheckConstraint("chk_listing_type", "listing_type IN ('book', 'laptop', 'stationery', 'electronics', 'clothing', 'furniture', 'other')");
               tb.HasCheckConstraint("chk_listing_risk", "ai_risk_level IS NULL OR ai_risk_level IN ('low', 'medium', 'high')");
               tb.HasCheckConstraint("chk_isbn_validity", "isbn IS NULL OR LEN(isbn) IN  (10,13)");
               tb.HasCheckConstraint("chk_listing_book_fields", "listing_type ='book'  OR (course_id IS NULL AND isbn IS NULL AND author IS NULL AND edition IS NULL)");


           });

           //LISTING_ID
           entity.Property(x => x.ListingId).HasColumnName("listing_id").HasDefaultValueSql("NEWSEQUENTIALID()");
           entity.HasKey(x => x.ListingId);


           entity.Property(x => x.SellerId).HasColumnName("seller_id")
              .IsRequired();

           entity.Property(x => x.Title).HasColumnName("title").HasMaxLength(150)
             .IsRequired();
           entity.Property(x => x.Description).HasColumnName("description")
          .IsRequired();
           entity.Property(x => x.Price).HasColumnName("price").HasPrecision(10, 2)
        .IsRequired();
           entity.Property(x => x.Condition).HasColumnName("condition").HasMaxLength(5)
          .IsRequired();
           entity.Property(x => x.ListingType).HasColumnName("listing_type").HasMaxLength(20)
           .IsRequired();

           // book-specific

           entity.Property(x => x.CourseId).HasColumnName("course_id");
           entity.Property(x => x.Isbn).HasColumnName("isbn").HasMaxLength(13);
           entity.Property(x => x.Author).HasColumnName("author").HasMaxLength(120);
           entity.Property(x => x.Edition).HasColumnName("edition").HasMaxLength(50);

           entity.Property(x => x.ListingStatus).HasColumnName("listing_status").HasMaxLength(20).IsRequired();

           //AI mod
           entity.Property(x => x.AiRiskScore).HasColumnName("ai_risk_score").HasPrecision(5, 2);
           entity.Property(x => x.AiRiskLevel).HasColumnName("ai_risk_level").HasMaxLength(10);
           entity.Property(x => x.VisibilityScore).HasColumnName("visibility_score").HasDefaultValue(100);

           entity.Property(x => x.RejectionReason).HasColumnName("rejection_reason");

           entity.Property(x => x.isBundle)
               .HasColumnName("is_bundle");
           entity.Property(x => x.ViewCount).HasColumnName("view_count").HasDefaultValue(0);
           entity.Property(x => x.AiRiskScore).HasColumnName("ai_risk_score");
           entity.Property(x => x.AiRiskLevel).HasColumnName("ai_risk_level");
           entity.Property(x => x.VisibilityScore).HasColumnName("visibility_score");
           entity.Property(x => x.RejectionReason).HasColumnName("rejection_reason");
           entity.Property(x => x.CreatedAt)
                          .HasColumnName("created_at")
                          .HasDefaultValueSql("SYSDATETIME()")
                          .ValueGeneratedOnAdd();

           entity.Property(x => x.UpdatedAt)
                               .HasColumnName("updated_at")
                               .HasDefaultValueSql("SYSDATETIME()")
                           .ValueGeneratedOnAddOrUpdate();

           entity.HasOne<User>()
           .WithMany()
           .HasForeignKey(x => x.SellerId)
           .OnDelete(DeleteBehavior.Restrict);

           entity.HasOne<Course>()
           .WithMany()
           .HasForeignKey(x => x.CourseId)
           .OnDelete(DeleteBehavior.Restrict);

           entity.HasIndex(x => x.SellerId)
                .HasDatabaseName("ix_listings_seller");

           entity.HasIndex(x => x.CourseId)
                           .HasDatabaseName("ix_listings_course");
           entity.HasIndex(x => new { x.ListingStatus, x.VisibilityScore })
                                      .HasDatabaseName("ix_listings_visibility").HasFilter("[listing_status] = 'live'").IsDescending(false, true);
           entity.HasIndex(x => x.CreatedAt)
               .HasDatabaseName("ix_listings_created_at").IsDescending();
           entity.HasIndex(x => new { x.ListingStatus, x.VisibilityScore, x.CreatedAt })
              .HasDatabaseName("ix_listings_feed").
              HasFilter("[listing_status] = 'live'")
              .IsDescending(false, true, true);

       });

        //Listing Images
        modelBuilder.Entity<ListingImage>(entity =>
       {
           entity.ToTable("Listing_images");

           entity.Property(x => x.ImageId).HasColumnName("image_id").ValueGeneratedOnAdd();
           entity.HasKey(x => x.ImageId);

           entity.Property(x => x.ListingId).HasColumnName("listing_id")
              .IsRequired();
           entity.Property(x => x.ImageUrl).HasColumnName("image_url")
                       .IsRequired();

           entity.Property(x => x.IsPrimary).HasColumnName("is_primary").HasDefaultValue(false)
             .IsRequired();

           entity.Property(x => x.UploadedAt)
                          .HasColumnName("uploaded_at")
                          .HasDefaultValueSql("SYSDATETIME()")
                          .ValueGeneratedOnAdd();

           entity.HasOne(x => x.Listing)
      .WithMany(x => x.Images)
      .HasForeignKey(x => x.ListingId)
      .OnDelete(DeleteBehavior.Cascade);

           entity.HasIndex(x => x.ListingId)
                    .HasDatabaseName("ix_listing_images_listing");

       });

    }
}