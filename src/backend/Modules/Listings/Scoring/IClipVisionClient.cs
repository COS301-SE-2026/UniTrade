namespace Modules.Listings.Scoring;

public sealed record ClipScoreResult(double MatchScore, string? TopLabel, double? TopLabelScore);

public interface IClipVisionClient
{
    Task<ClipScoreResult?> ScoreAsync(
        byte[] imageBytes,
        string claimedLabel,
        CancellationToken ct = default
    );
}
