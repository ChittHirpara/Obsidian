
# Obsidian AI Governance & Audit Platform

A modern, full-stack AI governance platform that provides audit trails, cost control, compliance monitoring, and trust scoring for LLM applications. Built with FastAPI (backend) and Next.js 15 (frontend), Obsidian ensures your AI systems are transparent, cost-effective, and compliant with your governance policies.

## Project Overview

Obsidian empowers organizations to:
- **Track every decision**: Get complete audit trails of LLM queries, model choices, costs, and latency
- **Control costs**: Enforce budget limits at both the global and agent-specific level
- **Monitor compliance**: Block queries that violate sensitive data policies or jailbreak attempts
- **Optimize routing**: Automatically switch to cheaper models when cost escalation is detected
- **Measure trust**: Calculate a 0-100 trust score based on compliance, efficiency, and recall accuracy
- **Isolate agents**: Provide completely independent budgets and event logs per agent

## Key Features

### 1. Multi-Agent Isolation
Each agent (e.g., `support-bot`, `sales-bot`) operates in complete isolation with its own:
- Budget limit and consumption tracking
- Event log and audit history
- Routing policy and model preferences
- Trust score and analytics

This ensures that budgets and performance metrics don't bleed across different use cases or teams.

### 2. Real-Time Audit Trail
Every query through Obsidian is logged with rich metadata:
- Timestamp in milliseconds
- Category (order status, refund, sensitive data, general FAQ)
- Model used (e.g., GPT-4, Llama 3, Groq models)
- Total cost and latency
- Action taken (allow, stop, switch model)
- Budget state before/after the query
- Agent ID for multi-tenant setups

Logs are persisted locally and can be exported or purged via the UI.

### 3. Cost Governance
- **Budget enforcement**: Set hard budget caps per agent or globally; queries are automatically blocked when the budget is exhausted
- **Cost tracking**: Real-time cumulative cost curves and per-query cost breakdowns
- **Auto-remediation**: Detects cost escalation patterns and automatically switches categories to cheaper fallback models
- **ROI analytics**: Compare actual spend vs. worst-case baseline to quantify savings from intelligent routing

### 4. Compliance & Policy Enforcement
- **Sensitive data detection**: Blocks queries containing PII like social security numbers or credit card info
- **Jailbreak prevention**: Detects and blocks prompt injection attempts
- **Category-based routing**: Routes queries to appropriate models based on sensitivity and cost requirements
- **Slack alerts**: Notifies admins when compliance stops are triggered or budgets are running low

### 5. Trust Score
Calculates a holistic trust score (0-100) for each agent based on three weighted components:
- **Compliance (40%)**: Percentage of queries that passed policy checks
- **Cost efficiency (30%)**: How close actual average cost is to the cheapest possible model
- **Recall accuracy (30%)**: Hindsight's ability to accurately recall past query details

### 6. Rich Frontend Dashboard
A modern, responsive UI built with Next.js, React, and Tailwind CSS featuring:
- Live overview with key metrics (budget remaining, total spend, avg latency, block rate)
- Interactive cost curve and category mix charts
- Recent events table with real-time updates
- Deep-dive analytics and insights pages
- Trust score calculation with formula transparency
- Query interface for testing governance policies
- Settings page for customizing models and budgets

## Tech Stack

### Backend
- **FastAPI**: Modern, high-performance web framework for building APIs
- **CascadeFlow**: Policy enforcement and budget tracking for LLMs
- **Groq**: Fast LLM inference via OpenAI-compatible API
- **Hindsight (optional)**: Semantic memory layer for query history recall
- **Pydantic**: Data validation using Python type hints

### Frontend
- **Next.js 15**: React framework with App Router and API proxy
- **React 19**: UI library with hooks and context
- **Tailwind CSS**: Utility-first CSS framework
- **Recharts**: Composable charting library
- **Framer Motion**: Animation library for smooth UI transitions
- **TypeScript**: Static type checking for better code quality

