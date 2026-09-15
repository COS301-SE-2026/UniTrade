namespace Modules.Identity.Models.DTO
{
    public class StudentDto
    {
        public string? VerificationStatus { get; set; }
        public string? VerificationRequestStatus { get; set; }
        public string? VerificationAdminDecision { get; set; }
        public string? VerificationRejectionReason { get; set; }
        public int YearOfStudy { get; set; }

        public string DegreeProgram { get; set; } = null!;
        public string University { get; set; } = null!;
        public decimal SellerTrustScore { get; set; }
        public decimal BuyerReliabilityScore { get; set; }
    }
}
