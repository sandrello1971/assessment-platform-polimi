with open('app/routers/admin.py', 'r') as f:
    content = f.read()

# Aggiungi la funzione di conversione prima dell'endpoint
converter_function = '''
def convert_parser_to_frontend_format(parsed_data: dict) -> list:
    """
    Converte il formato del parser Excel nel formato atteso dal frontend
    
    Parser format:
    {
      "questions": {"Governance": [...], ...},
      "processes": [{"name": "...", "categories": {"Governance": [scores]}}]
    }
    
    Frontend format:
    [
      {
        "process": "PROCESSO",
        "activities": [
          {
            "name": "activity",
            "categories": {
              "Governance": {"domanda1": score1, ...}
            }
          }
        ]
      }
    ]
    """
    frontend_data = []
    questions = parsed_data.get("questions", {})
    processes_raw = parsed_data.get("processes", [])
    
    # Raggruppa per processo
    processes_dict = {}
    for proc in processes_raw:
        proc_name_parts = proc["name"].split("::")
        if len(proc_name_parts) == 2:
            process, activity = proc_name_parts
        else:
            # Se non ha ::, usa il primo processo come default
            process = "GENERALE"
            activity = proc["name"]
        
        if process not in processes_dict:
            processes_dict[process] = []
        
        # Converti categories da array a dict domanda->valore
        activity_data = {
            "name": activity,
            "categories": {}
        }
        
        for cat_name, scores in proc["categories"].items():
            if cat_name in questions:
                cat_questions = questions[cat_name]
                activity_data["categories"][cat_name] = {}
                
                for i, score in enumerate(scores):
                    if i < len(cat_questions) and score is not None:
                        question = cat_questions[i]
                        if question != "note":  # Salta colonne note
                            activity_data["categories"][cat_name][question] = float(score)
        
        processes_dict[process].append(activity_data)
    
    # Converti in formato finale
    for process, activities in processes_dict.items():
        frontend_data.append({
            "process": process,
            "activities": activities
        })
    
    return frontend_data

'''

# Inserisci prima dell'endpoint upload
insert_pos = content.find('@router.post("/upload-excel-model")')
content = content[:insert_pos] + converter_function + '\n' + content[insert_pos:]

# Modifica l'endpoint per usare il convertitore
old_save = '''        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(parsed_data, f, ensure_ascii=False, indent=2)'''

new_save = '''        # Converti nel formato frontend
        frontend_data = convert_parser_to_frontend_format(parsed_data)
        
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(frontend_data, f, ensure_ascii=False, indent=2)'''

content = content.replace(old_save, new_save)

with open('app/routers/admin.py', 'w') as f:
    f.write(content)

print("✅ Convertitore JSON aggiunto")
