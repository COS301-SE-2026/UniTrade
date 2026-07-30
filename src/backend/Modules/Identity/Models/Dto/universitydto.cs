namespace Modules.Identity.Models.DTO
{
    public class University
    {
        public int University_ID { get; set; }
        public string Name { get; set; } = null!;
        public List<string> Email_domains { get; set; } = new();
        public bool Is_Active { get; set; }
    }
}
