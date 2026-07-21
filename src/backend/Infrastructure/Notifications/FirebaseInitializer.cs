using FirebaseAdmin;
using Google.Apis.Auth.OAuth2;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Notifications;

public static class FirebaseInitializer
{
    public static void Initialize(IConfiguration config, IHostEnvironment env, ILogger logger)
    {
        if (FirebaseApp.DefaultInstance is not null)
        {
            return;
        }
        var json = config["Firebase:CredentialsJson"];

        if (string.IsNullOrWhiteSpace(json))
        {
            if (env.IsDevelopment())
            {
                logger.LogWarning(
                    "Firebase:Credentials not set, push notification disabled locally"
                );
                return;
            }

            throw new InvalidOperationException(
                "Firebase::CredentialsJson is required in prod"
            );
        }
        FirebaseApp.Create(new AppOptions { Credential = GoogleCredential.FromJson(json) });
        logger.LogInformation("Firebase initialisation success.");
    }
}
