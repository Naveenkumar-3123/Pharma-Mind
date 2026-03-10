# PharmAgent 🏥💊

> **AI-Powered Pharmacy Intelligence Platform**
> Optimize pharmacy inventory, reduce medicine waste, and help patients get the right medicines — powered by autonomous AI agents.

---

## 🌟 Overview

PharmAgent is an autonomous pharmacy supply chain management system built for modern pharmacies. It uses an AI agent that continuously monitors stock levels, predicts expiry waste, automates procurement, and provides patient medication guidance — all without manual intervention.

**Built for:** GKM_4 Hackathon

---

## 🚀 Features

### Core Agent Engine (Autonomous — Runs Every 30 Seconds)
| # | Feature | Description |
|---|---------|-------------|
| 1 | **Stock Monitoring** | Flags items below reorder threshold with Critical/Warning severity |
| 2 | **Expiry Risk Report** | Scans batches expiring < 30 days with qty > 10, estimates financial impact |
| 3 | **Demand Spike Detection** | Cross-references OT schedule + admission forecast for surge predictions |
| 4 | **Auto PO Drafting** | Creates purchase orders for low-stock + high-demand items, picks best vendor |
| 5 | **Transfer Suggestions** | Recommends inter-department transfers before external ordering |
| 6 | **Tiered Auto-Alerts** | 🚨 Critical (< 24hrs), ⚠️ Warning (< 3 days), 📅 Expiry Risk (< 30 days) |

### Dashboard Pages (9 Pages)
- **Dashboard** — Real-time overview with stat cards, urgent replenishment, demand drivers.
- **Inventory** — Full drug inventory with ML slow-movement detection, batch tracking, QR scanner, FEFO optimization.
- **Procurement** — AI auto-drafted purchase orders, vendor comparison, auto-buy settings.
- **Expiry Manager** — Expiry risk tracking, relocation suggestions, donation board, and flash discount generation.
- **Financial Summary** — Interactive Chart.js charts (budget, trends, losses, waste reduction).
- **Community Board** — Medicine exchange, surplus posts, donation listings.
- **Patient Care** — Medication tracker, AI symptom checker via Groq API, patient medicine reminders.
- **Dealer Network** — Connect to other pharmacies via codes, approve/reject inventory transfers to reduce waste.
- **Alert Center** — Live tiered alerts from agent, transfer suggestions, auto-PO summary.

### Advanced Integration & Notifications
- **Twilio SMS Alerts:** Real SMS notifications dispatched to patients for refills and to vendors for critical purchase orders.
- **Automated Email Notifications:** Node.js/FastAPI backend handles dispatching formal purchase orders and bulk refill summaries directly to the pharmacy admin and vendors.
- **Flash Sale Engine:** Built-in promo engine tracks coupon state and validates discounts live on checkout.
- **Admin Chatbot:** Interactive floating AI chatbot that can fetch live inventory stats and dispatch bulk PO emails with a single command (`refill`).

### Authentication System
- **Pharmacy Admin:** Store code login (e.g., `DEMO`, `MED-CHN-2041`)
- **Patient:** Symptom-based AI medicine suggestions via Groq API (Llama 3 / Mixtral models).

---

## 🛠️ Tech Stack

| Technology | Purpose |
|-----------|---------|
| React 19 | Frontend framework |
| Vite 7 | Build tool & dev server |
| Tailwind CSS | Styling |
| Chart.js + react-chartjs-2 | Data visualization |
| FastAPI / Python | Notification backend (Email + Twilio SMS) |
| Groq API | High-speed AI inference for symptom checking & chatbots |
| TensorFlow.js | Local ML models for Slow-Moving item prediction |
| Google Material Symbols | Iconography |

---

## 📁 Project Structure

```
Medicine/
├── public/
├── src/
│   ├── components/
│   │   ├── Layout.jsx              # Main layout wrapper
│   │   ├── AdminChatbot.jsx        # Floating AI chatbot
│   │   └── AgentNotifications.jsx  # Floating toast notification system
│   ├── context/
│   │   └── AgentContext.jsx        # React context for agent state
│   ├── data/
│   │   └── mockData.js             # All simulated datasets
│   ├── pages/
│   │   ├── Dashboard.jsx           # Main dashboard
│   │   ├── Inventory.jsx           # Drug inventory with ML detection
│   │   ├── Procurement.jsx         # Purchase orders
│   │   ├── ExpiryManager.jsx       # Expiry tracking & Flash sales
│   │   ├── CommunityBoard.jsx      # Medicine exchange
│   │   ├── PatientCare.jsx         # Patient management & Symptom Checker
│   │   ├── DealerNetwork.jsx       # Pharmacy-to-pharmacy transfers
│   │   └── AlertCenter.jsx         # Tiered alerts
│   ├── utils/
│   │   ├── agentEngine.js          # Core AI agent
│   │   ├── inventoryEngine.js      # FEFO, stock, expiry logic
│   │   ├── mlEngine.js             # TensorFlow.js slow-movement modeling
│   │   └── aiService.js            # Groq API integration
│   ├── App.jsx                     # Root routing
│   └── main.jsx                    # Entry point
├── server.py                       # FastAPI Email & Twilio SMS backend
├── package.json
└── vite.config.js
```

---

## ⚡ Quick Start

### Prerequisites
- Node.js 18+
- Python 3.10+ (for notification backend)
- Twilio Account (for SMS)

### Installation

```bash
# Clone the repository
git clone https://github.com/Naveenkumar-3123/Pharma-Mind.git
cd Medicine

# Install frontend dependencies
npm install

# Install backend dependencies
pip install fastapi uvicorn smtplib twilio python-dotenv pydantic

# Start frontend development server
npm run dev

# In a new terminal, start the notification backend
python server.py
```

The app will be available at `http://localhost:5173/`

### Environment Variables (.env)
Create a `.env` file in the root directory to enable the notification backend:
```env
PORT=3012
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+1234567890
```

### Demo Login

| Role | Store Code |
|------|-----------|
| Demo Pharmacy | `DEMO` |
| City Pharmacy, Chennai | `MED-CHN-2041` |

---

## 📊 Application Flow

```
Landing Page (/) 
  ├── Pharmacy Admin Login (/pharmacy-login)
  │     └── Dashboard (/dashboard) ← 9 pages with agent
  └── Patient Login (/patient-login)
        └── AI Symptom Suggestions via Groq
```

---

## 🤖 Agent Brain Architecture

```
Data Sources → Agent Brain → Decision Layer → Action Layer → Notification Layer
```

The agent runs on a **continuous decision loop** (every 30 seconds):

1. **Data Ingestion** — Reads inventory, OT schedule, admission forecast, vendor catalog
2. **Risk Assessment** — Identifies critical stock, expiry risks, demand spikes
3. **Action Generation** — Drafts purchase orders, suggests transfers
4. **Alert Dispatch** — Sends tiered notifications (Critical → Warning → Expiry → Info)

Alerts appear as **floating toast notifications** that slide in automatically from the bottom-right corner.

---

## 🔮 Upcoming Development

### Phase 2 — Database Integration
- [ ] Migrate mock data to fully functional Firebase / PostgreSQL cluster.
- [ ] Implement JWT authentication with role-based access control.

### Phase 3 — Advanced ML Forecasting
- [ ] Long Short-Term Memory (LSTM) network for predicting demand seasonalities.
- [ ] Weather API integration to forecast allergy/cold medication spikes.

---

## 📄 License & Team

This project is built for the **GKM_4 Hackathon**.

**GKM_4** — Pharmacy Inventory Optimization Agent

*Built with ❤️ using React, FastAPI, Twilio, and Groq AI*
