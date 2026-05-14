namespace API.Modules.Identity.Models.DTO
{
    public class LoginResponse
    {
        public string Token{get;set;}
        public string Message{get;set;}
        public UserDto User{get;set;}
    }
}