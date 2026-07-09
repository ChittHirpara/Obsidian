import requests, json, time

BASE = 'http://localhost:8000'
AGENT = 'auto-fix-bot'

print('=== Sending 10 queries to trigger pattern check ===')
for i in range(1, 11):
    payload = {'query': 'I want a refund for my last order', 'agent_id': AGENT}
    r = requests.post(f'{BASE}/query', json=payload).json()
    ae = r.get('audit_event', {})
    print(f"Query {i} | category={r.get('category')} | model={ae.get('model')} | cost={ae.get('cost_total')}")
    time.sleep(1)

print('\n=== Checking GET /remediations ===')
rems = requests.get(f'{BASE}/remediations').json()
print(json.dumps(rems, indent=2))

print('\n=== Sending 11th query to prove the fix works ===')
payload = {'query': 'Give me my money back', 'agent_id': AGENT}
r11 = requests.post(f'{BASE}/query', json=payload).json()
ae = r11.get('audit_event', {})
print(f"Query 11 | category={r11.get('category')} | model={ae.get('model')} | cost={ae.get('cost_total')}")
