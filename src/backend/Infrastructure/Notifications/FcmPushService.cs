using FirebaseAdmin.Messaging;
using Microsoft.Extensions.Logging;
using Modules.Notifications;
using Modules.Notifications.Repositories;

namespace Infrastructure.Notifications;

public class FcmPushService : IFcmPushService
{
    private readonly IDeviceTokenRepository _tokens;
    private readonly ILogger<FcmPushService> _logger;

    public FcmPushService(IDeviceTokenRepository tokens, ILogger<FcmPushService> logger)
    {
        _tokens = tokens;
        _logger = logger;
    }

    public async Task<bool> SendAsync(
        Guid userId,
        string title,
        string body,
        CancellationToken ct = default
    )
    {
        var tokenList = await _tokens.GetTokensForUserAsync(userId, ct);

        if (tokenList.Count == 0)
        {
            return false;
        }
        if (_logger.IsEnabled(LogLevel.Information))
        {
            _logger.LogInformation(
                "FCM SENT: user={UserId}, tokenCount={Count}",
                userId,
                tokenList.Count
            );
        }

        var fcmMessages = tokenList
            .Select(token => new Message
            {
                Token = token,
                Notification = new FirebaseAdmin.Messaging.Notification
                {
                    Title = title,
                    Body = body,
                },
                Apns = new ApnsConfig
                {
                    Aps = new Aps { Badge = 1 }, // for the pws
                },
            })
            .ToList();

        var response = await FirebaseMessaging.DefaultInstance.SendEachAsync(fcmMessages, ct);

        if (response.FailureCount > 0)
        {
            var deadTokens = response
                .Responses.Zip(tokenList)
                .Where(x =>
                    !x.First.IsSuccess
                    && x.First.Exception?.MessagingErrorCode
                        is MessagingErrorCode.Unregistered
                            or MessagingErrorCode.InvalidArgument
                )
                .Select(x => x.Second)
                .ToList();

            if (deadTokens.Count > 0)
            {
                await _tokens.DeleteAsync(deadTokens, ct);
            }
        }
        return response.SuccessCount > 0;
    }

    public async Task RegisterTokenAsync(
        Guid userId,
        string token,
        string platform,
        CancellationToken ct = default
    ) => await _tokens.UpsertAsync(userId, token, platform, ct);
}
