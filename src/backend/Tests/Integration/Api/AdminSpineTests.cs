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
public sealed class AdminTests : IClassFixture<AdminApiFactory>
{
    private readonly AdminApiFactory _factory;

    public AdminTests(AdminApiFactory factory) => _factory = factory;

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

    // QR-03a admin endpoints reject non-admin, anonymous, allow admin only
    [Fact]
    public async Task AdminPing_admin_200_student_403_anon_401()
    {
        var anony = NewClient();
        var anonyRes = await anony.GetAsync("/api/admin/ping");
        Assert.Equal(HttpStatusCode.Unauthorized, anonyRes.StatusCode);

        var studentClient = await StudentClientAsync();
        var studentRes = await studentClient.GetAsync("/api/admin/ping");
        Assert.Equal(HttpStatusCode.Forbidden, studentRes.StatusCode);

        var admin = await AdminClientAsync();
        var adminRes = await admin.GetAsync("/api/admin/ping");
        Assert.Equal(HttpStatusCode.OK, adminRes.StatusCode);
    }

    //QR-07b a decision writes exactly one audit row +timestamp+reason.
    [Fact]
    public async Task VerificationDecision_writes_one_audit_row_with_all_fields()
    {
        var admin = await AdminClientAsync();

        var (userId, verificationId) = await SeedPendingVerificationAsync();

        var res = await admin.PostAsJsonAsync(
            $"/api/admin/cases/{verificationId}/decision",
            new { decision = "approve", reason = "looks valid" }
        );
        res.EnsureSuccessStatusCode();

        await using var db = _factory.NewContext();
        var rows = await db
            .AuditLogs.Where(a =>
                a.EntityId == verificationId.ToString() && a.Action == "verification_decision"
            )
            .ToListAsync();

        var row = Assert.Single(rows);
        Assert.NotNull(row.ActorId);
        Assert.NotEqual(default, row.CreatedAt);
        Assert.False(string.IsNullOrWhiteSpace(row.Reason));

        var profile = db.StudentProfiles.Single(p => p.StudentId == userId);
        Assert.Equal("verified", profile.VerificationStatus);
    }

    // QR-07a the queue comes back oldest-first.
    [Fact]
    public async Task Cases_queue_is_oldest_first()
    {
        var admin = await AdminClientAsync();

        var older = await SeedPendingVerificationAsync(submittedAt: DateTime.UtcNow.AddHours(-3));
        var newer = await SeedPendingVerificationAsync(submittedAt: DateTime.UtcNow.AddHours(-1));

        var res = await admin.GetAsync("/api/admin/cases?type=verification");
        res.EnsureSuccessStatusCode();
        var cases = await res.Content.ReadFromJsonAsync<List<CaseRow>>();

        var idxOlder = cases!.FindIndex(c => c.CaseId == older.verificationId);
        var idxNewer = cases.FindIndex(c => c.CaseId == newer.verificationId);

        Assert.True(idxOlder >= 0 && idxNewer >= 0);
        Assert.True(idxOlder < idxNewer, "older case must appear before newer");
    }

    private async Task<HttpClient> StudentClientAsync()
    {
        const string password = "Tafadzwa123!";
        var email = $"student-id{Guid.NewGuid():N}@up.ac.za";
        await using (var db = _factory.NewContext())
        {
            var user = new User
            {
                UserId = Guid.NewGuid(),
                FirstName = "Test",
                LastName = "Student",
                Email = email,
                PhoneNumber = "",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
                Role = "student",
            };
            db.Users.Add(user);
            db.StudentProfiles.Add(
                new StudentProfile
                {
                    StudentId = user.UserId,
                    UniversityId = 2,
                    YearOfStudy = 2,
                    DegreeProgram = "BSc Computer Science",
                    VerificationStatus = "verified",
                }
            );
            await db.SaveChangesAsync();
        }
        var client = NewClient();
        var login = await client.PostAsJsonAsync("/api/auth/login", new { email, password });
        login.EnsureSuccessStatusCode();
        return client;
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

    private record Creds(string Email, string Password);

    private record CaseRow(Guid CaseId, string Type, string Status, DateTime SubmittedAt);
}
