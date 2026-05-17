namespace Modules.Notifications;


public interface INotificationsService
{
    Task SendOtpEmailAsync(string email, string otp);
}