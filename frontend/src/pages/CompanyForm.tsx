import { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // ✅ Import corretto
import axios from 'axios'; // ✅ Import per API

interface CompanyData {
  azienda_nome: string;
  settore: string;
  dimensione: string;
  referente: string;
  email: string;
  user_id?: string;
  company_id?: number;
}

const CompanyForm = () => {
  const navigate = useNavigate(); // ✅ Hook di React Router
  
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
      console.log('🚀 Creando sessione con API reale:', formData);
      
      // ✅ CHIAMATA API REALE invece del mock
      const response = await axios.post('/api/assessment/session', {
        azienda_nome: formData.azienda_nome,
        settore: formData.settore,
        dimensione: formData.dimensione,
        referente: formData.referente,
        email: formData.email,
        user_id: formData.user_id || undefined,
        company_id: formData.company_id || undefined
      });
      
      const sessionId = response.data.id;
      console.log('✅ Sessione creata con successo:', sessionId);
      
      // ✅ NAVIGAZIONE REALE con React Router
      navigate(`/assessment/${sessionId}`);
      
    } catch (error: any) {
      console.error('💥 Errore nella creazione della sessione:', error);
      
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/3 left-1/4 w-60 h-60 bg-emerald-500 rounded-full mix-blend-multiply filter blur-xl opacity-15 animate-pulse animation-delay-4000"></div>
      </div>

      <div className="relative min-h-screen flex items-center justify-center p-8">
        <div className="w-full max-w-2xl">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent mb-4">
              Nuovo Assessment
            </h1>
            <p className="text-white/70 text-xl">
              Inizia il tuo viaggio verso la digitalizzazione 4.0
            </p>
          </div>

          {/* Main Form Card */}
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
            {/* Card Header */}
            <div className="bg-gradient-to-r from-slate-800 via-purple-800 to-slate-800 px-8 py-8 text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/30 to-purple-600/30"></div>
              <div className="absolute top-0 left-0 w-40 h-40 bg-white/5 rounded-full -ml-20 -mt-20"></div>
              <div className="relative z-10 text-center">
                <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-4xl">🏢</span>
                </div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent mb-2">
                  Dati Azienda
                </h2>
                <p className="text-white/80">Inserisci le informazioni della tua azienda per iniziare</p>
              </div>
            </div>

            {/* Form Content */}
            <div className="p-8">
              {error && (
                <div className="mb-8 p-4 bg-red-500/20 backdrop-blur-sm border border-red-400/30 text-red-200 rounded-2xl flex items-center">
                  <span className="text-2xl mr-3">⚠️</span>
                  <div>
                    <p className="font-medium">Errore</p>
                    <p className="text-sm opacity-90">{error}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Dati Principali */}
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                    <span className="text-2xl mr-3">📝</span>
                    Informazioni Principali
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Nome Azienda */}
                    <div className="md:col-span-2">
                      <label className="block text-white/80 font-medium mb-3">
                        Nome Azienda *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          name="azienda_nome"
                          value={formData.azienda_nome}
                          onChange={handleInputChange}
                          className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          placeholder="Inserisci il nome dell'azienda"
                          required
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                          <span className="text-white/30">🏢</span>
                        </div>
                      </div>
                    </div>

                    {/* Settore */}
                    <div>
                      <label className="block text-white/80 font-medium mb-3">
                        Settore
                      </label>
                      <div className="relative">
                        <select
                          name="settore"
                          value={formData.settore}
                          onChange={handleInputChange}
                          className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 appearance-none"
                        >
                          <option value="" className="bg-slate-800 text-white">Seleziona settore</option>
                          <option value="Manifatturiero" className="bg-slate-800 text-white">Manifatturiero</option>
                          <option value="Automotive" className="bg-slate-800 text-white">Automotive</option>
                          <option value="Alimentare" className="bg-slate-800 text-white">Alimentare</option>
                          <option value="Tessile" className="bg-slate-800 text-white">Tessile</option>
                          <option value="Chimico" className="bg-slate-800 text-white">Chimico</option>
                          <option value="Farmaceutico" className="bg-slate-800 text-white">Farmaceutico</option>
                          <option value="Elettronico" className="bg-slate-800 text-white">Elettronico</option>
                          <option value="Metalmeccanico" className="bg-slate-800 text-white">Metalmeccanico</option>
                          <option value="Turismo" className="bg-slate-800 text-white">Turismo</option>
                          <option value="Altro" className="bg-slate-800 text-white">Altro</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                          <span className="text-white/50">▼</span>
                        </div>
                      </div>
                    </div>

                    {/* Dimensione */}
                    <div>
                      <label className="block text-white/80 font-medium mb-3">
                        Dimensione Azienda
                      </label>
                      <div className="relative">
                        <select
                          name="dimensione"
                          value={formData.dimensione}
                          onChange={handleInputChange}
                          className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 appearance-none"
                        >
                          <option value="" className="bg-slate-800 text-white">Seleziona dimensione</option>
                          <option value="Micro (1-9 dipendenti)" className="bg-slate-800 text-white">Micro (1-9 dipendenti)</option>
                          <option value="Piccola (10-49 dipendenti)" className="bg-slate-800 text-white">Piccola (10-49 dipendenti)</option>
                          <option value="Media (50-249 dipendenti)" className="bg-slate-800 text-white">Media (50-249 dipendenti)</option>
                          <option value="Grande (250+ dipendenti)" className="bg-slate-800 text-white">Grande (250+ dipendenti)</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                          <span className="text-white/50">▼</span>
                        </div>
                      </div>
                    </div>

                    {/* Referente */}
                    <div>
                      <label className="block text-white/80 font-medium mb-3">
                        Referente
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          name="referente"
                          value={formData.referente}
                          onChange={handleInputChange}
                          className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          placeholder="Nome del referente"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                          <span className="text-white/30">👤</span>
                        </div>
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-white/80 font-medium mb-3">
                        Email
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          placeholder="email@azienda.com"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                          <span className="text-white/30">📧</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sezione Opzionali */}
                <div className="border-t border-white/20 pt-8">
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                    <span className="text-2xl mr-3">⚙️</span>
                    Campi Opzionali
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* ID Utente */}
                    <div>
                      <label className="block text-white/60 font-medium mb-3">
                        ID Utente
                      </label>
                      <input
                        type="text"
                        name="user_id"
                        value={formData.user_id}
                        onChange={handleInputChange}
                        className="w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-4 text-white/80 placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                        placeholder="ID utente (opzionale)"
                      />
                    </div>

                    {/* ID Azienda */}
                    <div>
                      <label className="block text-white/60 font-medium mb-3">
                        ID Azienda esistente
                      </label>
                      <input
                        type="number"
                        name="company_id"
                        value={formData.company_id || ''}
                        onChange={handleInputChange}
                        className="w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-4 text-white/80 placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                        placeholder="ID azienda esistente (opzionale)"
                      />
                    </div>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-8">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="group flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 px-8 rounded-2xl hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-bold shadow-2xl border border-white/30 hover:scale-105 hover:shadow-blue-500/25"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent mr-3"></div>
                        Creazione in corso...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <span className="mr-3 text-2xl group-hover:rotate-12 transition-transform duration-300">🚀</span>
                        Inizia Assessment
                      </div>
                    )}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => navigate('/dashboard')}
                    className="group bg-white/10 backdrop-blur-sm text-white py-4 px-8 rounded-2xl hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-300 font-medium border border-white/30 hover:scale-105"
                  >
                    <span className="mr-2 group-hover:rotate-12 transition-transform duration-300">←</span>
                    Torna alla Dashboard
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Bottom Info */}
          <div className="text-center mt-8">
            <p className="text-white/50 text-sm">
              Assessment Digitale 4.0 • Trasformazione digitale per il manifatturiero
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyForm;
