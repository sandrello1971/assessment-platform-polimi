import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface CompanyData {
  azienda_nome: string;
  settore: string;
  dimensione: string;
  referente: string;
  email: string;
  user_id?: string;
  company_id?: number;
  model_name?: string;
}

const CompanyForm = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState<CompanyData>({
    azienda_nome: '',
    settore: '',
    dimensione: '',
    referente: '',
    email: '',
    user_id: '',
    company_id: undefined
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [assessmentMode, setAssessmentMode] = useState<'manual' | 'ai'>('manual');
  const [models, setModels] = useState<Array<{name: string; filename: string; is_default: boolean}>>([]);

  useEffect(() => {
    axios.get('/api/admin/list-models')
      .then(res => setModels(res.data.models))
      .catch(err => console.error('Errore caricamento modelli:', err));
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'company_id' ? (value ? Number(value) : undefined) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.azienda_nome.trim()) {
      setError('Il nome dell\'azienda è obbligatorio');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await axios.post('/api/assessment/session', {
        azienda_nome: formData.azienda_nome,
        settore: formData.settore,
        dimensione: formData.dimensione,
        referente: formData.referente,
        email: formData.email,
        user_id: formData.user_id || undefined,
        company_id: formData.company_id || undefined,
        model_name: formData.model_name || 'i40_assessment_fto'
      });
      
      const sessionId = response.data.id;
      if (assessmentMode === 'ai') {
        navigate(`/ai-interview/${sessionId}`);
      } else {
        navigate(`/assessment/${sessionId}`);
      }
      
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 500) {
          setError('Errore del server. Verifica che il database sia configurato correttamente.');
        } else if (error.response?.status === 404) {
          setError('Endpoint non trovato. Verifica che l\'API sia attiva.');
        } else {
          setError(`Errore ${error.response?.status}: ${error.response?.data?.detail || 'Errore sconosciuto'}`);
        }
      } else {
        setError('Errore di connessione. Verifica la tua connessione internet.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="absolute inset-0 overflow-hidden"></div>

      <div className="relative min-h-screen flex items-center justify-center p-8">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-gray-800 mb-4">
              Nuovo Assessment
            </h1>
            <p className="text-gray-600 text-xl">
              Inizia il tuo viaggio verso la digitalizzazione 4.0
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-blue-500 px-8 py-8 text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-blue-500/20"></div>
              <div className="absolute top-0 left-0 w-40 h-40 bg-white/5 rounded-full -ml-20 -mt-20"></div>
              <div className="relative z-10 text-center">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-4xl">🏢</span>
                </div>
                <h2 className="text-3xl font-bold mb-2">
                  Dati Azienda
                </h2>
                <p className="text-white/90">Inserisci le informazioni della tua azienda per iniziare</p>
              </div>
            </div>

            <div className="p-8">
              {error && (
                <div className="mb-8 p-4 bg-red-100 border border-red-300 text-red-800 rounded-xl flex items-center">
                  <span className="text-2xl mr-3">⚠️</span>
                  <div>
                    <p className="font-medium">Errore</p>
                    <p className="text-sm">{error}</p>
                  </div>
                </div>
              )}

              {/* Scelta Modalità */}
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

              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                    <span className="text-2xl mr-3">📝</span>
                    Informazioni Principali
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-gray-700 font-medium mb-3">
                        Nome Azienda *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          name="azienda_nome"
                          value={formData.azienda_nome}
                          onChange={handleInputChange}
                          className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-4 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Inserisci il nome dell'azienda"
                          required
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                          <span className="text-gray-400">🏢</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-gray-700 font-medium mb-3">
                        Settore
                      </label>
                      <div className="relative">
                        <select
                          name="settore"
                          value={formData.settore}
                          onChange={handleInputChange}
                          className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-4 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                        >
                          <option value="">Seleziona settore</option>
                          <option value="Manifatturiero">Manifatturiero</option>
                          <option value="Automotive">Automotive</option>
                          <option value="Alimentare">Alimentare</option>
                          <option value="Tessile">Tessile</option>
                          <option value="Chimico">Chimico</option>
                          <option value="Farmaceutico">Farmaceutico</option>
                          <option value="Elettronico">Elettronico</option>
                          <option value="Metalmeccanico">Metalmeccanico</option>
                          <option value="Turismo">Turismo</option>
                          <option value="Altro">Altro</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                          <span className="text-gray-400">▼</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-gray-700 font-medium mb-3">
                        Dimensione Azienda
                      </label>
                      <div className="relative">
                        <select
                          name="dimensione"
                          value={formData.dimensione}
                          onChange={handleInputChange}
                          className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-4 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                        >
                          <option value="">Seleziona dimensione</option>
                          <option value="Micro (1-9 dipendenti)">Micro (1-9 dipendenti)</option>
                          <option value="Piccola (10-49 dipendenti)">Piccola (10-49 dipendenti)</option>
                          <option value="Media (50-249 dipendenti)">Media (50-249 dipendenti)</option>
                          <option value="Grande (250+ dipendenti)">Grande (250+ dipendenti)</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                          <span className="text-gray-400">▼</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-gray-700 font-medium mb-3">
                        Referente
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          name="referente"
                          value={formData.referente}
                          onChange={handleInputChange}
                          className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-4 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Nome del referente"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                          <span className="text-gray-400">👤</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-gray-700 font-medium mb-3">
                        Email
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-4 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="email@azienda.com"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                          <span className="text-gray-400">📧</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Selezione Modello */}
                  <div>
                    <label className="block text-gray-700 font-medium mb-3">
                      Modello di Assessment
                    </label>
                    <div className="relative">
                      <select
                        name="model_name"
                        value={formData.model_name || "i40_assessment_fto"}
                        onChange={handleInputChange}
                        className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-4 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                      >
                        {models.map((model) => (
                          <option key={model.name} value={model.name}>
                            {model.name} {model.is_default ? "(Default)" : ""}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                        <span className="text-gray-400">📋</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">Seleziona il modello di valutazione</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-8">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="group flex-1 bg-blue-500 text-white py-4 px-8 rounded-2xl hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-bold shadow-2xl"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent mr-3"></div>
                        Creazione in corso...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <span className="mr-3 text-2xl group-hover:rotate-12 transition-transform duration-300">🚀</span>
                        {assessmentMode === 'ai' ? 'Continua con AI 🤖' : 'Inizia Assessment'}
                      </div>
                    )}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => navigate('/dashboard')}
                    className="group bg-gray-200 text-gray-800 py-4 px-8 rounded-2xl hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all duration-300 font-medium"
                  >
                    <span className="mr-2 group-hover:rotate-12 transition-transform duration-300">←</span>
                    Torna alla Dashboard
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="text-center mt-8">
            <p className="text-gray-500 text-sm">
              Assessment Digitale 4.0 • Trasformazione digitale per il manifatturiero
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyForm;
