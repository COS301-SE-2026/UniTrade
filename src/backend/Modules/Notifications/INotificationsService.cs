namespace Modules.Notifications;


public interface INotificationsService
{
    Task SendOtpEmailSync(string email, string otp);
}