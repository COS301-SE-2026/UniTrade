namespace api.Modules.Identity.Models.DTO
{
    public class LoginDTO
    {
        [Required]
        public string Username { get; set; }
        [Required]  
        public string Password { get; set; }
    }
}