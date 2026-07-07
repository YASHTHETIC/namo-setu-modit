from __future__ import annotations

import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Any

from backend.app.core.config import get_settings

logger = logging.getLogger(__name__)

EMAIL_TEMPLATE_WRAPPER = """<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:20px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
<tr><td style="background:linear-gradient(135deg,#D4621B,#C4883A);padding:30px;text-align:center;">
<h1 style="color:#fff;margin:0;font-size:24px;">{title}</h1>
</td></tr>
<tr><td style="padding:30px;color:#333;font-size:15px;line-height:1.6;">
{body}
</td></tr>
<tr><td style="background:#f8f8f8;padding:20px 30px;text-align:center;color:#999;font-size:12px;">
<p style="margin:0;">This is an automated message from {app_name}. Do not reply to this email.</p>
</td></tr>
</table>
</td></tr></table>
</body></html>"""


class EmailService:
    def __init__(self) -> None:
        self._settings = get_settings()

    def _get_smtp_config(self) -> dict[str, Any] | None:
        host = getattr(self._settings, "smtp_host", None)
        port = getattr(self._settings, "smtp_port", 587)
        user = getattr(self._settings, "smtp_user", None)
        password = getattr(self._settings, "smtp_password", None)
        if not host or not user:
            return None
        return {"host": host, "port": port, "user": user, "password": password}

    def _wrap_html(self, title: str, body_html: str) -> str:
        return EMAIL_TEMPLATE_WRAPPER.format(
            title=title,
            body=body_html,
            app_name=self._settings.app_name,
        )

    async def send_email(
        self,
        to: str,
        subject: str,
        body: str,
        *,
        html: bool = False,
        template_key: str | None = None,
        context: dict[str, Any] | None = None,
    ) -> bool:
        from_email = getattr(self._settings, "smtp_from_email", "noreply@example.com")
        smtp_config = self._get_smtp_config()

        if smtp_config is None:
            logger.info("SMTP not configured, logging email: to=%s subject=%s", to, subject)
            return True

        msg = MIMEMultipart("alternative")
        msg["From"] = from_email
        msg["To"] = to
        msg["Subject"] = subject

        if html:
            msg.attach(MIMEText(body, "html", "utf-8"))
        else:
            msg.attach(MIMEText(body, "plain", "utf-8"))

        try:
            with smtplib.SMTP(smtp_config["host"], smtp_config["port"]) as server:
                server.starttls()
                server.login(smtp_config["user"], smtp_config["password"])
                server.sendmail(from_email, [to], msg.as_string())
            logger.info("Email sent to=%s subject=%s", to, subject)
            return True
        except Exception as exc:
            logger.error("Failed to send email to=%s: %s", to, exc)
            return False

    async def send_password_reset(self, to: str, reset_url: str) -> bool:
        body = self._wrap_html(
            "Reset Your Password",
            f"""<p>We received a request to reset your password.</p>
<p>Click the button below to set a new password. This link expires in <strong>1 hour</strong>.</p>
<p style="text-align:center;margin:30px 0;">
<a href="{reset_url}" style="background:#D4621B;color:#fff;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:bold;">Reset Password</a>
</p>
<p style="color:#999;font-size:13px;">If you did not request this, please ignore this email. Your password will remain unchanged.</p>""",
        )
        return await self.send_email(to, "Reset Your Password", body, html=True)

    async def send_email_verification(self, to: str, verify_url: str) -> bool:
        body = self._wrap_html(
            "Verify Your Email",
            f"""<p>Thank you for registering! Please verify your email address.</p>
<p style="text-align:center;margin:30px 0;">
<a href="{verify_url}" style="background:#D4621B;color:#fff;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:bold;">Verify Email</a>
</p>
<p style="color:#999;font-size:13px;">This link expires in <strong>24 hours</strong>.</p>""",
        )
        return await self.send_email(to, "Verify Your Email", body, html=True)

    async def send_welcome_email(self, to: str, user_name: str) -> bool:
        body = self._wrap_html(
            "Welcome!",
            f"""<p>Welcome <strong>{user_name}</strong>!</p>
<p>Your account has been created. Here are some things you can do:</p>
<ul>
<li>Explore temples and book darshan</li>
<li>Make donations to your favorite temples</li>
<li>Plan your pilgrimage with AI assistance</li>
</ul>""",
        )
        return await self.send_email(to, "Welcome!", body, html=True)

    async def send_payment_confirmation(
        self, to: str, user_name: str, amount: str, reference: str, product: str
    ) -> bool:
        body = self._wrap_html(
            "Payment Confirmed",
            f"""<p>Hi {user_name},</p>
<p>Your payment has been confirmed.</p>
<table style="width:100%;border-collapse:collapse;margin:20px 0;">
<tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;">Amount</td><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">{amount}</td></tr>
<tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;">Reference</td><td style="padding:8px;border-bottom:1px solid #eee;">{reference}</td></tr>
<tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;">Service</td><td style="padding:8px;border-bottom:1px solid #eee;">{product}</td></tr>
</table>""",
        )
        return await self.send_email(to, "Payment Confirmed", body, html=True)

    async def send_booking_confirmation(
        self, to: str, user_name: str, booking_details: dict[str, Any]
    ) -> bool:
        rows = "".join(
            f'<tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;">{k}</td>'
            f'<td style="padding:8px;border-bottom:1px solid #eee;">{v}</td></tr>'
            for k, v in booking_details.items()
        )
        body = self._wrap_html(
            "Booking Confirmed",
            f"""<p>Hi {user_name},</p>
<p>Your booking has been confirmed.</p>
<table style="width:100%;border-collapse:collapse;margin:20px 0;">{rows}</table>""",
        )
        return await self.send_email(to, "Booking Confirmed", body, html=True)

    async def send_notification(
        self, to: str, subject: str, html_body: str
    ) -> bool:
        body = self._wrap_html(subject, html_body)
        return await self.send_email(to, subject, body, html=True)


email_service = EmailService()
