#!/usr/bin/env python3
import psycopg2
import json

conn = psycopg2.connect(
    host="localhost",
    database="assessment_db",
    user="assessment_user",
    password="bAX2lyThZOSk0nmwwT6R7mva1bTHN+zJq2JugLHDykg="
)
cur = conn.cursor()

session_id = '80593af9-d674-405c-ae7f-4d0bad7212f6'

# Carica il modello JSON
with open('frontend/public/Casoinfinal.json', 'r', encoding='utf-8') as f:
    model = json.load(f)

# Crea un dizionario processo -> attività dal modello
model_activities = {}
for proc_data in model:
    process = proc_data['process']
    activities = set()
    for activity in proc_data.get('activities', []):
        activities.add(activity['name'])
    model_activities[process] = activities

print("=== VERIFICA COMPLETA TUTTI I PROCESSI ===\n")

# Query database per tutti i processi
cur.execute("""
    SELECT DISTINCT process, activity
    FROM assessment_result 
    WHERE session_id = %s
    ORDER BY process, activity
""", (session_id,))

db_data = cur.fetchall()

# Raggruppa per processo
db_activities = {}
for process, activity in db_data:
    if process not in db_activities:
        db_activities[process] = set()
    db_activities[process].add(activity)

# Confronta
issues = []
for process in sorted(db_activities.keys()):
    print(f"\n{'='*80}")
    print(f"PROCESSO: {process}")
    print(f"{'='*80}")
    
    db_acts = db_activities.get(process, set())
    model_acts = model_activities.get(process, set())
    
    print(f"Nel DB: {len(db_acts)} attività")
    print(f"Nel Modello: {len(model_acts)} attività")
    
    # Attività nel DB ma non nel modello
    extra = db_acts - model_acts
    if extra:
        print(f"\n❌ ATTIVITÀ NEL DB MA NON NEL MODELLO ({len(extra)}):")
        for act in sorted(extra):
            print(f"  - {act}")
            issues.append({
                'type': 'EXTRA',
                'process': process,
                'activity': act
            })
    
    # Attività nel modello ma non nel DB
    missing = model_acts - db_acts
    if missing:
        print(f"\n⚠️ ATTIVITÀ NEL MODELLO MA NON NEL DB ({len(missing)}):")
        for act in sorted(missing):
            print(f"  - {act}")
            issues.append({
                'type': 'MISSING',
                'process': process,
                'activity': act
            })
    
    if not extra and not missing:
        print("\n✅ Tutto OK!")

print(f"\n\n{'='*80}")
print(f"RIEPILOGO")
print(f"{'='*80}")
print(f"Totale problemi trovati: {len(issues)}")

extra_count = len([i for i in issues if i['type'] == 'EXTRA'])
missing_count = len([i for i in issues if i['type'] == 'MISSING'])

print(f"  - Attività da eliminare dal DB: {extra_count}")
print(f"  - Attività mancanti nel DB: {missing_count}")

if extra_count > 0:
    print(f"\n{'='*80}")
    print("SCRIPT DI PULIZIA")
    print(f"{'='*80}")
    for issue in issues:
        if issue['type'] == 'EXTRA':
            print(f"""
DELETE FROM assessment_result 
WHERE session_id = '{session_id}' 
  AND process = '{issue['process']}' 
  AND activity = '{issue['activity']}';
""")

cur.close()
conn.close()