## Project Structure

```
Obsidian/
├── backend/
│   ├── main.py                 # FastAPI app with all endpoints
│   ├── obsidian_core.py        # Core logic, LLM routing, budget enforcement
│   ├── hindsight_store.py      # Event storage and Hindsight integration
│   ├── settings_store.py       # Global settings management
│   ├── slack_alerts.py         # Slack notification integration
│   ├── simple_server.py        # Minimal server for demo (no cascadeflow)
│   ├── obsidian_events_store.json  # Persistent event log
│   └── requirements.txt        # Python dependencies
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── api/[...path]/route.ts  # Next.js API proxy to backend
    │   │   └── dashboard/      # All dashboard pages
    │   ├── components/         # Reusable UI components
    │   │   ├── DashboardContext.tsx  # Global state management
    │   │   └── DashboardNavbar.tsx   # Navigation bar
    │   └── lib/
    │       └── api.ts          # API client and type definitions
    └── package.json            # Node.js dependencies
```

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 20+
- npm or yarn
- Groq API key (for full functionality)

### Running with Simple Backend (Quick Demo)
This is the easiest way to see Obsidian in action without needing all dependencies:

1. **Start the simple backend**:
   ```bash
   cd backend
   python simple_server.py
   ```
   This runs on http://localhost:8000 and serves existing sample event data.

2. **Start the frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   The app will be available at http://localhost:3001/dashboard

### Running with Full Backend
For complete functionality including real LLM queries and governance:

1. **Set up environment variables**:
   Create a `.env` file in the backend directory:
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   USE_HINDSIGHT=false  # Set to true if you're running Hindsight
   ```

2. **Install Python dependencies**:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. **Run the FastAPI backend**:
   ```bash
   python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

4. **Run the frontend** (same as in quick demo):
   ```bash
   cd frontend
   npm run dev
   ```

## API Endpoints

| Method | Endpoint               | Description                                  |
|--------|------------------------|----------------------------------------------|
| GET    | /health                | Backend health check                         |
| GET    | /events                | Get all audit events (filter by agent_id)    |
| GET    | /insights              | Get routing insights and suggestions         |
| GET    | /agents                | List all agents with stats                   |
| GET    | /trust-score           | Calculate trust score for an agent           |
| GET    /roi                   | Get ROI and cost analytics                   |
| GET    | /remediations          | Get auto-remediation log                     |
| POST   | /query                 | Submit a query to be governed                |
| DELETE | /session               | Reset default agent's budget and policy      |
| DELETE | /agents/{id}/reset     | Reset a specific agent's budget              |

## Usage Examples

### Submitting a Query
Go to the "Query" page in the dashboard, type a question like "Where is my order #12345?", and click submit. Obsidian will:
1. Classify the query category (order_status)
2. Check the budget
3. Route to the appropriate model based on policy
4. Return a response
5. Log everything to the audit trail

### Viewing Insights
The "Insights" page shows:
- Hindsight recall of past queries
- Reflective analysis of patterns
- Routing suggestions to save costs
- Auto-remediation history

### Calculating Trust Score
Navigate to "Trust Score" and select an agent to see:
- Overall trust score (0-100)
- Breakdown of individual components
- Formula transparency
- Recall evaluation details

## Customization Options

The platform can be customized via the "Settings" page or code:
- **Default model**: Primary LLM for most queries
- **Fallback model**: Cheaper model for cost optimization
- **Budget cap**: Maximum spend per session
- **PII detection**: Enable/disable PII blocking
- **Jailbreak check**: Enable/disable prompt injection detection
- **Strict sensitive data**: Block all sensitive data category queries

## Future Enhancements
- Role-based access control (RBAC)
- Advanced analytics dashboards
- Integration with more LLM providers
- Export audit logs to CSV/JSON
- A/B testing for routing policies
- More granular compliance rules
