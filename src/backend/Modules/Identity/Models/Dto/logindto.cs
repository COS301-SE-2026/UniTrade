using System.ComponentModel.DataAnnotations;

namespace Modules.Identity.Models.DTO
{
    public class LoginDto
    {
        [Required]
        public string? Email { get; set; }

        [Required]
        public string? Password { get; set; }
    }
}
