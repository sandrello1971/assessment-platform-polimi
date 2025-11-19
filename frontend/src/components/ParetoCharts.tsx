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
  const totalStats = useMemo(() => {
    const totalTouchpoints = validResults.length;
    const totalScore = validResults.reduce((sum, r) => sum + r.score, 0) / totalTouchpoints;
    const totalGap = 5 - totalScore;
    return { totalTouchpoints, totalGap, totalScore };
  }, [validResults]);

  // Pareto per Processo (barre = processi, suddivise per domini)
  const paretoByProcess = useMemo(() => {
    const processes = [...new Set(validResults.map(r => r.process))];
    const domains = ['Governance', 'Monitoring & Control', 'Technology', 'Organization'];
    
    const processData = processes.map(process => {
      const processResults = validResults.filter(r => r.process === process);
      let totalProcessGapPercent = 0;
      
      const domainGaps: Record<string, number> = {};
      
      domains.forEach(domain => {
        const domainResults = processResults.filter(r => r.category === domain);
        if (domainResults.length > 0) {
          const avgScore = domainResults.reduce((sum, r) => sum + r.score, 0) / domainResults.length;
          const gap = 5 - avgScore;
          const touchpoints = domainResults.length;
          const gapPercent = (gap * touchpoints) / (totalStats.totalGap * totalStats.totalTouchpoints) * 100;
          domainGaps[domain] = gapPercent;
          totalProcessGapPercent += gapPercent;
        } else {
          domainGaps[domain] = 0;
        }
      });
      
      return {
        name: process,
        ...domainGaps,
        total: totalProcessGapPercent,
      };
    });
    
    // Ordina per gap totale decrescente
    processData.sort((a, b) => b.total - a.total);
    
    // Calcola accumulo
    let cumulative = 0;
    const processDataWithCumulative = processData.map(item => {
      cumulative += item.total;
      return { ...item, cumulative };
    });
    
    return processDataWithCumulative;
  }, [validResults, totalStats]);

  // Pareto per Dominio (barre = domini, suddivise per processi)
  const paretoByDomain = useMemo(() => {
    const processes = [...new Set(validResults.map(r => r.process))];
    const domains = ['Governance', 'Monitoring & Control', 'Technology', 'Organization'];
    
    const domainData = domains.map(domain => {
      const domainResults = validResults.filter(r => r.category === domain);
      let totalDomainGapPercent = 0;
      
      const processGaps: Record<string, number> = {};
      
      processes.forEach(process => {
        const processResults = domainResults.filter(r => r.process === process);
        if (processResults.length > 0) {
          const avgScore = processResults.reduce((sum, r) => sum + r.score, 0) / processResults.length;
          const gap = 5 - avgScore;
          const touchpoints = processResults.length;
          const gapPercent = (gap * touchpoints) / (totalStats.totalGap * totalStats.totalTouchpoints) * 100;
          processGaps[process] = gapPercent;
          totalDomainGapPercent += gapPercent;
        } else {
          processGaps[process] = 0;
        }
      });
      
      return {
        name: domain,
        ...processGaps,
        total: totalDomainGapPercent,
      };
    });
    
    // Ordina per gap totale decrescente
    domainData.sort((a, b) => b.total - a.total);
    
    // Calcola accumulo
    let cumulative = 0;
    const domainDataWithCumulative = domainData.map(item => {
      cumulative += item.total;
      return { ...item, cumulative };
    });
    
    return domainDataWithCumulative;
  }, [validResults, totalStats]);

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
