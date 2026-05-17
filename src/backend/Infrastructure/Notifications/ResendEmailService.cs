using Microsoft.Extensions.Configuration;
using Modules.Notifications;
using System.Net.Http.Headers;
using System.Net.Http.Json;

namespace Infrastructure.Notifications;

public class ResendEmailService : INotificationsService
{
    private readonly HttpClient _http;
    private readonly IConfiguration _config;
    public ResendEmailService(HttpClient http, IConfiguration config)
    {
        _http = http;
        _config = config;
    }

    public async Task SendOtpEmailAsync(string email, string otp)
    {
        var apiKey = _config["Resend:ApiKey"];

        var payload = new
        {
            from = _config["Resend:FromEmail"],
            to = email, // resend requires a registered domain to be able to send to actual 'outsider; emails
            subject = "Your UniTrade Verification Code",
            html = $"""
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
            <h2 style="color: rgb(26, 26, 26);">Verify your UniTrade account</h2>
            <p style="color: #444;">Use the code below to complete your registration. It expires in <strong>5 minutes</strong>.</p>
            
            <div style="background: #f4f4f4; border-radius: 8px; padding: 24px; text-align: center; margin: 24px 0;">
                <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: rgb(69, 47, 235);">{otp}</span>
            </div>
            
            <p style="color: #888; font-size: 13px;">If you didn't create a UniTrade account, you can safely ignore this email.</p>
        </div>
    """
        };


        _http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

        var response = await _http.PostAsJsonAsync("https://api.resend.com/emails",
        payload);

        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Content.ReadAsStringAsync();
            Console.WriteLine($"Resend error {(int)response.StatusCode}: {body}");
        }
    }

}