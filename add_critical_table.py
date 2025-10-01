import re

with open('frontend/src/pages/ResultsTablePage.tsx', 'r') as f:
    content = f.read()

# 1. Aggiungi l'interfaccia CriticalPoint dopo le altre interfacce
interface_insert = '''
interface CriticalPoint {
  process: string;
  subprocess: string;
  governance: number | null;
  monitoring_control: number | null;
  technology: number | null;
  organization: number | null;
  process_rating: number | null;
  notes: string;
  is_critical: boolean;
}
'''

# Trova la posizione dopo ActivitySummary interface
insert_pos = content.find('interface ActivitySummary {')
if insert_pos > -1:
    # Trova la fine dell'interface ActivitySummary
    end_pos = content.find('}', insert_pos) + 1
    content = content[:end_pos] + '\n' + interface_insert + content[end_pos:]

# 2. Aggiungi la funzione calculateCriticalPoints prima di calculateProcessAverages
calculate_function = '''
  const calculateCriticalPoints = (): CriticalPoint[] => {
    const criticalPoints: CriticalPoint[] = [];
    
    Object.entries(processResults).forEach(([process, categories]) => {
      const activitiesMap: {
        [activity: string]: {
          dimensions: { [dim: string]: number[] };
          notes: string[];
        }
      } = {};
      
      Object.entries(categories).forEach(([category, activities]) => {
        Object.entries(activities).forEach(([activity, dimensions]) => {
          if (!activitiesMap[activity]) {
            activitiesMap[activity] = {
              dimensions: {
                'Governance': [],
                'Monitoring & Control': [],
                'Technology': [],
                'Organization': []
              },
              notes: []
            };
          }
          
          Object.entries(dimensions).forEach(([_dim, data]) => {
            if (!data.is_not_applicable && activitiesMap[activity].dimensions[category]) {
              activitiesMap[activity].dimensions[category].push(data.score);
            }
            if (data.note) {
              activitiesMap[activity].notes.push(data.note);
            }
          });
        });
      });
      
      Object.entries(activitiesMap).forEach(([activity, data]) => {
        const dimAverages: { [key: string]: number | null } = {};
        
        Object.entries(data.dimensions).forEach(([dimName, scores]) => {
          dimAverages[dimName] = scores.length > 0
            ? scores.reduce((a, b) => a + b, 0) / scores.length
            : null;
        });
        
        const validAvgs = Object.values(dimAverages).filter(v => v !== null) as number[];
        const processRating = validAvgs.length > 0
          ? validAvgs.reduce((a, b) => a + b, 0) / validAvgs.length
          : null;
        
        const isCritical = validAvgs.some(v => v <= 1.5);
        
        criticalPoints.push({
          process,
          subprocess: activity,
          governance: dimAverages['Governance'],
          monitoring_control: dimAverages['Monitoring & Control'],
          technology: dimAverages['Technology'],
          organization: dimAverages['Organization'],
          process_rating: processRating,
          notes: data.notes.join('; '),
          is_critical: isCritical
        });
      });
    });
    
    return criticalPoints.sort((a, b) => {
      if (a.is_critical !== b.is_critical) return a.is_critical ? -1 : 1;
      return (a.process_rating || 5) - (b.process_rating || 5);
    });
  };

  const getScoreIcon = (score: number | null) => {
    if (score === null) return <span className="text-gray-400">N/A</span>;
    
    if (score <= 1.0) {
      return <span className="text-red-600 text-xl">❌</span>;
    } else if (score <= 2.0) {
      return <span className="text-orange-500 text-xl">⭕</span>;
    } else if (score <= 3.0) {
      return <span className="text-yellow-500 text-xl">⚠️</span>;
    } else {
      return <span className="text-green-600 text-xl">✅</span>;
    }
  };

'''

# Inserisci prima di calculateProcessAverages
calc_pos = content.find('const calculateProcessAverages = () => {')
if calc_pos > -1:
    content = content[:calc_pos] + calculate_function + '\n  ' + content[calc_pos:]

