#!/usr/bin/env python3

with open('frontend/src/pages/CompanyForm.tsx', 'r') as f:
    content = f.read()

# 1. Aggiungi stato per la modalità
old_state = "const [formData, setFormData] = useState({"
new_state = """const [assessmentMode, setAssessmentMode] = useState<'manual' | 'ai'>('manual');
  const [formData, setFormData] = useState({"""

content = content.replace(old_state, new_state)

# 2. Modifica handleSubmit per reindirizzare in base alla modalità
old_submit = """const sessionId = response.data.id;
      navigate(`/assessment/${sessionId}`);"""

new_submit = """const sessionId = response.data.id;
      if (assessmentMode === 'ai') {
        navigate(`/ai-interview/${sessionId}`);
      } else {
        navigate(`/assessment/${sessionId}`);
      }"""

content = content.replace(old_submit, new_submit)

# 3. Aggiungi sezione di scelta modalità prima del form
old_form_start = """              <form onSubmit={handleSubmit} className="space-y-8">"""

new_form_section = """              {/* Scelta Modalità */}
              <div className="mb-8 bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-8 border-2 border-purple-200">
                <h3 className="text-xl font-bold text-gray-800 mb-6 text-center">
                  🎯 Scegli come compilare l'Assessment
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Assessment Manuale */}
                  <div
                    onClick={() => setAssessmentMode('manual')}
                    className={`cursor-pointer p-6 rounded-xl border-2 transition-all ${
                      assessmentMode === 'manual'
                        ? 'border-blue-500 bg-blue-50 shadow-lg scale-105'
                        : 'border-gray-300 bg-white hover:border-blue-300'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-5xl mb-4">📝</div>
                      <h4 className="font-bold text-lg mb-2">Assessment Manuale</h4>
                      <p className="text-sm text-gray-600">
                        Compila le domande una per una in modo tradizionale
                      </p>
                    </div>
                  </div>

                  {/* AI Interview */}
                  <div
                    onClick={() => setAssessmentMode('ai')}
                    className={`cursor-pointer p-6 rounded-xl border-2 transition-all ${
                      assessmentMode === 'ai'
                        ? 'border-purple-500 bg-purple-50 shadow-lg scale-105'
                        : 'border-gray-300 bg-white hover:border-purple-300'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-5xl mb-4">🤖</div>
                      <h4 className="font-bold text-lg mb-2">AI Interview</h4>
                      <p className="text-sm text-gray-600">
                        Carica un'intervista e lascia che l'AI compili automaticamente
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">"""

content = content.replace(old_form_start, new_form_section)

# 4. Modifica il testo del bottone in base alla modalità
old_button_text = """Inizia Assessment"""
new_button_text = """{assessmentMode === 'ai' ? 'Continua con AI 🤖' : 'Inizia Assessment'}"""

content = content.replace(old_button_text, new_button_text)

with open('frontend/src/pages/CompanyForm.tsx', 'w') as f:
    f.write(content)

print("✅ CompanyForm modificato!")
