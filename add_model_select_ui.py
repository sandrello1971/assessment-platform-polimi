with open('frontend/src/pages/CompanyForm.tsx', 'r') as f:
    content = f.read()

# Trova dove inserire il campo (dopo il campo email)
# Cerchiamo il blocco email
email_block = '''              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                placeholder="Email"
              />
            </div>'''

# Aggiungi il campo modello dopo email
model_field = '''              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                placeholder="Email"
              />
            </div>

            {/* Modello Assessment */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                📋 Modello di Assessment
              </label>
              <select
                value={formData.model_name || 'i40_assessment_fto'}
                onChange={(e) => setFormData({ ...formData, model_name: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all bg-white"
              >
                {models.map((model) => (
                  <option key={model.name} value={model.name}>
                    {model.name} {model.is_default ? '(Default)' : ''}
                  </option>
                ))}
              </select>
              <p className="text-sm text-gray-500 mt-1">
                Seleziona il modello di valutazione da utilizzare per questo assessment
              </p>
            </div>'''

content = content.replace(email_block, model_field)

with open('frontend/src/pages/CompanyForm.tsx', 'w') as f:
    f.write(content)

print("✅ Campo selezione modello aggiunto al form UI")
