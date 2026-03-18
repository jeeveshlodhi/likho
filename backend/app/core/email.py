"""
Email service for sending transactional emails.
"""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional

from app.core.config import settings


def send_email(
    to_email: str,
    subject: str,
    html_content: str,
    text_content: Optional[str] = None,
) -> bool:
    """
    Send an email using SMTP.
    Returns True if successful, False otherwise.
    """
    if not settings.email_configured:
        # Email not configured - log and return False
        print(f"[EMAIL] Would send to {to_email}: {subject}")
        print(f"[EMAIL] HTML content length: {len(html_content)}")
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
        msg["To"] = to_email

        # Add plain text version if provided
        if text_content:
            msg.attach(MIMEText(text_content, "plain"))

        # Add HTML version
        msg.attach(MIMEText(html_content, "html"))

        # Connect to SMTP server and send
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            if settings.SMTP_TLS:
                server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_FROM_EMAIL, [to_email], msg.as_string())

        return True
    except Exception as e:
        print(f"[EMAIL] Failed to send email: {e}")
        return False


def send_password_reset_email(to_email: str, reset_link: str) -> bool:
    """
    Send password reset email to user.
    """
    subject = "Reset your Likho password"

    text_content = f"""
Hi,

You requested to reset your password for your Likho account.

Click the link below to reset your password:
{reset_link}

This link will expire in 1 hour.

If you didn't request this, you can safely ignore this email.

Thanks,
The Likho Team
"""

    html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset your Likho password</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 24px; text-align: center; background: linear-gradient(135deg, #6366f1, #8b5cf6);">
                            <div style="width: 48px; height: 48px; background-color: #ffffff; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; font-size: 24px; font-weight: bold; color: #6366f1;">
                                L
                            </div>
                        </td>
                    </tr>
                    <!-- Content -->
                    <tr>
                        <td style="padding: 32px 40px;">
                            <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: #09090b; letter-spacing: -0.02em;">
                                Reset your password
                            </h1>
                            <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #71717a;">
                                You requested to reset your password for your Likho account. Click the button below to set a new password.
                            </p>
                            <!-- Button -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="{reset_link}" 
                                           style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #ffffff; text-decoration: none; border-radius: 12px; font-size: 15px; font-weight: 600;">
                                            Reset Password
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            <p style="margin: 0 0 8px; font-size: 14px; line-height: 1.5; color: #a1a1aa;">
                                Or copy and paste this link into your browser:
                            </p>
                            <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #6366f1; word-break: break-all;">
                                {reset_link}
                            </p>
                            <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 32px 0;">
                            <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #a1a1aa;">
                                This link will expire in 1 hour. If you didn't request this, you can safely ignore this email.
                            </p>
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 24px 40px; text-align: center; background-color: #fafafa;">
                            <p style="margin: 0; font-size: 12px; color: #a1a1aa;">
                                © {__import__('datetime').datetime.now().year} Likho. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
"""

    return send_email(to_email, subject, html_content, text_content)
