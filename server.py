import os
import smtplib
from email.message import EmailMessage
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
from dotenv import load_dotenv
from twilio.rest import Client as TwilioClient

# Load environment variables
load_dotenv()

app = FastAPI(title="PharmAgent Notification API")

# Configure CORS (allow all for development, mirroring the Express setup)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PORT = int(os.environ.get("PORT", 3012))
EMAIL_USER = os.environ.get("EMAIL_USER")
EMAIL_PASS = os.environ.get("EMAIL_PASS")

# Twilio Configuration
TWILIO_ACCOUNT_SID = os.environ.get("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN = os.environ.get("TWILIO_AUTH_TOKEN", "")
TWILIO_PHONE_NUMBER = os.environ.get("TWILIO_PHONE_NUMBER", "")  # Your Twilio phone number

if not EMAIL_USER or not EMAIL_PASS:
    print("WARNING: EMAIL_USER or EMAIL_PASS is not set in the environment variables.")

if not TWILIO_PHONE_NUMBER:
    print("WARNING: TWILIO_PHONE_NUMBER is not set. SMS will not be sent until a Twilio number is configured.")

# Initialize Twilio Client
try:
    twilio_client = TwilioClient(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
    print(f"Twilio SMS Service initialized (SID: {TWILIO_ACCOUNT_SID[:10]}...)")
except Exception as e:
    print(f"WARNING: Twilio initialization failed: {e}")
    twilio_client = None

def send_email_sync(to_email: str, subject: str, html_content: str):
    """
    Synchronous helper function to send an email using smtplib.
    FastAPI will automatically run this in a background thread pool
    if called from a synchronous endpoint.
    """
    msg = EmailMessage()
    msg['Subject'] = subject
    msg['From'] = f"PharmAgent Alerts <{EMAIL_USER}>"
    msg['To'] = to_email
    msg.set_content("Please enable HTML to view this message.")
    msg.add_alternative(html_content, subtype='html')

    try:
        # Use Outlook/Office365 or Gmail based on user provider. 
        # Assuming Gmail based on previous .env credentials.
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(EMAIL_USER, EMAIL_PASS)
            server.send_message(msg)
    except Exception as e:
        print(f"SMTP Error: {e}")
        raise e

def send_sms_sync(to_phone: str, message_body: str):
    """
    Send an SMS using Twilio REST API.
    Gracefully handles errors so email flow is never blocked.
    """
    if not twilio_client or not TWILIO_PHONE_NUMBER:
        print(f"[SMS Skipped] Twilio not configured. Would have sent to {to_phone}: {message_body[:80]}...")
        return False
    
    if not to_phone or len(to_phone) < 10:
        print(f"[SMS Skipped] Invalid phone number: {to_phone}")
        return False

    # Ensure phone number has country code
    formatted_phone = to_phone.strip()
    if not formatted_phone.startswith('+'):
        # If your Twilio number is +1 (US), default to +1. Otherwise +91.
        if TWILIO_PHONE_NUMBER.startswith('+1'):
            formatted_phone = '+1' + formatted_phone
        else:
            formatted_phone = '+91' + formatted_phone

    try:
        msg = twilio_client.messages.create(
            body=message_body,
            from_=TWILIO_PHONE_NUMBER,
            to=formatted_phone
        )
        print(f"[SMS Sent] To: {formatted_phone} | SID: {msg.sid}")
        return True
    except Exception as e:
        print(f"[SMS Error] To: {formatted_phone} | Error: {e}")
        return False

# --- Models ---

class RefillRequestModel(BaseModel):
    vendorName: Optional[str] = 'Vendor'
    vendorEmail: str
    drugName: str
    quantity: Optional[str | int] = 'Standard Restock'
    urgency: Optional[str] = ''
    vendorPhone: Optional[str] = ''  # Vendor phone for SMS

class BulkItemModel(BaseModel):
    name: str
    stock: int

class BulkRefillRequestModel(BaseModel):
    email: str
    phone: Optional[str] = ''  # Pharmacy phone for SMS confirmation
    items: List[BulkItemModel]

class ReminderRequestModel(BaseModel):
    patientName: str
    email: str
    phone: Optional[str] = ""
    medicineName: str
    daysRemaining: int | str

from fastapi.responses import RedirectResponse

# --- Endpoints ---

@app.get("/")
def root():
    """Redirects web browser users to the interactive API docs"""
    return RedirectResponse(url="/docs")

@app.get("/api/health")
def health_check():
    """Verification Endpoint"""
    return {"status": "active", "message": "Notification server (FastAPI) is running."}

@app.post("/api/send-refill-request")
def send_refill_request(req: RefillRequestModel):
    """Pharmacy to Vendor Refill Request Endpoint"""
    is_critical = req.urgency == 'CRITICAL'
    tag = '<span style="background: #fee2e2; color: #b91c1c; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 12px;">CRITICAL REQUEST</span>' if is_critical else ''
    
    subject = f"[{'URGENT ' if is_critical else ''}Refill Request] - {req.drugName}"
    html = f"""
      <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h2 style="color: #0f172a; margin: 0;">Automated Purchase Order</h2>
            {tag}
        </div>
        <p style="color: #334155; font-size: 16px;">Dear <strong>{req.vendorName}</strong>,</p>
        <p style="color: #334155; font-size: 16px;">
          This is an automated procurement request from <strong>City Pharmacy</strong>. Our inventory for the following item has fallen below critical thresholds:
        </p>
        <div style="background-color: #f8fafc; padding: 16px; border-radius: 6px; border-left: 4px solid #3b82f6; margin: 20px 0;">
            <p style="margin: 0 0 8px 0; font-size: 18px;"><strong>Item:</strong> {req.drugName}</p>
            <p style="margin: 0; font-size: 16px;"><strong>Requested Qty:</strong> {req.quantity} Units</p>
        </div>
        <p style="color: #334155; font-size: 16px;">
          Please process this order at your earliest convenience. If this item is out of stock, please notify us immediately.
        </p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="color: #64748b; font-size: 14px; margin-bottom: 0;">
          Thank you,<br/>
          <strong>The PharmAgent Procurement System</strong>
        </p>
      </div>
    """

    try:
        send_email_sync(req.vendorEmail, subject, html)
        print(f"[PO Sent] To: {req.vendorEmail} | Vendor: {req.vendorName} | Med: {req.drugName} | Qty: {req.quantity}")
        
        # Send SMS to vendor if phone is provided
        if req.vendorPhone:
            sms_text = f"PharmAgent PO: {req.drugName} x{req.quantity} units needed {'(URGENT)' if is_critical else ''}. Please process ASAP. - City Pharmacy"
            send_sms_sync(req.vendorPhone, sms_text)
        
        return {"success": True, "message": "PO dispatched successfully."}
    except Exception as e:
        print(f"Error sending PO email: {e}")
        raise HTTPException(status_code=500, detail="Failed to send PO.")


@app.post("/api/send-bulk-refill")
def send_bulk_refill(req: BulkRefillRequestModel):
    """Bulk Refill Request Endpoint (Chatbot command)"""
    items_html = ""
    for item in req.items:
        items_html += f"""
        <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px; color: #0f172a; font-weight: bold;">{item.name}</td>
            <td style="padding: 10px; color: #b91c1c; font-weight: bold; text-align: right;">{item.stock} Units</td>
        </tr>
        """

    subject = "Automated Bulk Refill Request - Low Stock Items (< 100)"
    html = f"""
      <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h2 style="color: #0f172a; margin: 0;">Bulk Refill Request</h2>
            <span style="background: #e0e7ff; color: #4338ca; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 12px;">AI GENERATED</span>
        </div>
        <p style="color: #334155; font-size: 16px;">
          This is an automated bulk refill request triggered by the PharmAgent AI. The following items have fallen below 100 units in stock and require immediate restocking:
        </p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background-color: #f8fafc; border-radius: 6px; overflow: hidden;">
            <thead>
                <tr style="background-color: #f1f5f9; border-bottom: 2px solid #e2e8f0;">
                    <th style="padding: 12px 10px; text-align: left; color: #475569; font-size: 12px; text-transform: uppercase;">Medicine Name</th>
                    <th style="padding: 12px 10px; text-align: right; color: #475569; font-size: 12px; text-transform: uppercase;">Current Stock</th>
                </tr>
            </thead>
            <tbody>
                {items_html}
            </tbody>
        </table>

        <p style="color: #334155; font-size: 16px;">
          Please review these items and issue purchase orders accordingly.
        </p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="color: #64748b; font-size: 14px; margin-bottom: 0;">
          Thank you,<br/>
          <strong>The PharmAgent AI Sys</strong>
        </p>
      </div>
    """

    try:
        send_email_sync(req.email, subject, html)
        print(f"[Bulk PO Sent] To: {req.email} | {len(req.items)} items")
        
        # Send SMS confirmation if phone is provided
        if req.phone:
            item_names = ', '.join([item.name for item in req.items[:3]])
            extra = f" +{len(req.items) - 3} more" if len(req.items) > 3 else ""
            sms_text = f"PharmAgent Bulk Refill: {len(req.items)} low-stock items flagged: {item_names}{extra}. PO email sent to vendor. - City Pharmacy"
            send_sms_sync(req.phone, sms_text)
        
        return {"success": True, "message": "Bulk refill request dispatched successfully."}
    except Exception as e:
        print(f"Error sending Bulk PO email: {e}")
        raise HTTPException(status_code=500, detail="Failed to send Bulk PO.")


@app.post("/api/send-reminder")
def send_reminder(req: ReminderRequestModel):
    """Send Reminder Endpoint"""
    subject = f"Action Required: {req.medicineName} Refill Reminder"
    html = f"""
      <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0f172a; margin-top: 0;">Medicine Refill Reminder</h2>
        <p style="color: #334155; font-size: 16px;">Dear <strong>{req.patientName}</strong>,</p>
        <p style="color: #334155; font-size: 16px;">
          Our records indicate that your <strong>{req.medicineName}</strong> tablets may finish in the next <strong>{req.daysRemaining} days</strong>.
        </p>
        <p style="color: #334155; font-size: 16px;">
          To avoid any interruption in your treatment, please contact City Pharmacy to refill your prescription as soon as possible.
        </p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="color: #64748b; font-size: 14px; margin-bottom: 0;">
          Thank you,<br/>
          <strong>The PharmAgent Healthcare Team</strong>
        </p>
      </div>
    """

    try:
        send_email_sync(req.email, subject, html)
        print(f"[Email Sent] To: {req.email} | Patient: {req.patientName} | Med: {req.medicineName}")
        
        # Send real SMS via Twilio
        if req.phone:
            sms_text = f"Dear {req.patientName}, your {req.medicineName} tablets may run out in {req.daysRemaining} days. Please visit City Pharmacy for a refill. - PharmAgent"
            send_sms_sync(req.phone, sms_text)
        
        return {"success": True, "message": "Reminders dispatched successfully."}
    except Exception as e:
        print(f"Error sending Reminder email: {e}")
        raise HTTPException(status_code=500, detail="Failed to send reminders.")


if __name__ == "__main__":
    import uvicorn
    print(f"PharmAgent Notification Server (FastAPI) starting on port {PORT}")
    print(f"Email Service configured for: {EMAIL_USER}")
    uvicorn.run("server:app", host="0.0.0.0", port=PORT, reload=True)
