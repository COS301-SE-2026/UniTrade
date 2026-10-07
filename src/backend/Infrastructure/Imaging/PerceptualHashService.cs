using System.Numerics;
using Modules.SharedKernel;
using SixLabors.ImageSharp.Formats;
using SixLabors.ImageSharp.PixelFormats;
using SixLabors.ImageSharp.Processing;
using SixLaborsImage = SixLabors.ImageSharp.Image;

namespace Infrastructure.Imaging;

public class PerceptualHash : IPerceptualHashService
{
    private const int _width = 9;
    private const int _height = 8;

    //security addition
    private static readonly HashSet<string> _allowedFormatNames = new(StringComparer.OrdinalIgnoreCase)
    {
        "JPEG",
        "PNG",
        "WEBP",
    };

    public string? ComputeHash(byte[] imageData)
    {
        try
        {
            IImageFormat format;
            try
            {
                format = SixLaborsImage.DetectFormat(imageData);
            }
            catch (SixLabors.ImageSharp.UnknownImageFormatException)
            {
                return null;
            }
            if (!_allowedFormatNames.Contains(format.Name))
            {
                return null;
            }
            using var image = SixLaborsImage.Load<L8>(imageData);
            image.Mutate(ctx => ctx.Resize(_width, _height));

            ulong hash = 0;
            int bitIndex = 0;

            for (int y = 0; y < _height; y++)
            {
                for (int x = 0; x < _width - 1; x++)
                {
                    var left = image[x, y].PackedValue;
                    var right = image[x + 1, y].PackedValue;
                    if (left > right)
                    {
                        hash |= 1UL << bitIndex;
                    }
                    bitIndex++;
                }
            }
            return hash.ToString("x16");
        }
        catch (Exception)
        {
            return null;
        }
    }

    public int HammingDistance(string hashA, string hashB)
    {
        var a = Convert.ToUInt64(hashA, 16);
        var b = Convert.ToUInt64(hashB, 16);
        return BitOperations.PopCount(a ^ b);
    }
}
