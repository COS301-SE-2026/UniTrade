namespace Modules.Listings.Scoring;

public interface IClipVisionClient
{
    Task<double?> ScoreAsync(
        byte[] imageBytes,
        string claimedLabel,
        CancellationToken ct = default
    );
}
