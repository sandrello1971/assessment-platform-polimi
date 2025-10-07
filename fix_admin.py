with open('app/routers/admin.py', 'r') as f:
    content = f.read()

# Trova e sostituisci la funzione list_models
old_func = '''        models = []
        for json_file in json_files:
            with open(json_file, 'r') as f:
                data = json.load(f)
                models.append({
                    "name": json_file.stem,
                    "filename": json_file.name,
                    "processes_count": len(data.get("processes", [])),
                    "is_default": json_file.stem == "i40_assessment_fto"
                })'''

new_func = '''        models = []
        for json_file in json_files:
            try:
                with open(json_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    models.append({
                        "name": json_file.stem,
                        "filename": json_file.name,
                        "processes_count": len(data.get("processes", [])) if isinstance(data, dict) else 0,
                        "is_default": json_file.stem == "i40_assessment_fto"
                    })
            except Exception as e:
                print(f"Errore lettura {json_file.name}: {e}")
                continue'''

content = content.replace(old_func, new_func)

with open('app/routers/admin.py', 'w') as f:
    f.write(content)

print("✅ Fix applicato")
