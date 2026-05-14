namespace API.Modules.Identity.Models.DTO
{
    public class LoginResponse
    {
        [JsonIgnore]
        public string? Token{get;set;}
        public string Message{get;set;}=string.Empty;
        public UserDto? User{get;set;}
    }
}