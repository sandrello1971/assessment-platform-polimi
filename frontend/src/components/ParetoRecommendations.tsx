import { useMemo, useState, useEffect } from 'react';
import axios from 'axios';

interface Result {
  process: string;
  category: string;
  score: number;
  is_not_applicable?: boolean;
}

interface ParetoRecommendationsProps {
  results: Result[];
  sessionId: string;
}

const ParetoRecommendations = ({ results, sessionId }: ParetoRecommendationsProps) => {
  const [recommendations, setRecommendations] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  const validResults = useMemo(() => 
    results.filter(r => !r.is_not_applicable && r.score !== null && r.score !== undefined),
    [results]
  );

  // Calcola i dati Pareto
  const paretoData = useMemo(() => {
    const totalTouchpoints = validResults.length;
    const totalScore = validResults.reduce((sum, r) => sum + r.score, 0) / totalTouchpoints;
    const totalGap = 5 - totalScore;

    const processes = [...new Set(validResults.map(r => r.process))];
    const domains = ['Governance', 'Monitoring & Control', 'Technology', 'Organization'];

    // Pareto per Processo
    // STEP 1: Calcola gap normalizzati
    const processDataTemp = processes.map(process => {
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
        }
      });
      
      return { process, gapNormalized: totalProcessGapNormalized, domainGaps };
    });
    
    // STEP 2: Calcola totale e converti in percentuali
    const totalAllProcessGaps = processDataTemp.reduce((sum, p) => sum + p.gapNormalized, 0);
    const processData = processDataTemp.map(p => ({
      process: p.process,
      gapPercent: totalAllProcessGaps > 0 ? (p.gapNormalized / totalAllProcessGaps) * 100 : 0,
      domainGaps: p.domainGaps
    })).sort((a, b) => b.gapPercent - a.gapPercent);

    // Pareto per Dominio
    // STEP 1: Calcola gap normalizzati
    const domainDataTemp = domains.map(domain => {
      const domainResults = validResults.filter(r => r.category === domain);
      let totalDomainGapNormalized = 0;
      
      processes.forEach(process => {
        const processResults = domainResults.filter(r => r.process === process);
        if (processResults.length > 0) {
          const avgScore = processResults.reduce((sum, r) => sum + r.score, 0) / processResults.length;
          const gap = 5 - avgScore;
          const gapNormalized = gap / domains.length;
          totalDomainGapNormalized += gapNormalized;
        }
      });
      
      return { domain, gapNormalized: totalDomainGapNormalized };
    });
    
    // STEP 2: Calcola totale e converti in percentuali
    const totalAllDomainGaps = domainDataTemp.reduce((sum, d) => sum + d.gapNormalized, 0);
    const domainData = domainDataTemp.map(d => ({
      domain: d.domain,
      gapPercent: totalAllDomainGaps > 0 ? (d.gapNormalized / totalAllDomainGaps) * 100 : 0
    })).sort((a, b) => b.gapPercent - a.gapPercent);

    // Calcola cumulativo per trovare 80%
    let cumulative = 0;
    const top80Processes: string[] = [];
    for (const p of processData) {
      cumulative += p.gapPercent;
      top80Processes.push(p.process);
      if (cumulative >= 80) break;
    }

    cumulative = 0;
    const top80Domains: string[] = [];
    for (const d of domainData) {
      cumulative += d.gapPercent;
      top80Domains.push(d.domain);
      if (cumulative >= 80) break;
    }

    return {
      totalGap,
      totalScore,
      processData,
      domainData,
      top80Processes,
      top80Domains
    };
  }, [validResults]);

  const generateRecommendations = async () => {
    setLoading(true);
    try {
      const prompt = `Analizza i seguenti dati dell'analisi di Pareto per un assessment Industry 4.0 e genera raccomandazioni strategiche.

DATI PARETO:
- Punteggio medio totale: ${paretoData.totalScore.toFixed(2)}/5
- Gap totale da colmare: ${paretoData.totalGap.toFixed(2)}

TOP PROCESSI PER GAP (ordinati per contributo al gap totale):
${paretoData.processData.slice(0, 5).map((p, i) => 
  `${i+1}. ${p.process}: ${p.gapPercent.toFixed(1)}% del gap totale`
).join('\n')}

PROCESSI CHE COPRONO L'80% DEL GAP:
${paretoData.top80Processes.join(', ')}

TOP DOMINI PER GAP:
${paretoData.domainData.map(d => 
  `- ${d.domain}: ${d.gapPercent.toFixed(1)}% del gap totale`
).join('\n')}

DOMINI CHE COPRONO L'80% DEL GAP:
${paretoData.top80Domains.join(', ')}

ISTRUZIONI:
1. Parla sempre in terza persona (es. "L'azienda dovrebbe...", "Si raccomanda di...")
2. Analizza ENTRAMBI i grafici Pareto (Processi e Domini) e formula raccomandazioni specifiche per ciascuno
3. Per i PROCESSI: indica quali processi prioritizzare e perché (basandoti sul Pareto by Process)
4. Per i DOMINI: indica quali dimensioni (Governance, M&C, Technology, Organization) necessitano intervento prioritario (basandoti sul Pareto by Domain)
5. Spiega come interpretare ENTRAMBI i grafici Pareto e come usarli insieme per pianificare gli interventi
6. Applica la regola 80/20 sia ai processi che ai domini
7. Usa un tono professionale e consulenziale
8. Struttura la risposta in sezioni chiare: 
   - Priorità per Processo
   - Priorità per Dominio
   - Come leggere i grafici Pareto
   - Piano d'azione consigliato

Genera le raccomandazioni in italiano.`;

      const response = await axios.post('/api/assessment/generate-pareto-recommendations', {
        session_id: sessionId,
        prompt: prompt
      });

      // Rimuovi il titolo indesiderato dalle raccomandazioni
      let cleanedRecommendations = response.data.recommendations;
      cleanedRecommendations = cleanedRecommendations.replace(/^#s*Analisi e Raccomandazioni Strategiche.*?\n+/i, '');
      cleanedRecommendations = cleanedRecommendations.replace(/^#s*Analisi e Raccomandazioni Strategiche.*?$/im, '');
      setRecommendations(cleanedRecommendations);
      setGenerated(true);
    } catch (error) {
      console.error('Errore generazione raccomandazioni:', error);
      // Fallback con raccomandazioni statiche basate sui dati
      const fallbackRecs = generateFallbackRecommendations();
      setRecommendations(fallbackRecs);
      setGenerated(true);
    } finally {
      setLoading(false);
    }
  };

  const generateFallbackRecommendations = () => {
    const top3Processes = paretoData.processData.slice(0, 3);
    const topDomain = paretoData.domainData[0];

    return `## Raccomandazioni Strategiche basate sull'Analisi di Pareto

### Priorità di Intervento

Dall'analisi di Pareto emerge che i processi **${paretoData.top80Processes.join(', ')}** rappresentano circa l'80% del gap totale da colmare. Si raccomanda di concentrare gli sforzi di miglioramento su queste aree per massimizzare l'impatto.

### Aree Critiche per Processo

1. **${top3Processes[0]?.process}** (${top3Processes[0]?.gapPercent.toFixed(1)}% del gap totale)
   - Questo processo rappresenta la principale area di miglioramento
   - Si raccomanda un intervento prioritario e strutturato

2. **${top3Processes[1]?.process}** (${top3Processes[1]?.gapPercent.toFixed(1)}% del gap totale)
   - Seconda area critica da affrontare
   - L'azienda dovrebbe pianificare interventi a medio termine

3. **${top3Processes[2]?.process}** (${top3Processes[2]?.gapPercent.toFixed(1)}% del gap totale)
   - Terza priorità di intervento
   - Opportunità di miglioramento significativo

### Dimensione più Critica

La dimensione **${topDomain.domain}** contribuisce per il ${topDomain.gapPercent.toFixed(1)}% al gap totale. Si raccomanda di:
- Rivedere le pratiche attuali in questa dimensione
- Implementare best practices specifiche
- Monitorare i progressi con KPI dedicati

### Come Leggere il Grafico di Pareto

Il grafico di Pareto mostra visivamente dove si concentrano i gap dell'azienda:
- Le **barre** rappresentano il contributo percentuale di ogni processo/dominio al gap totale
- La **linea rossa** (cumulativa) indica quanta parte del gap totale si copre considerando i processi in ordine di importanza
- Quando la linea raggiunge l'80%, si sono identificati i processi che causano la maggior parte del problema

**Regola 80/20**: Concentrandosi sui primi ${paretoData.top80Processes.length} processi (${paretoData.top80Processes.join(', ')}), l'azienda può affrontare circa l'80% del gap complessivo, ottimizzando così le risorse e massimizzando l'impatto degli interventi.`;
  };

  useEffect(() => {
    if (validResults.length > 0 && !generated) {
      generateRecommendations();
    }
  }, [validResults]);

  return (
    <div className="mt-12 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl shadow-lg p-8 border-2 border-amber-200">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-4xl">📊</span>
        <h2 className="text-3xl font-bold text-gray-800">Raccomandazioni</h2>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-amber-600 mb-4"></div>
          <p className="text-lg font-semibold text-gray-700">Analisi dei dati Pareto in corso...</p>
        </div>
      ) : recommendations ? (
        <div className="prose max-w-none">
          <div 
            className="text-gray-700 leading-relaxed"
            dangerouslySetInnerHTML={{ 
              __html: recommendations
                .replace(/## (.*?)$/gm, '<h3 class="text-xl font-bold text-gray-800 mt-6 mb-3">$1</h3>')
                .replace(/### (.*?)$/gm, '<h4 class="text-lg font-semibold text-gray-700 mt-4 mb-2">$1</h4>')
                .replace(/\*\*(.*?)\*\*/g, '<strong class="text-gray-900">$1</strong>')
                .replace(/\n/g, '<br/>')
            }}
          />
        </div>
      ) : (
        <p className="text-gray-600">Nessuna raccomandazione disponibile.</p>
      )}
    </div>
  );
};

export default ParetoRecommendations;
