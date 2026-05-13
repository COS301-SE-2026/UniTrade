using Microsoft.EntityFrameworkCore;
using Modules.Identity.Models;
using Modules.ReferenceData.University;
using Modules.ReferenceData.Course;
using System.Security.Cryptography.X509Certificates;
using System.Reflection.Metadata;

namespace Infrastructure.Persistence;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    // Identity
    public DbSet<User> Users => Set<Users>();
    public DbSet<StudentProfile> StudentProfiles => Set<StudentProfile>();
    public DbSet<AdminProfile> AdminProfiles => Set<AdminProfile>();
    public DbSet<VerificationRequest> VerificationRequests => Set<VerificationRequest>();

    // Reference data 
    public DbSet<University> Universities => Set<University>();
    public DbSet<Course> Courses => Set<Course>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // FOR User
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(x => x.UserId);

            entity.Property(x => x.Role)
                .HasMaxLength(10)
                .IsRequired();

            entity.Property(x => x.Email)
                .IsRequired();

            entity.HasIndex(x => x.Email)
               .IsUnique();

        });


        // FOR Student

        modelBuilder.Entity<StudentProfile>(entity =>
        {
            entity.HasKey(x => x.StudentId);

            entity.Property(x => x.VerificationStatus)
            .HasMaxLength(20)
            .HasDefaultValue("pending");

            entity.Property(x => x.ReputationScore)
            .HasPrecision(4, 2)
            .HasDefaultValue(0);

            entity.HasKey(x => x.StudentNumber)
            .HasMaxLength(50);

            // one profile per user
            entity.HasOne<User>()
            .withOne()
            .HasForeignKey<StudentProfile>(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);

            // many students -> one Uni
            entity.HasOne<University>()
            .withMany()
            .HasForeignKey(x => x.UniversityId)
            .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne<Course>()
            .withMany()
            .HasForeignKey(x => x.CourseId)
            .OnDelete(DeleteBehavior.Restrict);
        });


        //ADMIN
        modelBuilder.Entity<AdminProfile>(entity =>
        {
            entity.HasKey(x => x.AdminId);
            entity.withOne()
            .HasForeignKey<StudentProfile>(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne<University>()
            .withMany()
            .HasForeignKey(x => x.UniversityId)
            .OnDelete(DeleteBehavior.Cascade);
        });


        // University 
        modelBuilder.Entity<University>(entity =>
        {
            entity..HasKey(x => x.UniversityId);

            entity.Property(x => x.Name)
            .IsRequired();

            entity.Property(x => x.EmailDomain)
                .IsRequired();

            entity.Property(x => x.EmailDomain)
                          .IsUnique();
        });





        // Course

        modelBuilder.Entity<Course>()
              .HasKey(x => x.CourseId);

        modelBuilder.Entity<Course>()
               .Property(x => x.CourseCode)
               .IsRequired();

        modelBuilder.Entity<Course>()
             .Property(x => x.CourseName)
             .IsRequired();

        modelBuilder.Entity<Course>()
            .withMany()
             .HasForeignKey(x => x.UniversityId)
             .OnDelete(DeleteBehavior.Cascade);

        // Verification Requests
        modelBuilder.Entity<VerificationRequest>()
        .HasKey(x => x.VerificationId);


        modelBuilder.Entity<VerificationRequest>()
                     .HasIndex(x => new { x.UserId, x.AttemptNumber })
                     .IsUnique();

        modelBuilder.Entity<VerificationRequest>()
        .Property(x => x.Status)
        .HasMaxLength(20)
        .HasDefaultValue("otp_pending");

        modelBuilder.Entity<VerificationRequest>()
        .Property(x => x.AiDecision)
        .HasMaxLength(20);

        modelBuilder.Entity<VerificationRequest>()
        .Property(x => x.AdminDecision)
        .HasMaxLength(20);

        modelBuilder.Entity<VerificationRequest>()
       .Property(x => x.OtpCodeHash)
       .HasMaxLength(255);

        modelBuilder.Entity<VerificationRequest>()
             .withMany()
              .HasForeignKey(x => x.UserId)
              .OnDelete(DeleteBehavior.Cascade);
    }


}