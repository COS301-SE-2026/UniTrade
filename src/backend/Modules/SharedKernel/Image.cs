namespace Modules.SharedKernel;

public class Image
{
    public int ImageId { get; set; }
    public byte[] ImageData { get; set; } = null!;
    public string ContentType { get; set; } = null!;
    public int FileSize { get; set; }
    public DateTime UploadedAt { get; set; }
}
