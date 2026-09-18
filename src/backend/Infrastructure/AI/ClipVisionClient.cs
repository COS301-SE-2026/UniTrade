using System.Net.Http.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Logging;
using Modules.Listings.Scoring;
using Modules.SharedKernel;

namespace Infrastructure.AI;

public sealed class ClipVisionClient : IClipVisionClient
{
    private readonly HttpClient _http;
    private readonly ILogger<ClipVisionClient> _logger;

    public ClipVisionClient(HttpClient http, ILogger<ClipVisionClient> logger)
    {
        _http = http;
        _logger = logger;
    }

    public async Task<double?> ScoreAsync(
        byte[] imageBytes,
        string claimedLabel,
        CancellationToken ct = default
    )
    {
        if (imageBytes.Length == 0)
        {
            return null;
        }

        try
        {
            var payload = new ClipScoreRequest
            {
                ImageBase64 = Convert.ToBase64String(imageBytes),
                ClaimedLabel = claimedLabel,
            };

            using var res = await _http.PostAsJsonAsync("/score", payload, ct);

            if (!res.IsSuccessStatusCode)
            {
                _logger.LogWarning(
                    "CLIP returned {Status} for label {Label}",
                    (int)res.StatusCode,
                    claimedLabel
                );
                return null;
            }

            var body = await res.Content.ReadFromJsonAsync<ClipScoreResponse>(ct);
            return body?.MatchScore;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "CLIP call failed for label {Label}", claimedLabel);
            return null;
        }
    }

    private sealed class ClipScoreRequest
    {
        [JsonPropertyName("imageBase64")]
        public string ImageBase64 { get; init; } = "";

        [JsonPropertyName("claimedLabel")]
        public string ClaimedLabel { get; init; } = "";
    }

    private sealed class ClipScoreResponse
    {
        [JsonPropertyName("matchScore")]
        public double? MatchScore { get; init; }
    }
}
