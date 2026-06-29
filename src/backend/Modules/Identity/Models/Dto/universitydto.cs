namespace Modules.Identity.Models.DTO
{
    public class University
    {
        public int University_ID { get; set; }
        public string Name { get; set; } = null!;
        public string Email_domain { get; set; } = null!;
        public bool Is_Active { get; set; } 
    }
}