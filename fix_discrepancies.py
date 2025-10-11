#!/usr/bin/env python3
import psycopg2

# Connessione al database
conn = psycopg2.connect(
    host="localhost",
    database="assessment_db",
    user="assessment_user",
    password="bAX2lyThZOSk0nmwwT6R7mva1bTHN+zJq2JugLHDykg="
)
cur = conn.cursor()

session_id = '80593af9-d674-405c-ae7f-4d0bad7212f6'

# Le 4 correzioni da fare
corrections = [
    {
        'process': 'DIGITAL MKTG',
        'activity': 'Campagne Internazionali',
        'category': 'Monitoring & Control',
        'dimension': 'Quanto il processo tende verso il miglioramento continuo?',
        'new_score': 1
    },
    {
        'process': 'DIGITAL MKTG',
        'activity': 'Campagne Internazionali',
        'category': 'Monitoring & Control',
        'dimension': 'Quanto il processo ha la capacità di riconfigurarsi a seguito di un cambiamento?',
        'new_score': 1
    },
    {
        'process': 'DIGITAL MKTG',
        'activity': 'Campagne Internazionali',
        'category': 'Monitoring & Control',
        'dimension': 'Qual è il livello di feed-back sulle performance utilizzato per le analisi?',
        'new_score': 1
    },
    {
        'process': 'DIGITAL MKTG',
        'activity': 'Campagne Internazionali',
        'category': 'Monitoring & Control',
        'dimension': 'Quanto le decisioni sono guidate e supportate dai feed-back?',
        'new_score': 1
    }
]

print(f"Correzione di {len(corrections)} valori per session_id: {session_id}\n")

for i, corr in enumerate(corrections, 1):
    print(f"{i}. {corr['activity']} - {corr['dimension'][:50]}...")
    
    # Verifica valore attuale
    cur.execute("""
        SELECT score FROM assessment_result 
        WHERE session_id = %s 
        AND process = %s 
        AND activity = %s 
        AND category = %s 
        AND dimension = %s
    """, (session_id, corr['process'], corr['activity'], corr['category'], corr['dimension']))
    
    result = cur.fetchone()
    if result:
        old_score = result[0]
        print(f"   Valore attuale: {old_score}")
        
        # Aggiorna
        cur.execute("""
            UPDATE assessment_result 
            SET score = %s 
            WHERE session_id = %s 
            AND process = %s 
            AND activity = %s 
            AND category = %s 
            AND dimension = %s
        """, (corr['new_score'], session_id, corr['process'], corr['activity'], corr['category'], corr['dimension']))
        
        print(f"   ✅ Aggiornato a: {corr['new_score']}")
    else:
        print(f"   ⚠️ Record non trovato!")
    print()

# Commit delle modifiche
conn.commit()
print(f"\n✅ Correzioni completate e committate!")

cur.close()
conn.close()
