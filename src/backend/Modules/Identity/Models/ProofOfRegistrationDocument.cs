namespace Modules.Identity.Models;

public class ProofOfRegistrationDocument
{
    public int DocumentId { get; set; }
    public Guid VerificationId { get; set; }
    public byte[] FileData { get; set; } = default!;
    public string ContentType { get; set; } = default!;
    public int FileSize { get; set; }
    public string FileName { get; set; } = default!;
    public DateTime UploadedAt { get; set; }
}
