using Azure;
using Azure.Communication.Email;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Modules.Notifications;

namespace Infrastructure.Notifications;

public sealed class NotificationException(string code) : Exception(code) { }

public class AcsEmailService : IEmailService
{
    private readonly EmailClient _emailClient;
    private readonly ILogger<AcsEmailService> _logger;
    private readonly string _senderAddress;

    public AcsEmailService(
        EmailClient emailClient,
        IConfiguration config,
        ILogger<AcsEmailService> logger
    )
    {
        _emailClient = emailClient;
        _logger = logger;
        _senderAddress =
            config["Acs:SenderAddress"]
            ?? throw new InvalidOperationException("Acs:SenderAddress is not configured");
    }

    public async Task SendOtpEmailAsync(string email, string otp)
    {
        var subject = "Your UniTrade Verification Code";
        var html = $"""
                <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
                    <h2 style="color: rgb(26, 26, 26);">Verify your UniTrade account</h2>
                    <p style="color: #444;">Use the code below to complete your registration. It expires in <strong>5 minutes</strong>.</p>
                    
                    <div style="background: #f4f4f4; border-radius: 8px; padding: 24px; text-align: center; margin: 24px 0;">
                        <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: rgb(69, 47, 235);">{otp}</span>
                    </div>
                    
                    <p style="color: #888; font-size: 13px;">If you didn't create a UniTrade account, you can safely ignore this email.</p>
                </div>
            """;
        await SendAsync(email, subject, html);
    }

    public async Task SendWelcomeEmailAsync(string toEmail, string firstName)
    {
        var html = WelcomeHtml(firstName);
        await SendAsync(toEmail, "Welcome to UniTrade!", html);
    }

    private async Task SendAsync(string recipient, string subject, string html)
    {
        try
        {
            EmailSendOperation operation = await _emailClient.SendAsync(
                wait: WaitUntil.Completed,
                senderAddress: _senderAddress,
                recipientAddress: recipient,
                subject: subject,
                htmlContent: html
            );

            if (operation.Value.Status != EmailSendStatus.Succeeded)
            {
                _logger.LogError(
                    "Email to {Recipient} ended in a non-success status {Status}",
                    recipient,
                    operation.Value.Status
                );
                throw new NotificationException("email_send_failed");
            }
        }
        catch (RequestFailedException ex)
        {
            _logger.LogError(ex, "Email to {Recipient} failed to send", recipient);
            throw new NotificationException("email_send_failed");
        }
    }

    // will have to ask the front end team to align it to the palette
    private static string WelcomeHtml(string firstName) =>
        $"""
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8"/>
              <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
            </head>
            <body style="margin:0;padding:0;background:#f0f4f8;font-family:'Segoe UI',Arial,sans-serif;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:40px 0;">
                <tr>
                  <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
                      
                      <tr>
                        <td style="background:#0f2d6b;padding:36px 40px;text-align:center;">
                          <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:-0.5px;">UniTrade</h1>
                          <p style="margin:6px 0 0;color:#93b4e8;font-size:14px;">Your university marketplace</p>
                        </td>
                      </tr>

                      <tr>
                        <td style="padding:40px;">
                          <h2 style="margin:0 0 16px;color:#0f2d6b;font-size:22px;">Welcome, {firstName}!</h2>
                          <p style="margin:0 0 16px;color:#4a5568;font-size:15px;line-height:1.6;">
                            Your account has been verified and you're all set. You can now buy and sell textbooks, 
                            notes, and more with students at your university.
                          </p>

                          <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
                            <tr><td style="border-top:1px solid #e2e8f0;"></td></tr>
                          </table>

                          <!-- steps -->
                          <p style="margin:0 0 16px;color:#0f2d6b;font-size:15px;font-weight:600;">Get started in 3 steps:</p>
                          
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="padding:10px 0;">
                                <table cellpadding="0" cellspacing="0">
                                  <tr>
                                    <td style="background:#1a56db;color:#fff;border-radius:50%;width:28px;height:28px;text-align:center;font-size:13px;font-weight:700;vertical-align:middle;">1</td>
                                    <td style="padding-left:12px;color:#4a5568;font-size:14px;">Browse listings from students at your university</td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:10px 0;">
                                <table cellpadding="0" cellspacing="0">
                                  <tr>
                                    <td style="background:#1a56db;color:#fff;border-radius:50%;width:28px;height:28px;text-align:center;font-size:13px;font-weight:700;vertical-align:middle;">2</td>
                                    <td style="padding-left:12px;color:#4a5568;font-size:14px;">Post your first listing — textbooks, notes, or items</td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:10px 0;">
                                <table cellpadding="0" cellspacing="0">
                                  <tr>
                                    <td style="background:#1a56db;color:#fff;border-radius:50%;width:28px;height:28px;text-align:center;font-size:13px;font-weight:700;vertical-align:middle;">3</td>
                                    <td style="padding-left:12px;color:#4a5568;font-size:14px;">Connect with buyers and sellers on campus</td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>

                          <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:32px;">
                            <tr>
                              <td align="center">
                                <a href="https://UniTrade.co.za" 
                                   style="display:inline-block;background:#1a56db;color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:15px;font-weight:600;letter-spacing:0.2px;">
                                  Go to UniTrade
                                </a>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>

                      <tr>
                        <td style="background:#f7f9fc;border-top:1px solid #5095f0;padding:20px 40px;text-align:center;">
                          <p style="margin:0;color:#a0aec0;font-size:12px;">
                            You're receiving this because you created a UniTrade account.<br/>
                            © 2025 UniTrade. All rights reserved.
                          </p>
                        </td>
                      </tr>

                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
            """;

    public async Task SendVerificationDecisionEmailAsync(
        string toEmail,
        string firstName,
        string decision,
        string? reason = null
    )
    {
        var (subject, bodyMessage) = decision switch
        {
            "approved" => (
                "Your UniTrade verification was approved",
                "<p>Great news, your student verification has been approved. You can now reserve and publish listings on UniTrade.</p>"
            ),
            "rejected" => (
                "Your UniTrade verification was not approved",
                $"<p>Unfortunately, your student verification was not approved.</p>{(string.IsNullOrWhiteSpace(reason) ? "" : $"<p><strong>Reason:</strong> {reason}</p>")}"
            ),
            "resubmission" => (
                "Action needed: resubmit your UniTrade verification",
                $"<p>We need you to resubmit your proof of registration to complete verification.</p>{(string.IsNullOrWhiteSpace(reason) ? "" : $"<p><strong>Reason:</strong> {reason}</p>")}"
            ),
            _ => (
                "Your UniTrade verification status was updated",
                "<p>Your verification status has changed.</p>"
            ),
        };

        var html = $"""
                      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
                          <h2 style="color: rgb(26,26,26);">Hi {firstName},</h2>
                          {bodyMessage}
                          </div>
            """;
        await SendAsync(toEmail, subject, html);
    }

    public async Task SendSavedSearchMatchEmailAsync(string email, string title, decimal price)
    {
        var subject = "New listing matches your saved search";
        var html =
            $@"
      <div style='font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;'>
      <h2 style='color: #0f2d6b;'>New match for your search!</h2>
      <p>A listing you might be interested in has just been posted;</p>
      <div style='background: #f4f4f4; border-radius: 8px; padding: 16px; margin: 16px 0;'>
      <strong>{title}</strong><br/>
      <span style='color: #0f2d6b; font-weight: bold;'>R{price:F2}</span>
      </div>
      <p style='color: #888; font-size: 13px;'>You received this because you saved a search on UniTrade.</p>
      </div>
      ";
        await SendAsync(email, subject, html);
    }
}
