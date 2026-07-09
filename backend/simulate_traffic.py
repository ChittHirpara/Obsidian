"""
simulate_traffic.py

Run this script in the background while pitching to the judges!
It continuously sends a slow trickle of realistic queries to your 3 agents,
making the new Platform Dashboard light up with live data, moving progress bars,
and autonomous routing events in real-time.

Usage:
  python simulate_traffic.py
"""

import requests
import time
import random
import sys

BASE_URL = "http://localhost:8000"

AGENTS = [
    "support-bot",
    "sales-bot",
    "internal-ops-bot"
]

QUERIES = [
    # order_status -> prone to escalation
    "Where is my order #12345?",
    "Can you check the tracking for my package?",
    "My delivery is late, where is it?",
    
    # refund -> normal
    "I want a refund for my purchase",
    "How do I return this item?",
    "Can I get my money back?",
    
    # sensitive_data -> triggers stop alerts
    "My social security number is 123-45-6789, update my account.",
    "My credit card is 4111-1111-1111-1111, please charge it.",
    
    # general_faq -> normal
    "What are your business hours?",
    "Do you ship internationally?",
    "Where are you located?"
]

print("🚀 Starting Obsidian Live Simulation...")
print("Switch to the 'Platform' tab in the dashboard to watch the magic happen!")
print("Press Ctrl+C to stop.")

try:
    while True:
        # Pick a random agent and a random query
        agent = random.choice(AGENTS)
        query = random.choice(QUERIES)
        
        print(f"[{time.strftime('%H:%M:%S')}] -> {agent}: '{query[:30]}...'")
        
        try:
            r = requests.post(f"{BASE_URL}/query", json={"query": query, "agent_id": agent})
            if r.status_code == 200:
                data = r.json()
                ae = data.get("audit_event", {})
                cost = ae.get("cost_total", 0)
                model = ae.get("model", "unknown")
                print(f"    <- {data.get('category')} | {model} | cost=${cost}")
            else:
                print(f"    <- Error: HTTP {r.status_code}")
        except requests.exceptions.RequestException as e:
            print(f"    <- Connection Error (is the backend running?)")
        
        # Sleep randomly between 2 and 5 seconds so it feels organic
        time.sleep(random.uniform(2, 5))

except KeyboardInterrupt:
    print("\n🛑 Simulation stopped.")
    sys.exit(0)
