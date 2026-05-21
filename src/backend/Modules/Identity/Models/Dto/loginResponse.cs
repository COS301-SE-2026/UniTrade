using System.Text.Json.Serialization;
namespace Modules.Identity.Models.Dto
{
    public class LoginResponse
    {
        [JsonIgnore]
        public string? Token{get;set;}
        public string Message{get;set;}=string.Empty;
        public UserDto? User{get;set;}
    }
}