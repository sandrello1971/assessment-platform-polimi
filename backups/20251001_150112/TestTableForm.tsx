import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

interface ProcessData {
  process: string;
  activities: Array<{
    name: string;
    categories: {
      [category: string]: {
        [dimension: string]: number;
      };
    };
  }>;
}

interface Answer {
  process: string;
  activity: string;
  category: string;
  dimension: string;
  score: number;
  note?: string;
  is_not_applicable?: boolean;
}

const CATEGORIES = ['Governance', 'Monitoring & Control', 'Technology', 'Organization'];

const TestTableFormByCategory = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [processesData, setProcessesData] = useState<ProcessData[]>([]);
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, Answer>>(new Map());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const questionsRes = await axios.get('/i40_assessment_fto.json');
        const validProcesses = questionsRes.data.filter((p: ProcessData) => 
          p.activities && p.activities.length > 0
        );
        setProcessesData(validProcesses);

        try {
          const resultsRes = await axios.get(`/api/assessment/${sessionId}/results`);
          if (resultsRes.data && resultsRes.data.length > 0) {
            const existingAnswers = new Map();
            resultsRes.data.forEach((result: any) => {
              const key = `${result.process}|${result.activity}|${result.category}|${result.dimension}`;
              existingAnswers.set(key, {
                process: result.process,
                activity: result.activity,
                category: result.category,
                dimension: result.dimension,
                score: result.score,
                note: result.note || '',
                is_not_applicable: result.is_not_applicable || false
              });
            });
            setAnswers(existingAnswers);
          }
        } catch (err) {
          console.log('Nessun risultato esistente');
        }
        setLoading(false);
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    };
    loadData();
  }, [sessionId]);

  const createKey = (process: string, activity: string, category: string, dimension: string) => {
    return `${process}|${activity}|${category}|${dimension}`;
  };

  const handleScoreChange = (process: string, activity: string, category: string, dimension: string, score: number) => {
    const key = createKey(process, activity, category, dimension);
    const updated = new Map(answers);
    const existing = answers.get(key) || { process, activity, category, dimension, score: 0, note: '', is_not_applicable: false };
    updated.set(key, { ...existing, score });
    setAnswers(updated);
  };

  const handleNoteChange = (process: string, activity: string, category: string, dimension: string, note: string) => {
    const key = createKey(process, activity, category, dimension);
    const updated = new Map(answers);
    const existing = answers.get(key) || { process, activity, category, dimension, score: 0, is_not_applicable: false };
    updated.set(key, { ...existing, note });
    setAnswers(updated);
  };

  const handleNotApplicableToggle = (process: string, activity: string, category: string, dimension: string) => {
    const key = createKey(process, activity, category, dimension);
    const updated = new Map(answers);
    const existing = answers.get(key) || { process, activity, category, dimension, score: 0, note: '', is_not_applicable: false };
    updated.set(key, { ...existing, is_not_applicable: !existing.is_not_applicable, score: !existing.is_not_applicable ? 0 : existing.score });
    setAnswers(updated);
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const results = Array.from(answers.values());
      await axios.post(`/api/assessment/${sessionId}/submit`, results);
      alert('Assessment completato!');
      navigate(`/results/${sessionId}`);
    } catch (error) {
      console.error(error);
      alert('Errore invio');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Caricamento...</div>;
  if (processesData.length === 0) return <div className="p-8 text-center">Nessun dato</div>;

  const currentCategory = CATEGORIES[currentCategoryIndex];
  const progressPercentage = ((currentCategoryIndex + 1) / CATEGORIES.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Assessment Digitale 4.0 - {currentCategory}</h1>
          <p className="text-gray-600 mb-4">Dimensione {currentCategoryIndex + 1} di {CATEGORIES.length}</p>
          <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
            <div className="bg-blue-500 h-3 rounded-full transition-all duration-500" style={{ width: `${progressPercentage}%` }} />
          </div>
          <p className="text-gray-500 text-sm text-right">{Math.round(progressPercentage)}% completato</p>
        </div>

        {processesData.map((process, procIdx) => {
          const processActivities = process.activities.filter(activity => 
            activity.categories && activity.categories[currentCategory]
          );
          if (processActivities.length === 0) return null;

          const processDimensions = new Set<string>();
          processActivities.forEach(activity => {
            if (activity.categories[currentCategory]) {
              Object.keys(activity.categories[currentCategory]).forEach(d => processDimensions.add(d));
            }
          });
          const processDimensionsArray = Array.from(processDimensions);

          return (
            <div key={procIdx} className="bg-white rounded-xl shadow-lg p-8 border border-gray-200 mb-8">
              <div className="flex justify-between items-center mb-6 pb-3 border-b-2 border-blue-500">
                <button
                  onClick={() => setCurrentCategoryIndex(Math.max(0, currentCategoryIndex - 1))}
                  disabled={currentCategoryIndex === 0}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 disabled:opacity-30 disabled:cursor-not-allowed text-gray-800 rounded-lg font-semibold transition"
                >
                  ← {currentCategoryIndex > 0 ? CATEGORIES[currentCategoryIndex - 1] : ''}
                </button>
                <h2 className="text-2xl font-bold text-gray-800">{process.process}</h2>
                <button
                  onClick={() => setCurrentCategoryIndex(Math.min(CATEGORIES.length - 1, currentCategoryIndex + 1))}
                  disabled={currentCategoryIndex === CATEGORIES.length - 1}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 disabled:opacity-30 disabled:cursor-not-allowed text-gray-800 rounded-lg font-semibold transition"
                >
                  {currentCategoryIndex < CATEGORIES.length - 1 ? CATEGORIES[currentCategoryIndex + 1] : ''} →
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-blue-500">
                      <th className="border border-gray-300 px-3 py-2 text-left text-white font-semibold min-w-[150px]">Attività</th>
                      {processDimensionsArray.map((dim) => (
                        <th key={dim} className="border border-gray-300 px-2 py-2 text-center text-white font-semibold min-w-[100px]">
                          <div className="text-xs leading-tight">{dim.substring(0, 80)}</div>
                        </th>
                      ))}
                      <th className="border border-gray-300 px-3 py-2 text-center text-white font-semibold min-w-[250px]">Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processActivities.map((activity, actIdx) => {
                      const row = { process: process.process, activityName: activity.name, dimensions: Object.keys(activity.categories[currentCategory]) };
                      return (
                        <tr key={actIdx} className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-3 py-2 text-gray-800 font-medium bg-white">{row.activityName}</td>
                          {processDimensionsArray.map(dim => {
                            const key = createKey(row.process, row.activityName, currentCategory, dim);
                            const answer = answers.get(key);
                            const hasDimension = row.dimensions.includes(dim);
                            if (!hasDimension) {
                              return <td key={dim} className="border border-gray-300 px-2 py-2 text-center bg-gray-100"><span className="text-gray-400 text-xs">-</span></td>;
                            }
                            return (
                              <td key={dim} className="border border-gray-300 px-2 py-2 text-center bg-white">
                                <div className="flex flex-col items-center gap-2">
                                  <input type="number" min="0" max="5" value={answer?.score || 0} disabled={answer?.is_not_applicable}
                                    onChange={(e) => handleScoreChange(row.process, row.activityName, currentCategory, dim, Number(e.target.value))}
                                    className={`w-full max-w-[60px] mx-auto px-2 py-1 text-center ${answer?.is_not_applicable ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-gray-50 text-gray-800'} border border-gray-300 rounded focus:ring-2 focus:ring-blue-400`} />
                                  <label className="flex items-center gap-1 text-xs text-gray-600 cursor-pointer">
                                    <input type="checkbox" checked={answer?.is_not_applicable || false}
                                      onChange={() => handleNotApplicableToggle(row.process, row.activityName, currentCategory, dim)} className="w-3 h-3" />
                                    N/A
                                  </label>
                                </div>
                              </td>
                            );
                          })}
                          <td className="border border-gray-300 px-3 py-2 bg-white">
                            <textarea placeholder="Note..." rows={2}
                              value={answers.get(createKey(row.process, row.activityName, currentCategory, processDimensionsArray[0]))?.note || ''}
                              onChange={(e) => handleNoteChange(row.process, row.activityName, currentCategory, processDimensionsArray[0], e.target.value)}
                              className="w-full min-w-[200px] px-3 py-2 bg-gray-50 border border-gray-300 rounded text-gray-800 text-sm focus:ring-2 focus:ring-blue-400 resize-none" />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}

        <div className="flex justify-between items-center">
          <button onClick={() => setCurrentCategoryIndex(Math.max(0, currentCategoryIndex - 1))} disabled={currentCategoryIndex === 0}
            className="px-6 py-3 bg-gray-300 hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed text-gray-800 rounded-lg font-semibold transition">
            Precedente
          </button>
          {currentCategoryIndex < CATEGORIES.length - 1 ? (
            <button onClick={() => setCurrentCategoryIndex(currentCategoryIndex + 1)}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition">Successivo</button>
          ) : (
            <button onClick={handleSubmit} disabled={submitting}
              className="px-6 py-3 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white rounded-lg font-semibold transition">
              {submitting ? 'Invio...' : 'Completa Assessment'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestTableFormByCategory;
