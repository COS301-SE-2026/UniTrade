namespace Modules.Identity.Models
{
    public class StudentProf
    {
        public Guid StudentId { get; set; }
        public Guid UserId { get; set; }
        public string? StudentNumber { get; set; }
        public int University_ID { get; set; }
        public int Course_ID { get; set; }
        public int Year_Of_Study { get; set; }
        public string Verification_Status { get; set; }="pending",
        public decimal Reputation_Score { get; set; }
    }
}