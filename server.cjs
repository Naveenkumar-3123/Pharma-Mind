// server.js - Simple Express backend for sending emails
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Nodemailer Transporter Setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // App password
  },
});

// Verification Endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'active', message: 'Notification server is running.' });
});

// Pharmacy to Vendor Refill Request Endpoint
app.post('/api/send-refill-request', async (req, res) => {
  const { vendorName, vendorEmail, drugName, quantity, urgency } = req.body;

  if (!vendorEmail || !drugName) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  const isCritical = urgency === 'CRITICAL';
  const tag = isCritical ? '<span style="background: #fee2e2; color: #b91c1c; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 12px;">CRITICAL REQUEST</span>' : '';

  const mailOptions = {
    from: `"PharmAgent Alerts" <${process.env.EMAIL_USER}>`,
    to: vendorEmail,
    subject: `[${isCritical ? 'URGENT ' : ''}Refill Request] - ${drugName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h2 style="color: #0f172a; margin: 0;">Automated Purchase Order</h2>
            ${tag}
        </div>
        <p style="color: #334155; font-size: 16px;">Dear <strong>${vendorName || 'Vendor'}</strong>,</p>
        <p style="color: #334155; font-size: 16px;">
          This is an automated procurement request from <strong>City Pharmacy</strong>. Our inventory for the following item has fallen below critical thresholds:
        </p>
        <div style="background-color: #f8fafc; padding: 16px; border-radius: 6px; border-left: 4px solid #3b82f6; margin: 20px 0;">
            <p style="margin: 0 0 8px 0; font-size: 18px;"><strong>Item:</strong> ${drugName}</p>
            <p style="margin: 0; font-size: 16px;"><strong>Requested Qty:</strong> ${quantity || 'Standard Restock'} Units</p>
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
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[PO Sent] To: ${vendorEmail} | Vendor: ${vendorName} | Med: ${drugName} | Qty: ${quantity}`);
    res.status(200).json({ success: true, message: 'PO dispatched successfully.' });
  } catch (error) {
    console.error('Error sending PO email:', error);
    res.status(500).json({ success: false, error: 'Failed to send PO.' });
  }
});

// Bulk Refill Request Endpoint (Chatbot command)
app.post('/api/send-bulk-refill', async (req, res) => {
  const { email, items } = req.body;

  if (!email || !items || !Array.isArray(items)) {
    return res.status(400).json({ error: 'Missing required fields or invalid items.' });
  }

  const itemsHtml = items.map(item => `
        <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px; color: #0f172a; font-weight: bold;">${item.name}</td>
            <td style="padding: 10px; color: #b91c1c; font-weight: bold; text-align: right;">${item.stock} Units</td>
        </tr>
    `).join('');

  const mailOptions = {
    from: `"PharmAgent AI" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Automated Bulk Refill Request - Low Stock Items (< 100)`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h2 style="color: #0f172a; margin: 0;">Bulk Bulk Refill Request</h2>
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
                ${itemsHtml}
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
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[Bulk PO Sent] To: ${email} | ${items.length} items`);
    res.status(200).json({ success: true, message: 'Bulk refill request dispatched successfully.' });
  } catch (error) {
    console.error('Error sending Bulk PO email:', error);
    res.status(500).json({ success: false, error: 'Failed to send Bulk PO.' });
  }
});

// Send Reminder Endpoint
app.post('/api/send-reminder', async (req, res) => {
  const { patientName, email, phone, medicineName, daysRemaining } = req.body;

  if (!email || !medicineName || !patientName) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  const mailOptions = {
    from: `"PharmAgent Alerts" <${process.env.EMAIL_USER}>`,
    to: email, // Can also test by hardcoding: 'naveen83d.a@gmail.com',
    subject: `Action Required: ${medicineName} Refill Reminder`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0f172a; margin-top: 0;">Medicine Refill Reminder</h2>
        <p style="color: #334155; font-size: 16px;">Dear <strong>${patientName}</strong>,</p>
        <p style="color: #334155; font-size: 16px;">
          Our records indicate that your <strong>${medicineName}</strong> tablets may finish in the next <strong>${daysRemaining} days</strong>.
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
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[Email Sent] To: ${email} | Patient: ${patientName} | Med: ${medicineName}`);

    // Simulate SMS sending (Console only for now)
    console.log(`[SMS Sent] To: ${phone} | Msg: Dear ${patientName}, your ${medicineName} tablets may run out in ${daysRemaining} days. Please visit City Pharmacy for a refill.`);

    res.status(200).json({ success: true, message: 'Reminders dispatched successfully.' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ success: false, error: 'Failed to send reminders.' });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`PharmAgent Notification Server running on port ${PORT}`);
  console.log(`Email Service configured for: ${process.env.EMAIL_USER}`);
});
