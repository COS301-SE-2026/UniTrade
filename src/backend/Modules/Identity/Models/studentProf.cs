namespace API.Modules.Identity.Models
{
    public class StudentProf
    {
        public int Student_ID { get; set; }
        public string Student_Number { get; set; }
        public int University_ID { get; set; }
        public int Course_ID { get; set; }
        public int Year_Of_Study { get; set; }
        public string Verification_Status { get; set; }
        public decimal Reputation_Score { get; set; }
    }
}