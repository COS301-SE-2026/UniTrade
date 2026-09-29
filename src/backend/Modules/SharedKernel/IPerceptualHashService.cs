namespace Modules.SharedKernel;

public interface IPerceptualHashService
{   //computes 65bit percep. hash from image bytes
    string? ComputeHash(byte[] imageData);
    //dist betw two hex-encode 64-bit hashes. lower=more similar
    int HammingDistance(string hashA, string hashB);
}
