namespace Modules.Identity.Models.DTO
{
    public class University
    {
        public Guid University_ID{ get; set;}
        public string Name{get; set;}
        public string Email_domain { get; set;}
        public bool Is_Active{ get; set;}
    }
}