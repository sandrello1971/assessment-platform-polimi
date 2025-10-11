import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend, ResponsiveContainer } from 'recharts';

const CATEGORIES_ORDER = ["Governance", "Monitoring & Control", "Technology", "Organization"];

const getScoreIcon = (score: number | null | undefined) => {
  if (score === null || score === undefined) return <span className="text-gray-400">-</span>;
  if (score >= 4.0) return <span className="text-xl">✅</span>;
  if (score >= 3.0) return <span className="text-xl">🟢</span>;
  if (score >= 2.0) return <span className="text-xl">⭕</span>;
  if (score >= 1.0) return <span className="text-xl">🔴</span>;
  return <span className="text-xl">❌</span>;
};

const ResultsByCategoryPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiConclusions, setAiConclusions] = useState<string>('');

  useEffect(() => {
    axios.get(`/api/assessment/${id}/results`)
      .then(res => {
        setResults(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
    
    // Carica AI
    setLoadingAI(true);
    axios.get(`/api/assessment/${id}/ai-suggestions-enhanced?include_roadmap=true`)
      .then(res => {
        setAiConclusions(res.data.suggestions);
        setLoadingAI(false);
      })
      .catch(err => {
        console.error('AI suggestions error:', err);
        setLoadingAI(false);
      });
  }, [id]);

  if (loading) return <div className="p-8">Caricamento...</div>;

  // Organizza: categoria -> processo -> attività -> {dimensione: data}
  const organized: any = {};
  results.forEach(r => {
    if (!organized[r.category]) organized[r.category] = {};
    if (!organized[r.category][r.process]) organized[r.category][r.process] = {};
    if (!organized[r.category][r.process][r.activity]) organized[r.category][r.process][r.activity] = {};
    organized[r.category][r.process][r.activity][r.dimension] = {
      score: r.score,
      note: r.note,
      is_not_applicable: r.is_not_applicable
    };
  });

  const calculateRowAverage = (dimensions: any) => {
    let total = 0, count = 0;
    Object.values(dimensions).forEach((d: any) => {
      if (!d.is_not_applicable && d.score !== undefined && d.score !== null) {
        total += d.score;
        count++;
      }
    });
    return count > 0 ? total / count : null;
  };

  const calculateProcessAverage = (activities: any) => {
    const avgs: number[] = [];
    Object.values(activities).forEach((dims: any) => {
      const avg = calculateRowAverage(dims);
      if (avg !== null) avgs.push(avg);
    });
    return avgs.length > 0 ? (avgs.reduce((a,b) => a+b, 0) / avgs.length).toFixed(2) : 'N/A';
  };

  // Calcola per tabelle riassuntive
  const activityScores = new Map<string, any>();
  
  CATEGORIES_ORDER.forEach(cat => {
    if (!organized[cat]) return;
    
    Object.entries(organized[cat]).forEach(([process, activities]: [string, any]) => {
      Object.entries(activities).forEach(([activity, dimensions]: [string, any]) => {
        const key = `${process}|||${activity}`;
        
        if (!activityScores.has(key)) {
          activityScores.set(key, {
            process,
            activity,
            governance: null,
            monitoring: null,
            technology: null,
            organization: null,
            note: ''
          });
        }
        
        const item = activityScores.get(key);
        const avg = calculateRowAverage(dimensions);
        
        if (!item.note) {
          const noteObj = Object.values(dimensions).find((d: any) => d?.note);
          if (noteObj) item.note = (noteObj as any).note || '';
        }
        
        if (cat === 'Governance') item.governance = avg;
        else if (cat === 'Monitoring & Control') item.monitoring = avg;
        else if (cat === 'Technology') item.technology = avg;
        else if (cat === 'Organization') item.organization = avg;
      });
    });
  });
  
  const allActivities = Array.from(activityScores.values());
  
  allActivities.forEach(act => {
    const scores = [act.governance, act.monitoring, act.technology, act.organization]
      .filter(s => s !== null && s !== undefined && !isNaN(s));
    act.processRating = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
  });

  const critici = allActivities.filter(a => {
    const scores = [a.governance, a.monitoring, a.technology, a.organization];
    return scores.some(s => s !== null && s !== undefined && s < 2.0);
  }).sort((a, b) => {
    // Prima ordina per processo
    if (a.process !== b.process) return a.process.localeCompare(b.process);
    // Poi per rating
    return (a.processRating || 0) - (b.processRating || 0);
  });

  const debolezza = allActivities.filter(a => {
    const scores = [a.governance, a.monitoring, a.technology, a.organization];
    return scores.some(s => s !== null && s !== undefined && s >= 2.0 && s < 3.0);
  }).sort((a, b) => {
    if (a.process !== b.process) return a.process.localeCompare(b.process);
    return (a.processRating || 0) - (b.processRating || 0);
  });

  const forza = allActivities.filter(a => {
    const scores = [a.governance, a.monitoring, a.technology, a.organization];
    return scores.some(s => s !== null && s !== undefined && s >= 3.0);
  }).sort((a, b) => {
    if (a.process !== b.process) return a.process.localeCompare(b.process);
    return (b.processRating || 0) - (a.processRating || 0);
  });

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-6">Risultati Assessment Digitale 4.0</h1>
          <div className="flex justify-between items-center">
            <div className="bg-blue-500 text-white px-6 py-3 rounded-lg">
              <span className="text-sm font-semibold">FINAL RATE:</span>
              <span className="text-2xl font-bold ml-2">
                {(() => {
                  const allAvgs: number[] = [];
                  CATEGORIES_ORDER.forEach(cat => {
                    Object.values(organized[cat] || {}).forEach((activities: any) => {
                      Object.values(activities).forEach((dims: any) => {
                        const avg = calculateRowAverage(dims);
                        if (avg !== null) allAvgs.push(avg);
                      });
                    });
                  });
                  return allAvgs.length > 0 ? (allAvgs.reduce((a,b) => a+b, 0) / allAvgs.length).toFixed(2) : 'N/A';
                })()}
              </span>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="px-6 py-3 bg-gray-300 hover:bg-gray-400 rounded-lg font-semibold"
              >
                Torna alla Dashboard
              </button>
            </div>
          </div>
        </div>

        {/* Tabelle Riassuntive */}
        <div className="mb-12 space-y-8">
          {/* Punti di Forza */}
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-green-600 text-white px-4 py-2 rounded-lg">
                <span className="font-bold">&gt;= 3.00</span>
              </div>
              <h3 className="text-2xl font-bold">PUNTI DI FORZA ({forza.length})</h3>
            </div>
            {forza.length > 0 ? (
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-green-600 text-white">
                    <th className="border px-3 py-2 text-left">Processo</th>
                    <th className="border px-3 py-2 text-left">Sottoprocesso</th>
                    <th className="border px-3 py-2 text-center">Governance</th>
                    <th className="border px-3 py-2 text-center">M&C</th>
                    <th className="border px-3 py-2 text-center">Technology</th>
                    <th className="border px-3 py-2 text-center">Organization</th>
                    <th className="border px-3 py-2 text-center bg-amber-100 text-gray-900">PROCESS RATING</th>
                    <th className="border px-3 py-2 text-left">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const grouped: { [key: string]: any[] } = {};
                    forza.forEach(act => {
                      if (!grouped[act.process]) grouped[act.process] = [];
                      grouped[act.process].push(act);
                    });
                    
                    return Object.entries(grouped).map(([process, activities]) => {
                      const processRating = activities.length > 0 
                        ? activities.reduce((sum, a) => sum + (a.processRating || 0), 0) / activities.length 
                        : 0;
                      
                      // Calcola medie per categoria
                      const govScores = activities.map(a => a.governance).filter(s => s !== null && s !== undefined);
                      const monScores = activities.map(a => a.monitoring).filter(s => s !== null && s !== undefined);
                      const techScores = activities.map(a => a.technology).filter(s => s !== null && s !== undefined);
                      const orgScores = activities.map(a => a.organization).filter(s => s !== null && s !== undefined);
                      
                      const avgGov = govScores.length > 0 ? govScores.reduce((a,b) => a+b, 0) / govScores.length : null;
                      const avgMon = monScores.length > 0 ? monScores.reduce((a,b) => a+b, 0) / monScores.length : null;
                      const avgTech = techScores.length > 0 ? techScores.reduce((a,b) => a+b, 0) / techScores.length : null;
                      const avgOrg = orgScores.length > 0 ? orgScores.reduce((a,b) => a+b, 0) / orgScores.length : null;
                      
                      return (
                        <>
                          {activities.map((act, idx) => (
                            <tr key={`${process}-${idx}`} className="bg-green-50">
                              <td className="border px-3 py-2 font-semibold">{idx === 0 ? act.process : ''}</td>
                              <td className="border px-3 py-2">{act.activity}</td>
                              <td className="border px-3 py-2 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  {getScoreIcon(act.governance)}
                                  <span className="font-bold text-sm">{act.governance?.toFixed(2) || '-'}</span>
                                </div>
                              </td>
                              <td className="border px-3 py-2 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  {getScoreIcon(act.monitoring)}
                                  <span className="font-bold text-sm">{act.monitoring?.toFixed(2) || '-'}</span>
                                </div>
                              </td>
                              <td className="border px-3 py-2 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  {getScoreIcon(act.technology)}
                                  <span className="font-bold text-sm">{act.technology?.toFixed(2) || '-'}</span>
                                </div>
                              </td>
                              <td className="border px-3 py-2 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  {getScoreIcon(act.organization)}
                                  <span className="font-bold text-sm">{act.organization?.toFixed(2) || '-'}</span>
                                </div>
                              </td>
                              <td className="border px-3 py-2 text-center"></td>
                              <td className="border px-3 py-2 text-xs">{act.note || '-'}</td>
                            </tr>
                          ))}
                          <tr className="bg-green-200 font-bold">
                            <td colSpan={2} className="border px-3 py-2 text-right">PROCESS RATING - {process}:</td>
                            <td className="border px-3 py-2 text-center">
                              <div className="flex items-center justify-center gap-1">
                                {getScoreIcon(avgGov)}
                                <span className="font-bold text-sm">{avgGov?.toFixed(2) || '-'}</span>
                              </div>
                            </td>
                            <td className="border px-3 py-2 text-center">
                              <div className="flex items-center justify-center gap-1">
                                {getScoreIcon(avgMon)}
                                <span className="font-bold text-sm">{avgMon?.toFixed(2) || '-'}</span>
                              </div>
                            </td>
                            <td className="border px-3 py-2 text-center">
                              <div className="flex items-center justify-center gap-1">
                                {getScoreIcon(avgTech)}
                                <span className="font-bold text-sm">{avgTech?.toFixed(2) || '-'}</span>
                              </div>
                            </td>
                            <td className="border px-3 py-2 text-center">
                              <div className="flex items-center justify-center gap-1">
                                {getScoreIcon(avgOrg)}
                                <span className="font-bold text-sm">{avgOrg?.toFixed(2) || '-'}</span>
                              </div>
                            </td>
                            <td className="border px-3 py-2 text-center bg-amber-100">
                              <span className="font-bold text-lg">{processRating.toFixed(2)}</span>
                            </td>
                            <td className="border px-3 py-2"></td>
                          </tr>
                        </>
                      );
                    });
                  })()}
                </tbody>
              </table>
            ) : <p className="text-gray-500">Nessun punto di forza</p>}
          </div>

          {/* Punti di Debolezza */}
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-yellow-500 text-white px-4 py-2 rounded-lg">
                <span className="font-bold">2.00 - 2.99</span>
              </div>
              <h3 className="text-2xl font-bold">PUNTI DI DEBOLEZZA ({debolezza.length})</h3>
            </div>
            {debolezza.length > 0 ? (
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-yellow-500 text-white">
                    <th className="border px-3 py-2 text-left">Processo</th>
                    <th className="border px-3 py-2 text-left">Sottoprocesso</th>
                    <th className="border px-3 py-2 text-center">Governance</th>
                    <th className="border px-3 py-2 text-center">M&C</th>
                    <th className="border px-3 py-2 text-center">Technology</th>
                    <th className="border px-3 py-2 text-center">Organization</th>
                    <th className="border px-3 py-2 text-center bg-amber-100 text-gray-900">PROCESS RATING</th>
                    <th className="border px-3 py-2 text-left">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const grouped: { [key: string]: any[] } = {};
                    debolezza.forEach(act => {
                      if (!grouped[act.process]) grouped[act.process] = [];
                      grouped[act.process].push(act);
                    });
                    
                    return Object.entries(grouped).map(([process, activities]) => {
                      const processRating = activities.length > 0 
                        ? activities.reduce((sum, a) => sum + (a.processRating || 0), 0) / activities.length 
                        : 0;
                      
                      // Calcola medie per categoria
                      const govScores = activities.map(a => a.governance).filter(s => s !== null && s !== undefined);
                      const monScores = activities.map(a => a.monitoring).filter(s => s !== null && s !== undefined);
                      const techScores = activities.map(a => a.technology).filter(s => s !== null && s !== undefined);
                      const orgScores = activities.map(a => a.organization).filter(s => s !== null && s !== undefined);
                      
                      const avgGov = govScores.length > 0 ? govScores.reduce((a,b) => a+b, 0) / govScores.length : null;
                      const avgMon = monScores.length > 0 ? monScores.reduce((a,b) => a+b, 0) / monScores.length : null;
                      const avgTech = techScores.length > 0 ? techScores.reduce((a,b) => a+b, 0) / techScores.length : null;
                      const avgOrg = orgScores.length > 0 ? orgScores.reduce((a,b) => a+b, 0) / orgScores.length : null;
                      
                      return (
                        <>
                          {activities.map((act, idx) => (
                            <tr key={`${process}-${idx}`} className="bg-yellow-50">
                              <td className="border px-3 py-2 font-semibold">{idx === 0 ? act.process : ''}</td>
                              <td className="border px-3 py-2">{act.activity}</td>
                              <td className="border px-3 py-2 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  {getScoreIcon(act.governance)}
                                  <span className="font-bold text-sm">{act.governance?.toFixed(2) || '-'}</span>
                                </div>
                              </td>
                              <td className="border px-3 py-2 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  {getScoreIcon(act.monitoring)}
                                  <span className="font-bold text-sm">{act.monitoring?.toFixed(2) || '-'}</span>
                                </div>
                              </td>
                              <td className="border px-3 py-2 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  {getScoreIcon(act.technology)}
                                  <span className="font-bold text-sm">{act.technology?.toFixed(2) || '-'}</span>
                                </div>
                              </td>
                              <td className="border px-3 py-2 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  {getScoreIcon(act.organization)}
                                  <span className="font-bold text-sm">{act.organization?.toFixed(2) || '-'}</span>
                                </div>
                              </td>
                              <td className="border px-3 py-2 text-center"></td>
                              <td className="border px-3 py-2 text-xs">{act.note || '-'}</td>
                            </tr>
                          ))}
                          <tr className="bg-yellow-200 font-bold">
                            <td colSpan={2} className="border px-3 py-2 text-right">PROCESS RATING - {process}:</td>
                            <td className="border px-3 py-2 text-center">
                              <div className="flex items-center justify-center gap-1">
                                {getScoreIcon(avgGov)}
                                <span className="font-bold text-sm">{avgGov?.toFixed(2) || '-'}</span>
                              </div>
                            </td>
                            <td className="border px-3 py-2 text-center">
                              <div className="flex items-center justify-center gap-1">
                                {getScoreIcon(avgMon)}
                                <span className="font-bold text-sm">{avgMon?.toFixed(2) || '-'}</span>
                              </div>
                            </td>
                            <td className="border px-3 py-2 text-center">
                              <div className="flex items-center justify-center gap-1">
                                {getScoreIcon(avgTech)}
                                <span className="font-bold text-sm">{avgTech?.toFixed(2) || '-'}</span>
                              </div>
                            </td>
                            <td className="border px-3 py-2 text-center">
                              <div className="flex items-center justify-center gap-1">
                                {getScoreIcon(avgOrg)}
                                <span className="font-bold text-sm">{avgOrg?.toFixed(2) || '-'}</span>
                              </div>
                            </td>
                            <td className="border px-3 py-2 text-center bg-amber-100">
                              <span className="font-bold text-lg">{processRating.toFixed(2)}</span>
                            </td>
                            <td className="border px-3 py-2"></td>
                          </tr>
                        </>
                      );
                    });
                  })()}
                </tbody>
              </table>
            ) : <p className="text-gray-500">Nessun punto di debolezza</p>}
          </div>

          {/* Punti Critici */}
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-red-600 text-white px-4 py-2 rounded-lg">
                <span className="font-bold">&lt; 2.00</span>
              </div>
              <h3 className="text-2xl font-bold">PUNTI CRITICI ({critici.length})</h3>
            </div>
            {critici.length > 0 ? (
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-red-600 text-white">
                    <th className="border px-3 py-2 text-left">Processo</th>
                    <th className="border px-3 py-2 text-left">Sottoprocesso</th>
                    <th className="border px-3 py-2 text-center">Governance</th>
                    <th className="border px-3 py-2 text-center">M&C</th>
                    <th className="border px-3 py-2 text-center">Technology</th>
                    <th className="border px-3 py-2 text-center">Organization</th>
                    <th className="border px-3 py-2 text-center bg-amber-100 text-gray-900">PROCESS RATING</th>
                    <th className="border px-3 py-2 text-left">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const grouped: { [key: string]: any[] } = {};
                    critici.forEach(act => {
                      if (!grouped[act.process]) grouped[act.process] = [];
                      grouped[act.process].push(act);
                    });
                    
                    return Object.entries(grouped).map(([process, activities]) => {
                      const processRating = activities.length > 0 
                        ? activities.reduce((sum, a) => sum + (a.processRating || 0), 0) / activities.length 
                        : 0;
                      
                      // Calcola medie per categoria
                      const govScores = activities.map(a => a.governance).filter(s => s !== null && s !== undefined);
                      const monScores = activities.map(a => a.monitoring).filter(s => s !== null && s !== undefined);
                      const techScores = activities.map(a => a.technology).filter(s => s !== null && s !== undefined);
                      const orgScores = activities.map(a => a.organization).filter(s => s !== null && s !== undefined);
                      
                      const avgGov = govScores.length > 0 ? govScores.reduce((a,b) => a+b, 0) / govScores.length : null;
                      const avgMon = monScores.length > 0 ? monScores.reduce((a,b) => a+b, 0) / monScores.length : null;
                      const avgTech = techScores.length > 0 ? techScores.reduce((a,b) => a+b, 0) / techScores.length : null;
                      const avgOrg = orgScores.length > 0 ? orgScores.reduce((a,b) => a+b, 0) / orgScores.length : null;
                      
                      return (
                        <>
                          {activities.map((act, idx) => (
                            <tr key={`${process}-${idx}`} className="bg-red-50">
                              <td className="border px-3 py-2 font-semibold">{idx === 0 ? act.process : ''}</td>
                              <td className="border px-3 py-2">{act.activity}</td>
                              <td className="border px-3 py-2 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  {getScoreIcon(act.governance)}
                                  <span className="font-bold text-sm">{act.governance?.toFixed(2) || '-'}</span>
                                </div>
                              </td>
                              <td className="border px-3 py-2 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  {getScoreIcon(act.monitoring)}
                                  <span className="font-bold text-sm">{act.monitoring?.toFixed(2) || '-'}</span>
                                </div>
                              </td>
                              <td className="border px-3 py-2 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  {getScoreIcon(act.technology)}
                                  <span className="font-bold text-sm">{act.technology?.toFixed(2) || '-'}</span>
                                </div>
                              </td>
                              <td className="border px-3 py-2 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  {getScoreIcon(act.organization)}
                                  <span className="font-bold text-sm">{act.organization?.toFixed(2) || '-'}</span>
                                </div>
                              </td>
                              <td className="border px-3 py-2 text-center"></td>
                              <td className="border px-3 py-2 text-xs">{act.note || '-'}</td>
                            </tr>
                          ))}
                          <tr className="bg-red-200 font-bold">
                            <td colSpan={2} className="border px-3 py-2 text-right">PROCESS RATING - {process}:</td>
                            <td className="border px-3 py-2 text-center">
                              <div className="flex items-center justify-center gap-1">
                                {getScoreIcon(avgGov)}
                                <span className="font-bold text-sm">{avgGov?.toFixed(2) || '-'}</span>
                              </div>
                            </td>
                            <td className="border px-3 py-2 text-center">
                              <div className="flex items-center justify-center gap-1">
                                {getScoreIcon(avgMon)}
                                <span className="font-bold text-sm">{avgMon?.toFixed(2) || '-'}</span>
                              </div>
                            </td>
                            <td className="border px-3 py-2 text-center">
                              <div className="flex items-center justify-center gap-1">
                                {getScoreIcon(avgTech)}
                                <span className="font-bold text-sm">{avgTech?.toFixed(2) || '-'}</span>
                              </div>
                            </td>
                            <td className="border px-3 py-2 text-center">
                              <div className="flex items-center justify-center gap-1">
                                {getScoreIcon(avgOrg)}
                                <span className="font-bold text-sm">{avgOrg?.toFixed(2) || '-'}</span>
                              </div>
                            </td>
                            <td className="border px-3 py-2 text-center bg-amber-100">
                              <span className="font-bold text-lg">{processRating.toFixed(2)}</span>
                            </td>
                            <td className="border px-3 py-2"></td>
                          </tr>
                        </>
                      );
                    });
                  })()}
                </tbody>
              </table>
            ) : <p className="text-gray-500">Nessun punto critico</p>}
          </div>
        </div>

        {/* Sezione per Categoria */}
        {CATEGORIES_ORDER.filter(cat => organized[cat]).map(category => (
          <div key={category} className="mb-12">
            <h2 className="text-2xl font-bold text-white bg-blue-600 p-4 rounded-t-xl mb-6">
              {category}
            </h2>
            
            {Object.entries(organized[category]).map(([process, activities]: [string, any]) => {
              const allActivitiesKeys = Object.keys(activities);
              // Raccoglie TUTTE le dimensioni da TUTTE le attività (non solo la prima)
              const allDimensionsSet = new Set<string>();
              allActivitiesKeys.forEach(actKey => {
                Object.keys(activities[actKey]).forEach(dim => allDimensionsSet.add(dim));
              });
              const allDimensions = Array.from(allDimensionsSet);
              const processAvg = calculateProcessAverage(activities);

              return (
                <div key={process} className="bg-white shadow-lg rounded-xl p-8 mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-800">{process}</h3>
                    <div className="bg-green-500 text-white px-4 py-2 rounded-lg">
                      <span className="text-sm font-semibold">MEDIA:</span>
                      <span className="text-xl font-bold ml-2">{processAvg}</span>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="bg-blue-500">
                          <th className="border px-3 py-2 text-left text-white font-semibold">Attività</th>
                          {allDimensions.map(dim => (
                            <th key={dim} className="border px-2 py-2 text-center text-white font-semibold">
                              {dim.substring(0, 60)}
                            </th>
                          ))}
                          <th className="border px-3 py-2 text-center text-white font-semibold">Media</th>
                          <th className="border px-3 py-2 text-center text-white font-semibold">Note</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(activities).map(([activity, dimensions]: [string, any]) => {
                          const note = Object.values(dimensions).find((d: any) => d?.note);
                          const noteText = note ? (note as any).note : '';
                          const rowAvg = calculateRowAverage(dimensions);

                          return (
                            <tr key={activity} className="hover:bg-gray-50">
                              <td className="border px-3 py-2 text-gray-800 font-medium">{activity}</td>
                              {allDimensions.map(dim => {
                                const dimData = dimensions[dim];
                                const score = dimData?.score ?? 0;
                                const isNA = dimData?.is_not_applicable;

                                return (
                                  <td key={dim} className="border px-2 py-2 text-center">
                                    {isNA ? (
                                      <span className="inline-block px-3 py-1 rounded font-semibold bg-gray-200 text-gray-600">N/A</span>
                                    ) : (
                                      <span className={`inline-block px-3 py-1 rounded font-semibold ${
                                        score === 0 ? 'bg-red-100 text-red-800' :
                                        score === 1 ? 'bg-orange-100 text-orange-800' :
                                        score === 2 ? 'bg-yellow-100 text-yellow-800' :
                                        score === 3 ? 'bg-yellow-100 text-yellow-700' :
                                        score === 4 ? 'bg-green-100 text-green-800' :
                                        'bg-blue-100 text-blue-800'
                                      }`}>{score}</span>
                                    )}
                                  </td>
                                );
                              })}
                              <td className="border px-3 py-2 text-center bg-blue-50">
                                <span className="font-bold text-blue-800">
                                  {rowAvg !== null ? rowAvg.toFixed(2) : 'N/A'}
                                </span>
                              </td>
                              <td className="border px-3 py-2 text-gray-600 text-sm">{noteText || '-'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        {/* Radar Charts */}
        <div className="mt-12 space-y-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-8">Analisi Radar</h2>
          
          {/* Radar per Processo */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h3 className="text-2xl font-bold mb-6">Radar per Processo</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {Object.keys(organized[CATEGORIES_ORDER[0]] || {}).map(process => {
                const data = CATEGORIES_ORDER.map(cat => {
                  const activities = organized[cat]?.[process] || {};
                  const avgs: number[] = [];
                  Object.values(activities).forEach((dims: any) => {
                    const avg = calculateRowAverage(dims);
                    if (avg !== null) avgs.push(avg);
                  });
                  const processAvg = avgs.length > 0 ? avgs.reduce((a,b) => a+b, 0) / avgs.length : 0;
                  return {
                    category: cat.replace('Monitoring & Control', 'M&C'),
                    value: processAvg
                  };
                });
                
                return (
                  <div key={process} className="border rounded-lg p-4">
                    <h4 className="font-bold text-lg mb-4 text-center">{process}</h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <RadarChart data={data}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="category" />
                        <PolarRadiusAxis angle={90} domain={[0, 5]} />
                        <Radar name={process} dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Radar per Categoria */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h3 className="text-2xl font-bold mb-6">Radar per Categoria</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {CATEGORIES_ORDER.map(category => {
                const processes = organized[category] || {};
                const data = Object.keys(processes).map(proc => {
                  const activities = processes[proc];
                  const avgs: number[] = [];
                  Object.values(activities).forEach((dims: any) => {
                    const avg = calculateRowAverage(dims);
                    if (avg !== null) avgs.push(avg);
                  });
                  const procAvg = avgs.length > 0 ? avgs.reduce((a,b) => a+b, 0) / avgs.length : 0;
                  return {
                    process: proc,
                    value: procAvg
                  };
                });
                
                return (
                  <div key={category} className="border rounded-lg p-4">
                    <h4 className="font-bold text-lg mb-4 text-center">{category}</h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <RadarChart data={data}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="process" />
                        <PolarRadiusAxis angle={90} domain={[0, 5]} />
                        <Radar name={category} dataKey="value" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Radar Riassuntivo - Tutti i Processi */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h3 className="text-2xl font-bold mb-6">Radar Riassuntivo - Confronto Processi</h3>
            <ResponsiveContainer width="100%" height={500}>
              <RadarChart data={CATEGORIES_ORDER.map(cat => {
                const catData: any = { category: cat.replace('Monitoring & Control', 'M&C') };
                Object.keys(organized[CATEGORIES_ORDER[0]] || {}).forEach(proc => {
                  const activities = organized[cat]?.[proc] || {};
                  const avgs: number[] = [];
                  Object.values(activities).forEach((dims: any) => {
                    const avg = calculateRowAverage(dims);
                    if (avg !== null) avgs.push(avg);
                  });
                  catData[proc] = avgs.length > 0 ? avgs.reduce((a,b) => a+b, 0) / avgs.length : 0;
                });
                return catData;
              })}>
                <PolarGrid />
                <PolarAngleAxis dataKey="category" />
                <PolarRadiusAxis angle={90} domain={[0, 5]} />
                {(() => {
                  const processes = Object.keys(organized[CATEGORIES_ORDER[0]] || {});
                  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
                  
                  // Calcola aree per ogni processo
                  const processesWithArea = processes.map((proc, idx) => {
                    const values = CATEGORIES_ORDER.map(cat => {
                      const activities = organized[cat]?.[proc] || {};
                      const avgs: number[] = [];
                      Object.values(activities).forEach((dims: any) => {
                        const avg = calculateRowAverage(dims);
                        if (avg !== null) avgs.push(avg);
                      });
                      return avgs.length > 0 ? avgs.reduce((a,b) => a+b, 0) / avgs.length : 0;
                    });
                    const n = values.length;
                    const avgRadius = values.reduce((a,b) => a+b, 0) / n;
                    const area = (n * Math.pow(avgRadius, 2) * Math.sin(2 * Math.PI / n)) / 2;
                    return { proc, area, colorIdx: idx };
                  });
                  
                  // Ordina per area decrescente
                  processesWithArea.sort((a, b) => b.area - a.area);
                  
                  return processesWithArea.map(({ proc, area, colorIdx }) => (
                    <Radar 
                      key={proc} 
                      name={`${proc} (${area.toFixed(2)})`} 
                      dataKey={proc} 
                      stroke={colors[colorIdx % colors.length]} 
                      fill={colors[colorIdx % colors.length]} 
                      fillOpacity={0} 
                      strokeWidth={2} 
                    />
                  ));
                })()}
                <Legend wrapperStyle={{ fontSize: "12px" }} layout="vertical" align="right" verticalAlign="middle" />
              </RadarChart>
            </ResponsiveContainer>
               </div>

          {/* Radar Riassuntivo - Tutte le Categorie */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h3 className="text-2xl font-bold mb-6">Radar Riassuntivo - Confronto Categorie</h3>
            <ResponsiveContainer width="100%" height={500}>
              <RadarChart data={Object.keys(organized[CATEGORIES_ORDER[0]] || {}).map(proc => {
                const procData: any = { process: proc };
                CATEGORIES_ORDER.forEach(cat => {
                  const activities = organized[cat]?.[proc] || {};
                  const avgs: number[] = [];
                  Object.values(activities).forEach((dims: any) => {
                    const avg = calculateRowAverage(dims);
                    if (avg !== null) avgs.push(avg);
                  });
                  procData[cat] = avgs.length > 0 ? avgs.reduce((a,b) => a+b, 0) / avgs.length : 0;
                });
                return procData;
              })}>
                <PolarGrid />
                <PolarAngleAxis dataKey="process" />
                <PolarRadiusAxis angle={90} domain={[0, 5]} />
                {(() => {
                  const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];
                  const processes = Object.keys(organized[CATEGORIES_ORDER[0]] || {});
                  
                  // Calcola aree per ogni categoria
                  const categoriesWithArea = CATEGORIES_ORDER.map((cat, idx) => {
                    const values = processes.map(proc => {
                      const activities = organized[cat]?.[proc] || {};
                      const avgs: number[] = [];
                      Object.values(activities).forEach((dims: any) => {
                        const avg = calculateRowAverage(dims);
                        if (avg !== null) avgs.push(avg);
                      });
                      return avgs.length > 0 ? avgs.reduce((a,b) => a+b, 0) / avgs.length : 0;
                    });
                    const n = values.length;
                    const avgRadius = values.reduce((a,b) => a+b, 0) / n;
                    const area = (n * Math.pow(avgRadius, 2) * Math.sin(2 * Math.PI / n)) / 2;
                    return { cat, area, colorIdx: idx };
                  });
                  
                  // Ordina per area decrescente
                  categoriesWithArea.sort((a, b) => b.area - a.area);
                  
                  return categoriesWithArea.map(({ cat, area, colorIdx }) => (
                    <Radar 
                      key={cat} 
                      name={`${cat} (${area.toFixed(2)})`} 
                      dataKey={cat} 
                      stroke={colors[colorIdx]} 
                      fill={colors[colorIdx]} 
                      fillOpacity={0} 
                      strokeWidth={2} 
                    />
                  ));
                })()}
                <Legend wrapperStyle={{ fontSize: "12px" }} layout="vertical" align="right" verticalAlign="middle" />
              </RadarChart>
            </ResponsiveContainer>
             </div>

                {/* Conclusioni AI */}
        <div className="mt-12 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl shadow-lg p-8 border-2 border-purple-200">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-4xl">🤖</span>
            <h2 className="text-3xl font-bold text-gray-800">Conclusioni AI</h2>
          </div>
          
          {loadingAI ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mb-4"></div>
              <p className="text-lg font-semibold text-gray-700">Generazione raccomandazioni AI...</p>
            </div>
          ) : aiConclusions ? (
            <div 
              className="prose max-w-none space-y-4"
              dangerouslySetInnerHTML={{ 
                __html: aiConclusions
                  .replace(/###\s*(.*)/g, '<h3 class="text-xl font-bold mt-6 mb-3 text-gray-800 border-b-2 border-blue-200 pb-2">$1</h3>')
                  .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>')
                  .replace(/\n\n/g, '<br><br>')
                  .replace(/\n/g, ' ')
              }} 
            />
          ) : (
            <p className="text-gray-500 italic text-center py-8">⚠️ Suggerimenti AI non disponibili</p>
          )}
        </div>
      </div>
  </div>
    </div>
  );
};

export default ResultsByCategoryPage;
