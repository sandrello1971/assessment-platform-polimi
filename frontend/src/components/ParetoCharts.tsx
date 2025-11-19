import { useMemo } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface Result {
  process: string;
  category: string;
  score: number;
  is_not_applicable?: boolean;
}

interface ParetoChartsProps {
  results: Result[];
}

const DOMAIN_COLORS: Record<string, string> = {
  'Governance': '#3B82F6',
  'Monitoring & Control': '#10B981',
  'Technology': '#F59E0B',
  'Organization': '#EF4444',
};

const PROCESS_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', 
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
];

const ParetoCharts = ({ results }: ParetoChartsProps) => {
  const validResults = useMemo(() => 
    results.filter(r => !r.is_not_applicable && r.score !== null && r.score !== undefined),
    [results]
  );

  // Calcola gap totale e touchpoints totali

  // Pareto per Processo (barre = processi, suddivise per domini)
  const paretoByProcess = useMemo(() => {
    const processes = [...new Set(validResults.map(r => r.process))];
    const domains = ['Governance', 'Monitoring & Control', 'Technology', 'Organization'];
    
    // STEP 1: Calcola gap normalizzati
    const processData = processes.map(process => {
      const processResults = validResults.filter(r => r.process === process);
      let totalProcessGapNormalized = 0;
      
      const domainGaps: Record<string, number> = {};
      
      domains.forEach(domain => {
        const domainResults = processResults.filter(r => r.category === domain);
        if (domainResults.length > 0) {
          const avgScore = domainResults.reduce((sum, r) => sum + r.score, 0) / domainResults.length;
          const gap = 5 - avgScore;
          const gapNormalized = gap / processes.length;
          domainGaps[domain] = gapNormalized;
          totalProcessGapNormalized += gapNormalized;
        } else {
          domainGaps[domain] = 0;
        }
      });
      
      return {
        name: process,
        domainGaps,
        total: totalProcessGapNormalized,
      };
    });
    
    // STEP 2: Calcola totale di tutti i gap normalizzati
    const totalAllGaps = processData.reduce((sum, p) => sum + p.total, 0);
    
    // STEP 3: Converti in percentuali
    const processDataWithPercent = processData.map(p => {
      const domainGapsPercent: Record<string, number> = {};
      domains.forEach(domain => {
        domainGapsPercent[domain] = totalAllGaps > 0 ? (p.domainGaps[domain] / totalAllGaps) * 100 : 0;
      });
      return {
        name: p.name,
        ...domainGapsPercent,
        total: totalAllGaps > 0 ? (p.total / totalAllGaps) * 100 : 0,
      };
    });
    
    // Ordina per gap totale decrescente
    processDataWithPercent.sort((a, b) => b.total - a.total);
    
    // Calcola accumulo
    let cumulative = 0;
    const processDataWithCumulative = processDataWithPercent.map(item => {
      cumulative += item.total;
      return { ...item, cumulative };
    });
    
    return processDataWithCumulative;
  }, [validResults]);

  // Pareto per Dominio (barre = domini, suddivise per processi)
  const paretoByDomain = useMemo(() => {
    const processes = [...new Set(validResults.map(r => r.process))];
    const domains = ['Governance', 'Monitoring & Control', 'Technology', 'Organization'];
    
    // STEP 1: Calcola gap normalizzati
    const domainData = domains.map(domain => {
      const domainResults = validResults.filter(r => r.category === domain);
      let totalDomainGapNormalized = 0;
      
      const processGaps: Record<string, number> = {};
      
      processes.forEach(process => {
        const processResults = domainResults.filter(r => r.process === process);
        if (processResults.length > 0) {
          const avgScore = processResults.reduce((sum, r) => sum + r.score, 0) / processResults.length;
          const gap = 5 - avgScore;
          const gapNormalized = gap / domains.length;
          processGaps[process] = gapNormalized;
          totalDomainGapNormalized += gapNormalized;
        } else {
          processGaps[process] = 0;
        }
      });
      
      return {
        name: domain,
        processGaps,
        total: totalDomainGapNormalized,
      };
    });
    
    // STEP 2: Calcola totale di tutti i gap normalizzati
    const totalAllDomainGaps = domainData.reduce((sum, d) => sum + d.total, 0);
    
    // STEP 3: Converti in percentuali
    const domainDataWithPercent = domainData.map(d => {
      const processGapsPercent: Record<string, number> = {};
      processes.forEach(process => {
        processGapsPercent[process] = totalAllDomainGaps > 0 ? (d.processGaps[process] / totalAllDomainGaps) * 100 : 0;
      });
      return {
        name: d.name,
        ...processGapsPercent,
        total: totalAllDomainGaps > 0 ? (d.total / totalAllDomainGaps) * 100 : 0,
      };
    });
    
    // Ordina per gap totale decrescente
    domainDataWithPercent.sort((a, b) => b.total - a.total);
    
    // Calcola accumulo
    let cumulative = 0;
    const domainDataWithCumulative = domainDataWithPercent.map(item => {
      cumulative += item.total;
      return { ...item, cumulative };
    });
    
    return domainDataWithCumulative;
  }, [validResults]);

  const processes = [...new Set(validResults.map(r => r.process))];
  const domains = ['Governance', 'Monitoring & Control', 'Technology', 'Organization'];

  return (
    <div className="space-y-8">
      {/* Pareto per Processo */}
      <div>
        <h4 className="text-xl font-semibold mb-4 text-gray-800">Pareto by Process</h4>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={paretoByProcess} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45} 
                textAnchor="end" 
                height={100}
                fontSize={10}
                interval={0}
              />
              <YAxis yAxisId="left" label={{ value: 'Gap %', angle: -90, position: 'insideLeft' }} domain={[0, 100]} />
              <YAxis yAxisId="right" orientation="right" label={{ value: 'Cumulative %', angle: 90, position: 'insideRight' }} domain={[0, 100]} />
              
              <Tooltip 
                formatter={(value: number, name: string) => [
                  `${value.toFixed(2)}%`,
                  name === 'cumulative' ? 'Cumulative' : name
                ]}
              />
              <Legend />
              {domains.map((domain) => (
                <Bar
                  key={domain}
                  yAxisId="left"
                  dataKey={domain}
                  stackId="a"
                  fill={DOMAIN_COLORS[domain]}
                  name={domain}
                />
              ))}
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="cumulative"
                stroke="#FF0000"
                strokeWidth={3}
                dot={{ fill: '#FF0000', r: 5 }}
                name="Cumulative"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pareto per Dominio */}
      <div>
        <h4 className="text-xl font-semibold mb-4 text-gray-800">Pareto by Domain</h4>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={paretoByDomain} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45} 
                textAnchor="end" 
                height={100}
                fontSize={10}
                interval={0}
              />
              <YAxis yAxisId="left" label={{ value: 'Gap %', angle: -90, position: 'insideLeft' }} domain={[0, 100]} />
              <YAxis yAxisId="right" orientation="right" label={{ value: 'Cumulative %', angle: 90, position: 'insideRight' }} domain={[0, 100]} />
              
              <Tooltip 
                formatter={(value: number, name: string) => [
                  `${value.toFixed(2)}%`,
                  name === 'cumulative' ? 'Cumulative' : name
                ]}
              />
              <Legend />
              {processes.map((process, idx) => (
                <Bar
                  key={process}
                  yAxisId="left"
                  dataKey={process}
                  stackId="a"
                  fill={PROCESS_COLORS[idx % PROCESS_COLORS.length]}
                  name={process}
                />
              ))}
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="cumulative"
                stroke="#FF0000"
                strokeWidth={3}
                dot={{ fill: '#FF0000', r: 5 }}
                name="Cumulative"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ParetoCharts;