# 3. Aggiungi chiamata a calculateCriticalPoints dopo const allActivities
activities_line = content.find('const allActivities = getAllActivitiesSummary();')
if activities_line > -1:
    end_line = content.find('\n', activities_line) + 1
    content = content[:end_line] + '  const criticalPointsData = calculateCriticalPoints();\n' + content[end_line:]

# 4. Sostituisci la vecchia tabella Punti Critici con la nuova

old_table_start = content.find('/* Punti Critici */')
old_table_end = content.find('</div>\n          )}', old_table_start)
old_table_end = content.find('</div>', old_table_end) + 6

new_table = '''/* Punti Critici - Tabella Completa Stile Excel */}
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-red-600 text-white px-4 py-2 rounded-lg">
                <span className="font-bold">ANALISI COMPLETA</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-800">PUNTI CRITICI - Dettaglio 4 Dimensioni</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-red-600">
                    <th className="border border-gray-300 px-3 py-2 text-left text-white font-semibold">Processo</th>
                    <th className="border border-gray-300 px-3 py-2 text-left text-white font-semibold">Sottoprocesso</th>
                    <th className="border border-gray-300 px-3 py-2 text-center text-white font-semibold">Governance</th>
                    <th className="border border-gray-300 px-3 py-2 text-center text-white font-semibold">Monitoring & Control</th>
                    <th className="border border-gray-300 px-3 py-2 text-center text-white font-semibold">Technology</th>
                    <th className="border border-gray-300 px-3 py-2 text-center text-white font-semibold">Organization</th>
                    <th className="border border-gray-300 px-3 py-2 text-center text-white font-semibold bg-amber-100">PROCESS RATING</th>
                    <th className="border border-gray-300 px-3 py-2 text-left text-white font-semibold">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {criticalPointsData.map((point, idx) => (
                    <tr key={idx} className={`hover:bg-gray-50 ${point.is_critical ? 'bg-red-50' : ''}`}>
                      <td className="border border-gray-300 px-3 py-2 text-gray-800 font-semibold">{point.process}</td>
                      <td className="border border-gray-300 px-3 py-2 text-gray-800">{point.subprocess}</td>
                      <td className="border border-gray-300 px-3 py-2 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {getScoreIcon(point.governance)}
                          <span className="font-mono font-bold">
                            {point.governance !== null ? point.governance.toFixed(2) : 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {getScoreIcon(point.monitoring_control)}
                          <span className="font-mono font-bold">
                            {point.monitoring_control !== null ? point.monitoring_control.toFixed(2) : 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {getScoreIcon(point.technology)}
                          <span className="font-mono font-bold">
                            {point.technology !== null ? point.technology.toFixed(2) : 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {getScoreIcon(point.organization)}
                          <span className="font-mono font-bold">
                            {point.organization !== null ? point.organization.toFixed(2) : 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-center bg-amber-50">
                        <span className="font-bold text-lg text-amber-700">
                          {point.process_rating !== null ? point.process_rating.toFixed(2) : 'N/A'}
                        </span>
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-gray-600 text-xs max-w-md">
                        {point.notes || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Legenda */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="font-bold text-gray-800 mb-3">📖 Legenda Icone:</h4>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-red-600 text-xl">❌</span>
                  <span className="text-gray-700">&lt;= 1.0 (Critico)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-orange-500 text-xl">⭕</span>
                  <span className="text-gray-700">1.0 - 2.0 (Basso)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-yellow-500 text-xl">⚠️</span>
                  <span className="text-gray-700">2.0 - 3.0 (Medio)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-600 text-xl">✅</span>
                  <span className="text-gray-700">&gt; 3.0 (Buono)</span>
                </div>
              </div>
            </div>
          </div'''

content = content[:old_table_start] + new_table + content[old_table_end:]

with open('frontend/src/pages/ResultsTablePage_modified.tsx', 'w') as f:
    f.write(content)

print("✅ File modificato creato: ResultsTablePage_modified.tsx")
