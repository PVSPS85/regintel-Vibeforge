from app.logger import logger

def send_mock_email(to_email: str, subject: str, body: str) -> None:
    """
    Simulates sending an email by logging the payload.
    """
    logger.info(f"Mock email sent to {to_email} | Subject: '{subject}' | Body: '{body}'")

def log_audit_event(user_id: str, action: str, details: str = "") -> None:
    """
    Logs a security or audit event for compliance tracking.
    """
    audit_message = f"AUDIT EVENT - UserID: {user_id} | Action: '{action}'"
    if details:
        audit_message += f" | Details: '{details}'"
        
    logger.info(audit_message)
