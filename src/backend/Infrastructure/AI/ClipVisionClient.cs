using System.Net.Http.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Logging;
using Modules.Listings.Scoring;

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

    public async Task<ClipScoreResult?> ScoreAsync(
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
            if (body is null || body.MatchScore is not double score)
            {
                _logger.LogWarning(
                    "CLIP gave no score for label {Label}: {Error}",
                    claimedLabel,
                    body?.Error
                );
                return null;
            }
            return new ClipScoreResult(score, body.TopLabel, body.TopLabelScore);
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

        [JsonPropertyName("topLabel")]
        public string? TopLabel { get; init; }

        [JsonPropertyName("topLabelScore")]
        public double? TopLabelScore { get; init; }

        [JsonPropertyName("error")]
        public string? Error { get; init; }
    }

    public async Task<float[]?> EmbedAsync(byte[] imageBytes, CancellationToken ct = default)
    {
        if (imageBytes.Length == 0)
            return null;

        try
        {
            var payload = new { imageBase64 = Convert.ToBase64String(imageBytes) };
            using var res = await _http.PostAsJsonAsync("/embed", payload, ct);

            if (!res.IsSuccessStatusCode)
            {
                _logger.LogWarning("CLIP /embed returned {Status}", (int)res.StatusCode);
                return null;
            }

            var body = await res.Content.ReadFromJsonAsync<EmbedResponse>(ct);
            if (body?.Embedding is null || body.Embedding.Length == 0)
            {
                _logger.LogWarning("CLIP /embed gave no vector: {Error}", body?.Error);
                return null;
            }

            return body.Embedding;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "CLIP /embed call failed");
            return null;
        }
    }

    private sealed class EmbedResponse
    {
        [JsonPropertyName("embedding")]
        public float[]? Embedding { get; init; }

        [JsonPropertyName("error")]
        public string? Error { get; init; }
    }
}
