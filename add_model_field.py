with open('app/models.py', 'r') as f:
    content = f.read()

# Trova la classe AssessmentSession e aggiungi il campo model_name dopo email
old_line = "    email = Column(Text, nullable=True)"
new_lines = """    email = Column(Text, nullable=True)
    model_name = Column(Text, nullable=True, default='i40_assessment_fto')  # Nome del modello JSON usato"""

content = content.replace(old_line, new_lines)

with open('app/models.py', 'w') as f:
    f.write(content)

print("✅ Campo model_name aggiunto a AssessmentSession")
