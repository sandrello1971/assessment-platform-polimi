import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface SessionEntry {
  id: string;
  creato_il: string;
  user_id?: string;
  company_id?: number;
  azienda_nome: string;
  settore?: string;
  dimensione?: string;
  referente?: string;
}

// ✅ INTERFACCIA CORRETTA - Basata sul modello database reale
interface AssessmentResult {
  id: string;
  session_id: string;
  process: string;
  category: string;
  dimension: string;
  score: number;              // ✅ Corretto: 'score' non 'answer'
  note?: string;
  is_not_applicable: boolean; // ✅ Aggiunto campo mancante
}

const Dashboard = () => {
  const [sessions, setSessions] = useState<SessionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageScore, setAverageScore] = useState<number | null>(null);
  const [completedAssessments, setCompletedAssessments] = useState<number>(0);
  const navigate = useNavigate();

  // ✅ FUNZIONE CORRETTA per calcolare la media dei punteggi
  const calculateAverageScore = async () => {
    try {
      let totalScore = 0;
      let totalSessions = 0;
      let completedCount = 0;

      console.log('🔄 Calcolando media per', sessions.length, 'sessioni...');

      // Per ogni sessione, prendi i risultati e calcola la media
      for (const session of sessions) {
        try {
          const response = await axios.get(`/api/assessment/${session.id}/results`);
          const results: AssessmentResult[] = response.data;
          
          console.log(`📊 Sessione ${session.azienda_nome}:`, results.length, 'risultati totali');
          
          if (results.length > 0) {
            // ✅ Filtra solo i risultati applicabili
            const applicableResults = results.filter(r => !r.is_not_applicable);
            
            console.log(`   📈 Risultati applicabili:`, applicableResults.length);
            
            if (applicableResults.length > 0) {
              // ✅ Usa 'score' invece di 'answer'
              const sessionScore = applicableResults.reduce((sum, result) => sum + result.score, 0) / applicableResults.length;
              console.log(`   ⭐ Media sessione:`, sessionScore.toFixed(2));
              
              totalScore += sessionScore;
              totalSessions++;
              completedCount++;
            }
          } else {
            console.log(`   ⚠️ Nessun risultato per ${session.azienda_nome}`);
          }
        } catch (error) {
          console.warn(`❌ Errore nel caricamento risultati per sessione ${session.azienda_nome}:`, error);
        }
      }

      console.log('📊 Totale:', {
        totalSessions,
        totalScore: totalScore.toFixed(2),
        completedCount
      });

      // ✅ Aggiorna stati
      setCompletedAssessments(completedCount);
      
      if (totalSessions > 0) {
        const finalAverage = totalScore / totalSessions;
        console.log('✅ Media finale:', finalAverage.toFixed(2));
        setAverageScore(finalAverage);
      } else {
        console.log('⚠️ Nessuna sessione completata');
        setAverageScore(null);
      }
    } catch (error) {
      console.error('💥 Errore nel calcolo della media:', error);
      setAverageScore(null);
      setCompletedAssessments(0);
    }
  };

  useEffect(() => {
    axios.get('/api/assessment/sessions')
      .then(res => {
        if (Array.isArray(res.data)) {
          console.log('✅ Caricate', res.data.length, 'sessioni');
          setSessions(res.data);
        } else {
          console.warn("⚠️ Risposta inattesa:", res.data);
          setSessions([]);
        }
      })
      .catch(err => {
        console.error("💥 Errore nel caricamento delle sessioni:", err);
        setSessions([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Calcola la media quando le sessioni sono caricate
  useEffect(() => {
    if (sessions.length > 0) {
      calculateAverageScore();
    } else {
      setAverageScore(null);
      setCompletedAssessments(0);
    }
  }, [sessions]);

  const deleteAssessment = async (sessionId: string, companyName: string) => {
    if (!window.confirm(`⚠️ Sei sicuro di voler cancellare l'assessment di "${companyName}"?\n\nQuesta operazione è irreversibile!`)) {
      return;
    }

    try {
      await axios.delete(`/api/assessment/${sessionId}`);
      alert(`✅ Assessment "${companyName}" cancellato con successo!`);
      
      // Rimuovi dalla lista locale
      setSessions(sessions.filter(s => s.id !== sessionId));
    } catch (error) {
      console.error('💥 Errore cancellazione:', error);
      alert('❌ Errore durante la cancellazione. Riprova.');
    }
  };

  const getStatusColor = (date: string) => {
    const daysSince = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSince < 1) return 'from-emerald-500 to-emerald-600';
    if (daysSince < 7) return 'from-blue-500 to-blue-600';
    if (daysSince < 30) return 'from-amber-500 to-amber-600';
    return 'from-gray-500 to-gray-600';
  };

  const getStatusText = (date: string) => {
    const daysSince = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSince < 1) return 'Oggi';
    if (daysSince < 7) return `${daysSince}g fa`;
    if (daysSince < 30) return `${Math.floor(daysSince/7)}s fa`;
    return `${Math.floor(daysSince/30)}m fa`;
  };

  // ✅ Formattiamo la media con gestione casi edge
  const formatAverageScore = (score: number | null) => {
    if (score === null) {
      if (sessions.length === 0) {
        return '---'; // Nessuna sessione
      } else {
        return 'In corso'; // Sessioni esistono ma non completate
      }
    }
    return `${score.toFixed(1)}/5`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-40 left-1/2 w-60 h-60 bg-emerald-500 rounded-full mix-blend-multiply filter blur-xl opacity-15 animate-pulse animation-delay-4000"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent mb-4">
              Dashboard Assessment
            </h1>
            <p className="text-white/70 text-xl">
              Gestisci e monitora tutti i tuoi assessment digitali
            </p>
          </div>
          
          <button
            onClick={() => navigate('/company-form')}
            className="group bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-2xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 font-bold flex items-center shadow-2xl border border-white/30 hover:scale-105 hover:shadow-blue-500/25"
          >
            <span className="mr-3 text-2xl group-hover:rotate-12 transition-transform duration-300">➕</span>
            Nuovo Assessment
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="group relative overflow-hidden bg-white/10 backdrop-blur-lg rounded-3xl p-6 text-white shadow-2xl border border-white/20 transform hover:scale-105 transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-sm font-medium uppercase tracking-wider">Assessment Totali</p>
                  <p className="text-4xl font-bold mt-2">{sessions.length}</p>
                  <div className="w-16 h-1 bg-blue-300 rounded mt-3"></div>
                </div>
                <div className="text-5xl opacity-80 group-hover:scale-110 transition-transform duration-300">📊</div>
              </div>
            </div>
          </div>

          {/* ✅ AGGIORNATO: Mostra assessment completati invece di "oggi" */}
          <div className="group relative overflow-hidden bg-white/10 backdrop-blur-lg rounded-3xl p-6 text-white shadow-2xl border border-white/20 transform hover:scale-105 transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-sm font-medium uppercase tracking-wider">Completati Oggi</p>
                  <p className="text-4xl font-bold mt-2">{completedAssessments}</p>
                  <div className="w-16 h-1 bg-emerald-300 rounded mt-3"></div>
                  {completedAssessments === 0 && sessions.length > 0 && (
                    <p className="text-white/50 text-xs mt-2">Assessment in corso</p>
                  )}
                </div>
                <div className="text-5xl opacity-80 group-hover:scale-110 transition-transform duration-300">🚀</div>
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden bg-white/10 backdrop-blur-lg rounded-3xl p-6 text-white shadow-2xl border border-white/20 transform hover:scale-105 transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-sm font-medium uppercase tracking-wider">Media Punteggio</p>
                  <p className="text-4xl font-bold mt-2">
                    {formatAverageScore(averageScore)}
                  </p>
                  <div className="w-16 h-1 bg-purple-300 rounded mt-3"></div>
                  {/* ✅ MESSAGGI INFORMATIVI MIGLIORATI */}
                  {sessions.length === 0 && (
                    <p className="text-white/50 text-xs mt-2">Nessun dato disponibile</p>
                  )}
                  {sessions.length > 0 && averageScore === null && (
                    <p className="text-white/50 text-xs mt-2">Assessment non completati</p>
                  )}
                  {averageScore !== null && (
                    <p className="text-white/50 text-xs mt-2">Su {completedAssessments} completati</p>
                  )}
                </div>
                <div className="text-5xl opacity-80 group-hover:scale-110 transition-transform duration-300">🎯</div>
              </div>
            </div>
          </div>
        </div>

        {/* Sessions Section */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-800 via-purple-800 to-slate-800 px-8 py-6 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/30 to-purple-600/30"></div>
            <div className="absolute top-0 left-0 w-40 h-40 bg-white/5 rounded-full -ml-20 -mt-20"></div>
            <div className="relative z-10">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                📋 Sessioni Assessment
              </h2>
              <p className="text-white/80 mt-2">Gestisci tutti i tuoi assessment aziendali</p>
            </div>
          </div>

          <div className="p-8">
            {loading ? (
              <div className="text-center py-16">
                <div className="relative">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-white/30 border-t-white mx-auto mb-6"></div>
                  <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-transparent border-t-blue-500 mx-auto animate-spin animation-delay-1000"></div>
                </div>
                <p className="text-white/80 text-lg font-medium">Caricamento sessioni...</p>
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-8">
                  <span className="text-6xl opacity-60">📝</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Nessun Assessment Trovato</h3>
                <p className="text-white/70 mb-8 text-lg">Inizia creando il tuo primo assessment digitale</p>
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => navigate('/company-form')}
                    className="group bg-gradient-to-r from-blue-500 to-purple-600 text-white px-10 py-4 rounded-2xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 font-bold shadow-2xl border border-white/30 hover:scale-105"
                  >
                    <span className="mr-3 text-xl group-hover:rotate-12 transition-transform duration-300">🏢</span>
                    Assessment Completo
                  </button>
                  <button
                    onClick={() => navigate('/quick-assessment')}
                    className="group bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-10 py-4 rounded-2xl hover:from-emerald-600 hover:to-emerald-700 transition-all duration-300 font-bold shadow-2xl border border-white/30 hover:scale-105"
                  >
                    <span className="mr-3 text-xl group-hover:rotate-12 transition-transform duration-300">⚡</span>
                    Quick Start
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {sessions.map((session, index) => (
                  <div
                    key={session.id}
                    className="group bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 overflow-hidden hover:bg-white/15 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-6 items-center">
                          {/* Company Info */}
                          <div className="md:col-span-2">
                            <h3 className="text-xl font-bold text-white mb-1">{session.azienda_nome}</h3>
                            <div className="flex items-center space-x-4 text-sm text-white/70">
                              <span className="flex items-center">
                                <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                                {session.settore || 'Non specificato'}
                              </span>
                              <span className="flex items-center">
                                <span className="w-2 h-2 bg-emerald-400 rounded-full mr-2"></span>
                                {session.dimensione || 'N/A'}
                              </span>
                            </div>
                          </div>

                          {/* Contact */}
                          <div>
                            <p className="text-white/70 text-sm uppercase tracking-wider mb-1">Referente</p>
                            <p className="text-white font-medium">{session.referente || 'Non specificato'}</p>
                          </div>

                          {/* Date */}
                          <div>
                            <p className="text-white/70 text-sm uppercase tracking-wider mb-1">Data</p>
                            <p className="text-white font-medium">
                              {session.creato_il ? new Date(session.creato_il).toLocaleDateString('it-IT') : 'N/A'}
                            </p>
                          </div>

                          {/* Status Badge */}
                          <div className="flex justify-end">
                            <span className={`px-4 py-2 rounded-full text-xs font-bold text-white bg-gradient-to-r ${session.creato_il ? getStatusColor(session.creato_il) : 'from-gray-500 to-gray-600'} shadow-lg`}>
                              {session.creato_il ? getStatusText(session.creato_il) : 'N/A'}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-3 ml-6">
                          <button
                            onClick={() => navigate(`/results/${session.id}`)}
                            className="group bg-gradient-to-r from-blue-500 to-blue-600 text-white px-5 py-3 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 font-medium shadow-lg border border-white/30 hover:scale-105"
                          >
                            <span className="mr-2 group-hover:rotate-12 transition-transform duration-300">📊</span>
                            Risultati
                          </button>
                          
                          <button
                            onClick={() => navigate(`/assessment/${session.id}`)}
                            className="group bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-5 py-3 rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all duration-300 font-medium shadow-lg border border-white/30 hover:scale-105"
                          >
                            <span className="mr-2 group-hover:rotate-12 transition-transform duration-300">▶️</span>
                            Continua
                          </button>

                          <button
                            onClick={() => deleteAssessment(session.id, session.azienda_nome)}
                            className="group bg-gradient-to-r from-red-500 to-red-600 text-white px-5 py-3 rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-300 font-medium shadow-lg border border-white/30 hover:scale-105"
                          >
                            <span className="mr-2 group-hover:rotate-12 transition-transform duration-300">🗑️</span>
                            Elimina
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <p className="text-white/50 text-sm">
            Assessment Digitale 4.0 • Powered by{' '}
            <span className="text-blue-400 font-medium">AI Intelligence</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
