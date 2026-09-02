using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking.Internal;
using Modules.Audit.Models;
using Modules.Chat.Models;
using Modules.Disputes.Models;
using Modules.Identity.Models;
using Modules.ListingQuestions.Models;
using Modules.Listings.Models;
using Modules.Notifications.Models;
using Modules.ReferenceData.Course;
using Modules.ReferenceData.University;
using Modules.Reputation.Models;
using Modules.Reservations.Models;
using Modules.Reviews.Models;
using Modules.SavedSearches.Models;
using Modules.SharedKernel;
using Modules.Transactions.Models;
using Modules.Wishlist.Models;

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
    public DbSet<ProofOfRegistrationDocument> ProofOfRegistrationDocuments =>
        Set<ProofOfRegistrationDocument>();
    public DbSet<Strike> Strikes => Set<Strike>();

    ///add listing model after resolving conflicts
    // Listings
    public DbSet<Listing> Listings => Set<Listing>();
    public DbSet<ListingCategory> ListingCategories => Set<ListingCategory>();
    public DbSet<BookDetails> BookDetails => Set<BookDetails>();
    public DbSet<ListingImage> ListingImages => Set<ListingImage>();
    public DbSet<ListingSnapshot> ListingSnapshot => Set<ListingSnapshot>();

    // Reference data
    public DbSet<University> Universities => Set<University>();
    public DbSet<UniversityEmailDomain> UniversityEmailDomains => Set<UniversityEmailDomain>();
    public DbSet<Course> Courses => Set<Course>();

    // Reservations and chat messages
    public DbSet<Reservation> Reservations => Set<Reservation>();
    public DbSet<ReservationListing> ReservationListings => Set<ReservationListing>();
    public DbSet<ChatMessage> ChatMessages => Set<ChatMessage>();

    // Notifications
    public DbSet<Notification> Notifications => Set<Notification>();

    // Wishlist
    public DbSet<WishlistItem> WishlistItems => Set<WishlistItem>();

    //Transactions
    public DbSet<Transaction> Transactions => Set<Transaction>();

    // Meetups
    public DbSet<Meetup> Meetups => Set<Meetup>();

    // Reviews
    public DbSet<Review> Reviews => Set<Review>();

    // Device Tokens
    public DbSet<DeviceToken> DeviceTokens => Set<DeviceToken>();

    // Audits
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    // Disputes
    public DbSet<Dispute> Disputes => Set<Dispute>();

    // Images
    public DbSet<Image> Images => Set<Image>();

    // Saved Searches
    public DbSet<SavedSearch> SavedSearches => Set<SavedSearch>();

    // Listing Questions

    public DbSet<ListingQuestion> ListingQuestions => Set<ListingQuestion>();
    //constants - sonarqube
    private readonly string _nowString = "now()";

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.HasDefaultSchema("unitrade");

        // FOR User
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasQueryFilter(u => !u.IsDeleted); // note in phase 3, for admin purposes
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
            entity.Property(x => x.TermsAcceptedAt);

            entity.ToTable(t =>
            {
                t.HasCheckConstraint("chk_user_role", "role IN ('student', 'admin')");
            });

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
            entity.Property(x => x.DegreeProgram).HasMaxLength(100).IsRequired();

            entity
                .Property(x => x.VerificationStatus)
                .HasMaxLength(20)
                .IsRequired()
                .HasDefaultValue("pending");

            entity.Property(x => x.SellerTrustScore).HasPrecision(4, 2).HasDefaultValue(0);
            entity.Property(x => x.BuyerReliabilityScore).HasPrecision(4, 2).HasDefaultValue(0);

            entity.ToTable(t =>
            {
                t.HasCheckConstraint("chk_student_year", "year_of_study BETWEEN 1 AND 8");
                t.HasCheckConstraint(
                    "chk_student_verification",
                    "verification_status IN ('pending', 'partial', 'verified', 'rejected')"
                );
            });

            entity
                .HasOne(x => x.User)
                .WithOne(x => x.StudentProfile)
                .HasForeignKey<StudentProfile>(x => x.StudentId)
                .OnDelete(DeleteBehavior.Cascade);

            entity
                .HasOne(s => s.University)
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
        });

        // University email domains
        modelBuilder.Entity<UniversityEmailDomain>(entity =>
        {
            entity.HasKey(x => x.DomainId);

            entity.Property(x => x.DomainId).ValueGeneratedOnAdd();

            entity.Property(x => x.EmailDomain).IsRequired();
            entity.HasIndex(x => x.EmailDomain).IsUnique();
            entity.Property(x => x.IsActive).HasDefaultValue(true);

            entity
                .HasOne(x => x.University)
                .WithMany(u => u.EmailDomains)
                .HasForeignKey(x => x.UniversityId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Course

        modelBuilder.Entity<Course>(entity =>
        {
            entity.HasKey(x => x.CourseId);

            entity.Property(x => x.CourseCode).IsRequired();

            entity.Property(x => x.CourseName).IsRequired();

            entity.Property(x => x.Faculty).IsRequired();

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
                tb.HasTrigger("tr_audit_verification_decision");

                // NOTE: When we implement the AI Verification subsystem, add the missing constraints
                tb.HasCheckConstraint(
                    "chk_vr_status",
                    "status IN ('otp_pending', 'por_pending','under_review','approved', 'rejected')"
                );
            });

            entity.HasKey(x => x.VerificationId);

            entity.Property(x => x.UserId);

            entity.Property(x => x.AiConfidenceScore).HasPrecision(5, 2);

            entity.Property(x => x.Status).HasMaxLength(20).HasDefaultValue("otp_pending");

            entity.Property(x => x.AiDecision).HasMaxLength(20);

            entity.Property(x => x.AdminDecision).HasMaxLength(20);

            entity.Property(x => x.OtpCodeHash).HasMaxLength(255);

            entity.Property(x => x.AttemptNumber).HasDefaultValue(0);
            entity.Property(x => x.TotalAttemptCount).HasDefaultValue(0);
            entity.Property(x => x.LastAttemptAt);
            entity.Property(x => x.OtpResendCount).HasDefaultValue(0);

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

        //Proof of registration documents
        modelBuilder.Entity<ProofOfRegistrationDocument>(entity =>
        {
            entity.Property(x => x.DocumentId).ValueGeneratedOnAdd();
            entity.HasKey(x => x.DocumentId);

            entity.Property(x => x.VerificationId).IsRequired();

            entity.Property(x => x.FileData).HasColumnType("bytea").IsRequired();
            entity.Property(x => x.ContentType).HasMaxLength(100).IsRequired();
            entity.Property(x => x.FileSize).IsRequired();
            entity.Property(x => x.FileName).HasMaxLength(255).IsRequired();

            entity.Property(x => x.UploadedAt).HasDefaultValueSql(_nowString).ValueGeneratedOnAdd();

            entity
                .HasOne<VerificationRequest>()
                .WithOne()
                .HasForeignKey<ProofOfRegistrationDocument>(x => x.VerificationId)
                .OnDelete(DeleteBehavior.Cascade);

            entity
                .HasIndex(x => x.VerificationId)
                .HasDatabaseName("uix_por_verification")
                .IsUnique();
        });

        // Listings

        modelBuilder.Entity<Listing>(entity =>
        {
            entity.ToTable(tb =>
            {
                tb.HasTrigger("tr_listings_updated_at");

                tb.HasCheckConstraint("chk_listing_price", "price > 0");

                tb.HasCheckConstraint(
                    "chk_listing_condition",
                    "condition IN ('new', 'good', 'fair', 'poor')"
                );
                tb.HasCheckConstraint(
                    "chk_listing_risk",
                    "ai_risk_level IS NULL OR ai_risk_level IN ('low', 'medium', 'high')"
                );
                tb.HasCheckConstraint(
                    "chk_listing_status",
                    "listing_status IN ('draft', 'pending', 'live', 'reserved', 'low_visibility', 'rejected', 'sold', 'removed')"
                );
            });

            //LISTING_ID
            entity.Property(x => x.ListingId).HasDefaultValueSql("gen_random_uuid()");
            entity.HasKey(x => x.ListingId);

            entity.Property(x => x.SellerId).IsRequired();
            entity.Property(x => x.CategoryId).IsRequired();

            entity.Property(x => x.Title).HasMaxLength(150).IsRequired();
            entity.Property(x => x.Description).IsRequired();
            entity.Property(x => x.Price).HasPrecision(10, 2).IsRequired();
            entity.Property(x => x.Condition).HasMaxLength(5).IsRequired();

            // book-specific
            // course id is only ever meant to be used by the book category, but due to latency of serial joins.., it's best of it stays here
            // since at its core unitrade is a textbook market place, a lot of queries around this
            entity.Property(x => x.CourseId);

            entity.Property(x => x.ListingStatus).HasMaxLength(20).IsRequired();

            //categorizing listings
            entity.Property(x => x.CategoryId).IsRequired();

            entity.Property(x => x.Metadata).HasColumnType("jsonb");

            //AI mod
            entity.Property(x => x.AiRiskScore).HasPrecision(5, 2);
            entity.Property(x => x.AiRiskLevel).HasMaxLength(10);
            entity.Property(x => x.VisibilityScore).HasDefaultValue(100);

            entity.Property(x => x.RejectionReason);

            entity.Property(x => x.IsBundle).HasDefaultValue(false);
            entity.Property(x => x.ViewCount).HasDefaultValue(0);
            entity.Property(x => x.CreatedAt).HasDefaultValueSql(_nowString).ValueGeneratedOnAdd();

            entity
                .Property(x => x.UpdatedAt)
                .HasDefaultValueSql(_nowString)
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

            //listing category update
            entity
                .HasOne(x => x.Category)
                .WithMany(c => c.Listings)
                .HasForeignKey(x => x.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);

            entity
                .HasOne(x => x.BookDetails)
                .WithOne(b => b.Listing)
                .HasForeignKey<BookDetails>(b => b.ListingId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(x => x.SellerId).HasDatabaseName("ix_listings_seller");

            entity.HasIndex(x => x.CourseId).HasDatabaseName("ix_listings_course");
            entity.HasIndex(x => x.CategoryId).HasDatabaseName("ix_listings_category");

            entity
                .HasIndex(x => new
                {
                    x.CourseId,
                    x.ListingStatus,
                    x.CreatedAt,
                })
                .HasDatabaseName("ix_listings_course_browse")
                .HasFilter("listing_status = 'live'")
                .IsDescending(false, true, true)
                .IncludeProperties(x => new
                {
                    x.Title,
                    x.Price,
                    x.SellerId,
                    x.CategoryId,
                });
            entity
                .HasIndex(x => new
                {
                    x.CategoryId,
                    x.ListingStatus,
                    x.CreatedAt,
                })
                .HasDatabaseName("ix_listings_category_browse")
                .HasFilter("listing_status = 'live'")
                .IsDescending(false, false, true)
                .IncludeProperties(x => new
                {
                    x.Title,
                    x.Price,
                    x.SellerId,
                });

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

        modelBuilder.Entity<ListingCategory>(entity =>
        {
            entity.HasKey(x => x.CategoryId);

            entity.Property(x => x.Name).HasMaxLength(50).IsRequired();
            entity.HasIndex(x => x.Name).IsUnique();

            entity.Property(x => x.IsActive).HasDefaultValue(true).IsRequired();

            entity.HasData(
                new ListingCategory
                {
                    CategoryId = 1,
                    Name = "book",
                    IsActive = true,
                },
                new ListingCategory
                {
                    CategoryId = 2,
                    Name = "electronics",
                    IsActive = true,
                },
                new ListingCategory
                {
                    CategoryId = 3,
                    Name = "stationery",
                    IsActive = true,
                },
                new ListingCategory
                {
                    CategoryId = 4,
                    Name = "furniture",
                    IsActive = true,
                },
                new ListingCategory
                {
                    CategoryId = 5,
                    Name = "clothing",
                    IsActive = true,
                },
                new ListingCategory
                {
                    CategoryId = 6,
                    Name = "other",
                    IsActive = true,
                }
            );
        });

        modelBuilder.Entity<BookDetails>(entity =>
        {
            entity.HasKey(x => x.ListingId);
            entity.Property(x => x.ListingId).ValueGeneratedNever();

            entity.Property(x => x.Isbn).HasMaxLength(13);
            entity.Property(x => x.Author).HasMaxLength(120);
            entity.Property(x => x.Edition).HasMaxLength(50);

            entity.ToTable(t =>
            {
                t.HasCheckConstraint(
                    "chk_isbn_validity",
                    "isbn IS NULL OR length(isbn) IN  (10,13)"
                );
            });
        });

        //Listing Images
        modelBuilder.Entity<ListingImage>(entity =>
        {
            entity.Property(x => x.ImageId).ValueGeneratedOnAdd();
            entity.HasKey(x => x.ImageId);

            entity.Property(x => x.ListingId).IsRequired();

            entity.Property(x => x.ImageData).HasColumnType("bytea").IsRequired();
            entity.Property(x => x.ContentType).HasMaxLength(100).IsRequired();
            entity.Property(x => x.FileSize).IsRequired();

            entity.Property(x => x.IsPrimary).HasDefaultValue(false).IsRequired();

            entity.Property(x => x.UploadedAt).HasDefaultValueSql(_nowString).ValueGeneratedOnAdd();

            entity
                .HasOne(x => x.Listing)
                .WithMany(x => x.Images)
                .HasForeignKey(x => x.ListingId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(x => x.ListingId).HasDatabaseName("ix_listing_images_listing");
        });

        // Reservations
        modelBuilder.Entity<Reservation>(entity =>
        {
            entity.HasKey(x => x.ReservationId);
            entity.Property(x => x.ReservationId).HasDefaultValueSql("gen_random_uuid()");

            entity.Property(x => x.BuyerId).IsRequired();
            entity.Property(x => x.SellerId).IsRequired();

            entity.Property(x => x.IsBundle).HasDefaultValue(false).IsRequired();
            entity.Property(x => x.ReservationStatus).HasMaxLength(20).IsRequired();

            entity.Property(x => x.SellerAcknowledgedAt);
            entity.Property(x => x.BuyerRespondedAt);
            entity.Property(x => x.HandoverConfirmedAt);
            entity.Property(x => x.CompletedAt);
            entity.Property(x => x.ExpiresAt).IsRequired();
            entity.Property(x => x.CreatedAt).HasDefaultValueSql(_nowString).ValueGeneratedOnAdd();
            entity.Property(x => x.TwoHourWarningSentAt);

            entity.ToTable(t =>
            {
                t.HasCheckConstraint(
                    "chk_res_status",
                    "reservation_status IN ('active', 'expired', 'cancelled', 'completed')"
                );
            });

            entity
                .HasOne<User>(x => x.Buyer)
                .WithMany()
                .HasForeignKey(x => x.BuyerId)
                .OnDelete(DeleteBehavior.Restrict);

            entity
                .HasOne<User>(x => x.Seller)
                .WithMany()
                .HasForeignKey(x => x.SellerId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(x => x.BuyerId).HasDatabaseName("ix_res_buyer");
            entity.HasIndex(x => x.SellerId).HasDatabaseName("ix_res_seller");
            entity.HasIndex(x => x.ReservationStatus).HasDatabaseName("ix_res_status");

            entity
                .HasIndex(x => x.ExpiresAt)
                .HasDatabaseName("ix_res_expires")
                .HasFilter("reservation_status = 'active' AND meetup_confirmed_at IS NULL");
        });

        modelBuilder.Entity<ReservationListing>(entity =>
        {
            entity
                .HasKey(x => new { x.ReservationId, x.ListingId })
                .HasName("pk_reservation_listings");

            entity
                .HasOne(x => x.Reservation)
                .WithMany(r => r.ReservationListings)
                .HasForeignKey(x => x.ReservationId)
                .OnDelete(DeleteBehavior.Cascade);

            entity
                .HasOne(x => x.Listing)
                .WithMany()
                .HasForeignKey(x => x.ListingId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Chat messages
        modelBuilder.Entity<ChatMessage>(entity =>
        {
            entity.HasKey(x => x.MessageId);
            entity.Property(x => x.MessageId).ValueGeneratedOnAdd();

            entity.Property(x => x.ReservationId).IsRequired();
            entity.Property(x => x.SenderId);

            entity
                .Property(x => x.MessageType)
                .HasMaxLength(20)
                .IsRequired()
                .HasDefaultValue("text");

            entity.Property(x => x.ClientKey).HasMaxLength(64);
            entity.Property(x => x.Content).IsRequired();
            entity.Property(x => x.Payload).HasColumnType("jsonb");
            entity.Property(x => x.SentAt).HasDefaultValueSql(_nowString).ValueGeneratedOnAdd();
            entity.Property(x => x.ReadAt);

            entity.ToTable(t =>
            {
                t.HasCheckConstraint(
                    "chk_message_type",
                    "message_type IN ('text', 'system', 'meetup_proposal',  'meetup_response')"
                );

                t.HasCheckConstraint(
                    "chk_system_sender",
                    "(message_type = 'system' AND sender_id IS NULL) OR (message_type <> 'system' AND sender_id IS NOT NULL)"
                );

                t.HasCheckConstraint(
                    "chk_payload_type",
                    "(message_type IN ('meetup_proposal', 'meetup_response') AND payload IS NOT NULL ) OR( message_type IN ('text', 'system')  AND payload IS NULL )"
                );
            });

            entity
                .HasOne<User>(x => x.Sender)
                .WithMany()
                .HasForeignKey(x => x.SenderId)
                .OnDelete(DeleteBehavior.Restrict);

            entity
                .HasOne<Reservation>(x => x.Reservation)
                .WithMany(r => r.Messages)
                .HasForeignKey(x => x.ReservationId)
                .OnDelete(DeleteBehavior.Cascade);

            entity
                .HasIndex(x => new { x.ReservationId, x.SentAt })
                .HasDatabaseName("ix_chat_reservation");
            entity
                .HasIndex(x => new { x.ReservationId, x.ReadAt })
                .HasDatabaseName("ix_chat_unread")
                .HasFilter("read_at IS NULL");

            entity
                .HasIndex(x => new { x.ReservationId, x.ClientKey })
                .HasDatabaseName("uix_chat_client_key")
                .IsUnique()
                .HasFilter("client_key IS NOT NULL");
        });

        // Notification
        modelBuilder.Entity<Notification>(entity =>
        {
            entity.HasKey(x => x.NotificationId);
            entity.Property(x => x.NotificationId).ValueGeneratedOnAdd();

            entity.Property(x => x.UserId).IsRequired();
            entity.Property(x => x.Type).HasMaxLength(30).IsRequired();
            entity.Property(x => x.Message).IsRequired();

            entity.Property(x => x.IsRead).HasDefaultValue(false).IsRequired();

            entity.Property(x => x.CreatedAt).HasDefaultValueSql(_nowString).ValueGeneratedOnAdd();

            entity.ToTable(t =>
            {
                t.HasCheckConstraint(
                    "chk_notif_type",
                    "type IN ('listing_status', 'reservation_status', 'meetup_reminder',  'chat', 'dispute', 'verification')"
                );
            });

            entity
                .HasOne<User>()
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity
                .HasIndex(x => new { x.UserId, x.IsRead })
                .HasDatabaseName("ix_notif_user_unread")
                .HasFilter("is_read = false");
        });

        // Wishlist items
        modelBuilder.Entity<WishlistItem>(entity =>
        {
            entity.HasKey(x => x.WishlistId);
            entity.Property(x => x.WishlistId);

            entity.Property(x => x.StudentId).IsRequired();
            entity.Property(x => x.ListingId).IsRequired();

            entity.Property(x => x.AddedAt).HasDefaultValueSql("now()").ValueGeneratedOnAdd();

            entity
                .HasOne(x => x.Student)
                .WithMany()
                .HasForeignKey(x => x.StudentId)
                .OnDelete(DeleteBehavior.Cascade);

            entity
                .HasOne(x => x.Listing)
                .WithMany()
                .HasForeignKey(x => x.ListingId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(x => x.StudentId).HasDatabaseName("ix_wishlist_student");
            entity
                .HasIndex(x => new { x.StudentId, x.ListingId })
                .IsUnique()
                .HasDatabaseName("wishlist_entry");
        });

        modelBuilder.Entity<Transaction>(entity =>
        {
            entity.HasKey(x => x.TransactionId);
            entity.Property(x => x.ReservationId).IsRequired();
            entity.Property(x => x.BuyerId).IsRequired();
            entity.Property(x => x.SellerId).IsRequired();
            entity.Property(x => x.Amount).HasPrecision(10, 2).IsRequired();
            entity
                .Property(x => x.TransactionStatus)
                .HasMaxLength(20)
                .IsRequired()
                .HasDefaultValue("pending");
            entity.Property(x => x.PaidAt);
            entity.Property(x => x.PinHash).HasMaxLength(255);
            entity.Property(x => x.PinAttempts).HasDefaultValue(0);
            entity
                .Property(x => x.PinStatus)
                .HasMaxLength(255)
                .IsRequired()
                .HasDefaultValue("pending");
            entity.Property(x => x.CreatedAt).HasDefaultValueSql(_nowString).ValueGeneratedOnAdd();

            entity.HasIndex(x => x.ReservationId).HasDatabaseName("ix_transactions_reservation");

            entity.HasOne<Reservation>().WithMany().HasForeignKey(x => x.ReservationId);
        });
        // Meetups
        modelBuilder.Entity<Meetup>(entity =>
        {
            entity.HasKey(x => x.MeetupId);
            entity.Property(x => x.MeetupId).ValueGeneratedOnAdd();

            entity.Property(x => x.ReservationId).IsRequired();

            entity.Property(x => x.AgreedLocationName).HasMaxLength(150).IsRequired();
            entity.Property(x => x.AgreedLatitude).HasPrecision(9, 6).IsRequired();
            entity.Property(x => x.AgreedLongitude).HasPrecision(9, 6).IsRequired();
            entity.Property(x => x.AgreedTime).IsRequired();
            entity.Property(x => x.CreatedAt).HasDefaultValueSql(_nowString).ValueGeneratedOnAdd();

            entity.Property(x => x.BuyerCheckedIn).HasDefaultValue(false).IsRequired();
            entity.Property(x => x.BuyerCheckedInAt);
            entity.Property(x => x.BuyerCheckinLatitude).HasPrecision(9, 6);
            entity.Property(x => x.BuyerCheckinLongitude).HasPrecision(9, 6);

            entity.Property(x => x.SellerCheckedIn).HasDefaultValue(false).IsRequired();
            entity.Property(x => x.SellerCheckedInAt);
            entity.Property(x => x.SellerCheckinLatitude).HasPrecision(9, 6);
            entity.Property(x => x.SellerCheckinLongitude).HasPrecision(9, 6);

            entity.Property(x => x.CheckinWindowClosesAt).IsRequired();

            entity.Property(x => x.Status).HasMaxLength(20).IsRequired();

            entity.ToTable(t =>
            {
                t.HasCheckConstraint(
                    "chk_meetup_status",
                    "status IN ('scheduled', 'completed', 'no_show_buyer', 'no_show_seller')"
                );
            });

            entity
                .HasOne(x => x.Reservation)
                .WithMany(r => r.Meetups)
                .HasForeignKey(x => x.ReservationId)
                .OnDelete(DeleteBehavior.Cascade);

            entity
                .HasIndex(x => x.ReservationId)
                .HasDatabaseName("ix_meetup_reservation")
                .IsUnique();
        });

        // Reviews
        modelBuilder.Entity<Review>(entity =>
        {
            entity.HasKey(x => x.ReviewId);
            entity.Property(x => x.ReviewId).ValueGeneratedOnAdd();

            entity.Property(x => x.TransactionId).IsRequired();
            entity.Property(x => x.ReviewerId).IsRequired();
            entity.Property(x => x.RevieweeId).IsRequired();

            entity.Property(x => x.Rating).IsRequired();
            entity.Property(x => x.Comment);

            entity.Property(x => x.ReviewType).IsRequired().HasMaxLength(20);

            entity.Property(x => x.CreatedAt).HasDefaultValueSql(_nowString).ValueGeneratedOnAdd();

            entity.ToTable(t =>
            {
                t.HasTrigger("tr_reputation_on_review");
                t.HasCheckConstraint("chk_rating", "rating BETWEEN 1 AND 5");
                t.HasCheckConstraint("chk_review_self", "reviewer_id <> reviewee_id");
                t.HasCheckConstraint(
                    "chk_review_type",
                    "review_type IN ('buyer_to_seller', 'seller_to_buyer')"
                );
            });
            entity
                .HasIndex(x => new { x.TransactionId, x.ReviewerId })
                .IsUnique()
                .HasDatabaseName("review_per_transaction");

            entity.HasIndex(x => x.RevieweeId).HasDatabaseName("ix_review_reviewee");

            entity
                .HasOne(x => x.Transaction)
                .WithMany()
                .HasForeignKey(x => x.TransactionId)
                .OnDelete(DeleteBehavior.Restrict);
        });
        // Device tokens

        modelBuilder.Entity<DeviceToken>(entity =>
        {
            entity.HasKey(x => x.DeviceTokenId);
            entity
                .Property(x => x.DeviceTokenId)
                .HasDefaultValueSql("gen_random_uuid()")
                .ValueGeneratedOnAdd();

            entity.Property(x => x.Token).HasMaxLength(512).IsRequired();
            entity.Property(x => x.Platform).HasMaxLength(10).IsRequired();
            entity.Property(x => x.CreatedAt).HasDefaultValueSql(_nowString);
            entity.Property(x => x.LastSeenAt).HasDefaultValueSql(_nowString);

            entity
                .HasOne(x => x.User)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.ToTable(t =>
            {
                t.HasCheckConstraint(
                    "chk_device_platform",
                    "platform IN ('web', 'android', 'ios')"
                );
            });
            entity.HasIndex(x => x.Token).IsUnique();
            entity.HasIndex(x => x.UserId).HasDatabaseName("ix_device_tokens_user");
        });

        //listing snapshot
        modelBuilder.Entity<ListingSnapshot>(entity =>
        {
            entity.HasKey(x => x.SnapshotId);
            entity.Property(x => x.SnapshotId).ValueGeneratedNever();
            entity.Property(x => x.ReservationId).IsRequired(false);
            entity.Property(x => x.ListingId).IsRequired();
            entity.Property(x => x.Title).HasMaxLength(150).IsRequired();
            entity.Property(x => x.Price).HasPrecision(10, 2).IsRequired();
            entity.Property(x => x.Condition).HasMaxLength(5).IsRequired();
            entity.Property(x => x.PhotoRefs).HasColumnType("text[]");
            entity.Property(x => x.CourseTags).HasColumnType("text[]");
            entity.Property(x => x.CapturedAt).HasDefaultValueSql(_nowString).ValueGeneratedOnAdd();
            entity.Property(x => x.Description);

            entity.ToTable(t =>
            {
                t.HasCheckConstraint("chk_listing_snapshot_price", "price > 0");
            });
            entity
                .HasOne(x => x.Reservation)
                .WithOne(r => r.ListingSnapshot)
                .HasForeignKey<ListingSnapshot>(x => x.ReservationId)
                .OnDelete(DeleteBehavior.Cascade);

            entity
                .HasOne(x => x.Listing)
                .WithMany()
                .HasForeignKey(x => x.ListingId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(x => x.ListingId).HasDatabaseName("ix_listing_snapshots_listing_id");
        });
        // Audit logs

        modelBuilder.Entity<AuditLog>(entity =>
        {
            entity.HasKey(x => x.LogId);
            entity.Property(x => x.LogId).ValueGeneratedOnAdd();

            entity.Property(x => x.Action).HasMaxLength(100).IsRequired();
            entity.Property(x => x.EntityType).HasMaxLength(50).IsRequired();
            entity.Property(x => x.EntityId).HasMaxLength(100).IsRequired();
            entity.Property(x => x.OldValue);
            entity.Property(x => x.NewValue);
            entity.Property(x => x.Reason);
            entity.Property(x => x.CreatedAt).HasDefaultValueSql(_nowString).ValueGeneratedOnAdd();

            entity
                .HasIndex(x => new { x.EntityType, x.EntityId })
                .HasDatabaseName("ix_audit_entity");
            entity.HasIndex(x => x.ActorId).HasDatabaseName("ix_audit_actor");
            entity.HasIndex(x => x.CreatedAt).HasDatabaseName("ix_audit_created").IsDescending();
        });

        modelBuilder.Entity<Strike>(entity =>
        {
            entity.HasKey(x => x.StrikeId);
            entity.Property(x => x.StrikeId).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(x => x.SourceCaseId).IsRequired(false);
            entity.Property(x => x.Type).HasMaxLength(50).IsRequired();
            entity.Property(x => x.UserId).IsRequired();
            entity.Property(x => x.Reason).HasMaxLength(255).IsRequired();
            entity.Property(x => x.CreatedByAdminId).IsRequired();
            entity.Property(x => x.CreatedAt).HasDefaultValueSql(_nowString).ValueGeneratedOnAdd();

            //relationships
            entity
                .HasOne<User>()
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity
                .HasOne<User>()
                .WithMany()
                .HasForeignKey(x => x.CreatedByAdminId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(x => x.UserId).HasDatabaseName("ix_strikes_user");
            entity.HasIndex(x => x.SourceCaseId).HasDatabaseName("ix_strikes_source_case");
            entity.HasIndex(x => x.CreatedByAdminId).HasDatabaseName("ix_strikes_created_by_admin");
        });
        //Disputes

        modelBuilder.Entity<Dispute>(entity =>
        {
            entity.HasKey(x => x.DisputeId);
            entity.Property(x => x.DisputeId).HasDefaultValueSql("gen_random_uuid()");

            entity.Property(x => x.Type).HasMaxLength(30).IsRequired();
            entity.Property(x => x.Status).HasMaxLength(20).IsRequired().HasDefaultValue("open");

            entity.Property(x => x.SubjectUserId).IsRequired();
            entity.Property(x => x.RaisedBy);

            entity.Property(x => x.SellerRefusedPhotos).HasDefaultValue(false);
            entity.Property(x => x.Photos).HasColumnType("text[]");
            entity.Property(x => x.Description);

            entity
                .Property(x => x.SubmittedAt)
                .HasDefaultValueSql(_nowString)
                .ValueGeneratedOnAdd();

            entity.Property(x => x.Resolution);
            entity.Property(x => x.ResolvedAt);

            entity.ToTable(t =>
            {
                t.HasCheckConstraint(
                    "chk_dispute_type",
                    "type IN ('listing_quality','report_listing','no_show')"
                );
                t.HasCheckConstraint(
                    "chk_dispute_status",
                    "status IN ('open','under_review','resolved','closed')"
                );
            });

            entity
                .HasOne<User>()
                .WithMany()
                .HasForeignKey(x => x.SubjectUserId)
                .OnDelete(DeleteBehavior.Restrict);
            entity
                .HasOne<User>()
                .WithMany()
                .HasForeignKey(x => x.RaisedBy)
                .OnDelete(DeleteBehavior.Restrict);
            entity
                .HasOne<Reservation>()
                .WithMany()
                .HasForeignKey(x => x.ReservationId)
                .OnDelete(DeleteBehavior.Restrict);
            entity
                .HasOne<Listing>()
                .WithMany()
                .HasForeignKey(x => x.ListingId)
                .OnDelete(DeleteBehavior.Restrict);
            entity
                .HasOne<Meetup>()
                .WithMany()
                .HasForeignKey(x => x.MeetupId)
                .OnDelete(DeleteBehavior.Restrict);
            entity
                .HasOne<User>()
                .WithMany()
                .HasForeignKey(x => x.AssignedAdminId)
                .OnDelete(DeleteBehavior.Restrict);
            entity
                .HasOne(x => x.Snapshot)
                .WithMany()
                .HasForeignKey(x => x.SnapshotId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(x => x.Status).HasDatabaseName("ix_disputes_status");
            entity.HasIndex(x => x.Type).HasDatabaseName("ix_disputes_type");
            entity.HasIndex(x => x.SubjectUserId).HasDatabaseName("ix_disputes_subject");
            entity
                .HasIndex(x => x.SubmittedAt)
                .HasDatabaseName("ix_disputes_submitted")
                .IsDescending();
        });
        // IMages

        modelBuilder.Entity<Image>(entity =>
        {
            entity.Property(x => x.ImageId).ValueGeneratedOnAdd();
            entity.HasKey(x => x.ImageId);

            entity.Property(x => x.ImageData).HasColumnType("bytea").IsRequired();
            entity.Property(x => x.ContentType).HasMaxLength(100).IsRequired();
            entity.Property(x => x.FileSize).IsRequired();

            entity.Property(x => x.UploadedAt).HasDefaultValueSql(_nowString).ValueGeneratedOnAdd();
        });

        //Saved Searches

        modelBuilder.Entity<SavedSearch>(entity =>
        {
            entity.Property(x => x.SearchId).HasDefaultValueSql("gen_random_uuid()");
            entity.HasKey(x => x.SearchId);
            entity.Property(x => x.Query).HasMaxLength(500).IsRequired();
            entity.HasIndex(x => x.BuyerId);
        });

        // listing questions
        modelBuilder.Entity<ListingQuestion>(entity =>
        {
            entity.Property(x => x.QuestionId).HasDefaultValueSql("gen_random_uuid()");
            entity.HasKey(x => x.QuestionId);
            entity.Property(x => x.QuestionText).HasMaxLength(1000).IsRequired();
            entity.Property(x => x.AnswerText).HasMaxLength(2000);
            entity.HasIndex(x => x.ListingId);
        });
    }
}
