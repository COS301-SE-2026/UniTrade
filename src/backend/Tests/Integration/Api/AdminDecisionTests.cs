using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;
using Api.Tests.Fixtures;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Modules.Identity.Models;
using Xunit;

[Trait("Category", "Integration")]
public sealed class AdminDecisionTests : IClassFixture<AdminApiFactory>
{
    private readonly AdminApiFactory _factory;

    public AdminDecisionTests(AdminApiFactory factory) => _factory = factory;

    private HttpClient NewClient() =>
        _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = true });

    private async Task<HttpClient> AdminClientAsync()
    {
        var client = NewClient();
        var email = $"admin-{Guid.NewGuid():N}@example.com";
        const string password = "Admin123!";

        await using var db = _factory.NewContext();
        var adminUser = new User
        {
            UserId = Guid.NewGuid(),
            FirstName = "Admin",
            LastName = "User",
            Email = email,
            PhoneNumber = "",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
            Role = "admin",
        };
        db.Users.Add(adminUser);
        await db.SaveChangesAsync();
        var login = await client.PostAsJsonAsync("/api/auth/login", new { email, password });
        login.EnsureSuccessStatusCode();

        return client;
    }

    //QR-07C Decision notifies the subject, Notification dispatched on each decision
    [Fact]
    public async Task AdminDecision_CreatesNotificationForSubject()
    {
        var admin = await AdminClientAsync();

        var (userId, verificationId) = await SeedPendingVerificationAsync();

        var res = await admin.PostAsJsonAsync(
            $"/api/admin/cases/{verificationId}/decision",
            new { decision = "approve", reason = "looks valid" }
        );
        res.EnsureSuccessStatusCode();

        await using var db = _factory.NewContext();
        var notification = await db.Notifications.FirstOrDefaultAsync(n =>
            n.UserId == userId && n.Type == "verification"
        );

        Assert.NotNull(notification);
        Assert.Contains(
            "approved",
            notification.Message,
            StringComparison.InvariantCultureIgnoreCase
        );
    }

   
      private async Task<(Guid userId, Guid verificationId)> SeedPendingVerificationAsync(
        DateTime? submittedAt = null
    )
    {
        await using var db = _factory.NewContext();
        var userId = Guid.NewGuid();
        db.Users.Add(
            new Modules.Identity.Models.User
            {
                UserId = userId,
                FirstName = "Pending",
                LastName = "Applicant",
                Email = $"pending-{userId:N}@up.ac.za",
                PhoneNumber = "",
                PasswordHash = "x",
                Role = "student",
            }
        );
        db.StudentProfiles.Add(
            new StudentProfile
            {
                StudentId = userId,
                UniversityId = 2,
                YearOfStudy = 2,
                DegreeProgram = "BSc Computer Science",
                VerificationStatus = "partial",
            }
        );
        var verificationId = Guid.NewGuid();
        db.VerificationRequests.Add(
            new VerificationRequest
            {
                VerificationId = verificationId,
                UserId = userId,
                IsCurrent = true,
                Status = "por_pending",
                AdminDecision = null,
                OtpExpiresAt = DateTime.UtcNow.AddMinutes(5),
                SubmittedAt = submittedAt ?? DateTime.UtcNow,
            }
        );
        await db.SaveChangesAsync();
        return (userId, verificationId);
    }


    private record CaseRow(Guid CaseId, string Type, string Status, DateTime SubmittedAt);
}
