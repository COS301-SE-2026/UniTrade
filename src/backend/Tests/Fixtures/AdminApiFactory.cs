using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Modules.ReferenceData.University;
using Testcontainers.PostgreSql;
using Xunit;

namespace Api.Tests.Fixtures;

public sealed class AdminApiFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    static AdminApiFactory() => AppContext.SetSwitch("Npgsql:EnableLegacyTimestampBehavior", true);

    private readonly PostgreSqlContainer _db = new PostgreSqlBuilder("postgres:18").Build();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        Environment.SetEnvironmentVariable(
            "Jwt__Secret",
            "86719f9defbc2ca08a533903de693a3e5895e0958c2533ff674115c64088edb5"
        );
        Environment.SetEnvironmentVariable(
            "Firebase__CredentialsJson",
            ""
        );
        Environment.SetEnvironmentVariable("PayFast__Passphrase", "verymuchexistentpassphrase");
        builder.UseEnvironment("Development");
        builder.ConfigureAppConfiguration(
            (context, config) =>
            {
                config.AddInMemoryCollection(
                    new Dictionary<string, string>
                    {
                        ["Jwt:Secret"] =
                            "86719f9defbc2ca08a533903de693a3e5895e0958c2533ff674115c64088edb5",
                        ["Firebase:CredentialsJson"] = "",
                    }
                );
            }
        );
        builder.ConfigureServices(services =>
        {
            var descriptor = services.SingleOrDefault(d =>
                d.ServiceType == typeof(DbContextOptions<AppDbContext>)
            );
            if (descriptor is not null)
                services.Remove(descriptor);

            services.AddDbContext<AppDbContext>(o =>
                o.UseNpgsql(_db.GetConnectionString()).UseSnakeCaseNamingConvention()
            );
        });
    }

    public async Task InitializeAsync()
    {
        await _db.StartAsync();
        await Task.Delay(1000);
        using var scope = Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        await context.Database.EnsureCreatedAsync();
        await context.Database.ExecuteSqlRawAsync(@"
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


            DROP TRIGGER IF EXISTS tr_audit_verification_decision ON unitrade.verification_requests;
            
            CREATE TRIGGER tr_audit_verification_decision
            AFTER
            UPDATE
            ON unitrade.verification_requests
            FOR EACH ROW EXECUTE FUNCTION unitrade.fn_audit_verification_decision();
        ");


        if (!await context.Universities.AnyAsync(u => u.UniversityId == 2))
        {
            context.Universities.Add(
                new University
                {
                    UniversityId = 2,
                    Name = "Test Uni",
                    IsActive = true,
                }
            );
            await context.SaveChangesAsync();
        }
    }

    public AppDbContext NewContext()
    {
        var scope = Services.CreateScope();
        return scope.ServiceProvider.GetRequiredService<AppDbContext>();
    }

    async Task IAsyncLifetime.DisposeAsync() => await _db.DisposeAsync();
}
