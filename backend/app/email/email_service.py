import os
import smtplib
from pathlib import Path

from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from jinja2 import Environment, FileSystemLoader


class EmailError(Exception):
    """Error relacionado con el envío de correos."""

class EmailService:
    def __init__(self):
        self.server = os.getenv("MAIL_SERVER")
        self.port = int(os.getenv("MAIL_PORT", 587))
        self.username = os.getenv("MAIL_USERNAME")
        self.password = os.getenv("MAIL_PASSWORD")
        self.sender = os.getenv("MAIL_FROM")
        self.template_dir = (Path(__file__).resolve().parent / "templates")
        self.template_env = Environment(loader=FileSystemLoader(self.template_dir))

    def send_email(self, recipient, subject, template_name, context=None):
        try:
            template = self.template_env.get_template(template_name)
            html = template.render(**(context or {}))

            message = MIMEMultipart("alternative")

            message["From"] = self.sender
            message["To"] = recipient
            message["Subject"] = subject

            message.attach(MIMEText(html,"html","utf-8"))

            with smtplib.SMTP(self.server, self.port) as smtp:
                smtp.starttls()
                smtp.login(self.username, self.password)
                smtp.send_message(message)
            return True

        except FileNotFoundError as error:
            raise EmailError("No se encontró la plantilla del correo.") from error
        except smtplib.SMTPAuthenticationError as error:
            raise EmailError("No se pudo autenticar con el servidor de correo.") from error
        except smtplib.SMTPRecipientsRefused as error:
            raise EmailError("El servidor rechazó el correo destinatario.") from error
        except smtplib.SMTPException as error:
            raise EmailError("Ocurrió un error al enviar el correo.") from error
        except OSError as error:
            raise EmailError("No se pudo conectar con el servidor de correo.") from error