with open('frontend/src/pages/ResultsTablePage.tsx', 'r') as f:
    content = f.read()

# Trova dove inserire le nuove tabelle (prima della tabella Punti Critici)
insert_pos = content.find('/* Punti Critici - Tabella Completa Stile Excel */')

# Tabelle da inserire PRIMA dei Punti Critici
new_tables = '''/* Punti di Forza - Tabella Completa Stile Excel */}
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-green-600 text-white px-4 py-2 rounded-lg">
                <span className="font-bold">&gt;= 3.00</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-800">PUNTI DI FORZA - Dettaglio 4 Dimensioni</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-green-600">
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
                  {criticalPointsData.filter(p => (p.process_rating || 0) >= 3.0).map((point, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 bg-green-50">
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
                        <span className="font-bold text-lg text-green-700">
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
          </div>

          {/* Punti di Debolezza - Tabella Completa Stile Excel */}
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-yellow-500 text-white px-4 py-2 rounded-lg">
                <span className="font-bold">2.00 - 2.99</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-800">PUNTI DI DEBOLEZZA - Dettaglio 4 Dimensioni</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-yellow-500">
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
                  {criticalPointsData.filter(p => {
                    const rating = p.process_rating || 0;
                    return rating >= 2.0 && rating < 3.0;
                  }).map((point, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 bg-yellow-50">
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
                        <span className="font-bold text-lg text-yellow-700">
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
          </div>

          {'''

# Inserisci le nuove tabelle
content = content[:insert_pos] + new_tables + content[insert_pos:]

with open('frontend/src/pages/ResultsTablePage.tsx', 'w') as f:
    f.write(content)

print("✅ Tabelle Punti di Forza e Debolezza aggiunte!")
