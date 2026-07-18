import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import os
import logging

logger = logging.getLogger("backend.email_service")

# Professional HTML Email Template
EMAIL_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f1f5f9;
            margin: 0;
            padding: 0;
            color: #334155;
        }}
        .container {{
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            border: 1px solid #e2e8f0;
        }}
        .header {{
            background-color: #1e293b;
            color: #ffffff;
            padding: 20px 30px;
            text-align: center;
        }}
        .header h1 {{
            margin: 0;
            font-size: 24px;
            font-weight: 600;
        }}
        .content {{
            padding: 30px;
        }}
        .alert-box {{
            background-color: {severity_color};
            color: {severity_text};
            padding: 15px;
            border-radius: 6px;
            margin-bottom: 25px;
            text-align: center;
            font-weight: bold;
            font-size: 18px;
        }}
        .details-table {{
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
        }}
        .details-table th, .details-table td {{
            padding: 12px 15px;
            text-align: left;
            border-bottom: 1px solid #e2e8f0;
        }}
        .details-table th {{
            background-color: #f8fafc;
            color: #64748b;
            font-weight: 600;
            width: 40%;
        }}
        .details-table td {{
            color: #0f172a;
            font-weight: 500;
        }}
        .action-container {{
            text-align: center;
            margin-top: 30px;
        }}
        .btn {{
            display: inline-block;
            background-color: #2563eb;
            color: #ffffff !important;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 6px;
            font-weight: 600;
            font-size: 16px;
        }}
        .footer {{
            background-color: #f8fafc;
            padding: 15px;
            text-align: center;
            color: #64748b;
            font-size: 12px;
            border-top: 1px solid #e2e8f0;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>AranyaSentinel AI</h1>
        </div>
        <div class="content">
            <div class="alert-box">
                [{severity}] {alert_type} Detected
            </div>
            
            <table class="details-table">
                <tr>
                    <th>Forest Name</th>
                    <td>{forest_name}</td>
                </tr>
                <tr>
                    <th>Analysis Date</th>
                    <td>{analysis_date}</td>
                </tr>
                <tr>
                    <th>Forest Loss</th>
                    <td>{forest_loss}%</td>
                </tr>
                <tr>
                    <th>Health Score</th>
                    <td>{health_score}/100</td>
                </tr>
                <tr>
                    <th>Location</th>
                    <td>{forest_location}</td>
                </tr>
            </table>

            <p style="line-height: 1.6; color: #475569;">
                An automated analysis by AranyaSentinel AI has detected a significant change in the forest canopy. 
                Immediate verification is recommended.
            </p>

            <div class="action-container">
                <a href="{ack_url}" class="btn">✓ Acknowledge Alert (Direct Link)</a>
                <br><br>
                <a href="http://127.0.0.1:5173/alerts" style="color: #64748b; font-size: 14px; text-decoration: underline;">View in Dashboard</a>
            </div>
        </div>
        <div class="footer">
            Automated Alert System &copy; AranyaSentinel AI<br>
            This is an auto-generated email. Please do not reply.
        </div>
    </div>
</body>
</html>
"""

def get_severity_colors(severity):
    severity = severity.upper()
    if severity == "CRITICAL":
        return "#fee2e2", "#b91c1c" # Light Red, Dark Red
    elif severity == "HIGH":
        return "#ffedd5", "#c2410c" # Light Orange, Dark Orange
    elif severity == "MEDIUM":
        return "#fef9c3", "#a16207" # Light Yellow, Dark Yellow
    else:
        return "#f1f5f9", "#334155" # Light Gray, Dark Gray

def send_alert_email(to_email: str, subject: str, alert_data: dict, is_escalation: bool = False, is_reminder: bool = False):
    """
    Sends an HTML email using SMTP configurations from .env.
    """
    smtp_server = os.environ.get("SMTP_SERVER")
    smtp_port = os.environ.get("SMTP_PORT")
    smtp_email = os.environ.get("SMTP_EMAIL")
    smtp_password = os.environ.get("SMTP_PASSWORD")
    
    if not all([smtp_server, smtp_port, smtp_email, smtp_password]):
        logger.warning("SMTP credentials are not fully configured in .env. Skipping email dispatch.")
        return "Failed (No Config)"

    if not to_email:
        logger.warning("Recipient email is empty. Skipping email dispatch.")
        return "Failed (No Recipient)"

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"AranyaSentinel AI <{smtp_email}>"
        msg["To"] = to_email

        bg_color, text_color = get_severity_colors(alert_data.get("severity", "LOW"))
        if is_escalation:
            bg_color, text_color = "#fee2e2", "#b91c1c"
        elif is_reminder:
            bg_color, text_color = "#fef3c7", "#d97706"
            
        alert_title = alert_data.get("alert_type", "Alert")
        if is_escalation:
            alert_title = "[ESCALATED] " + alert_title
        elif is_reminder:
            alert_title = "[REMINDER] " + alert_title
            
        ack_url = f"http://127.0.0.1:8000/api/alerts/email-acknowledge/{alert_data.get('id')}"
        
        # Prepare template variables
        html_content = EMAIL_TEMPLATE.format(
            severity_color=bg_color,
            severity_text=text_color,
            severity=alert_data.get("severity", "UNKNOWN"),
            alert_type=alert_title,
            forest_name=alert_data.get("forest_name", "Unknown Region"),
            analysis_date=alert_data.get("generated_date", "N/A"),
            forest_loss=alert_data.get("forest_loss_percentage", 0.0),
            health_score=alert_data.get("forest_health_score", 0.0),
            forest_location=alert_data.get("forest_location", "N/A"),
            ack_url=ack_url
        )

        msg.attach(MIMEText(html_content, "html"))

        with smtplib.SMTP(smtp_server, int(smtp_port)) as server:
            server.starttls()
            server.login(smtp_email, smtp_password)
            server.sendmail(smtp_email, to_email, msg.as_string())
            
        logger.info(f"Email sent successfully to {to_email}")
        return "Sent"
        
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {e}")
        return f"Failed ({str(e)})"
