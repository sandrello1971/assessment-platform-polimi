
// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AssessmentForm from './pages/TestTableForm';
import AssessmentFormByDimension from './pages/AssessmentFormByDimension';
import ResultsTablePage from './pages/ResultsTablePage';
import Sessions from './pages/Sessions';
import NewAssessment from './pages/NewAssessment';
import CompanyForm from './pages/CompanyForm';
import TestTableForm from './pages/TestTableForm';
import TestTableFormByCategory from './pages/TestTableFormByCategory';

import AdminModels from './pages/AdminModels';
const App: React.FC = () => {
  return (
    <Router>
      <Routes>
<Route path="/assessment-test/:sessionId" element={<AssessmentFormByDimension />} />
<Route path="/assessment-table-test/:sessionId" element={<TestTableFormByCategory />} />

        <Route path="/test-table/:sessionId" element={<TestTableForm />} />
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin/models" element={<AdminModels />} />
        
        {/* Nuova route per inserire dati azienda */}
        <Route path="/company-form" element={<CompanyForm />} />
        
        {/* ✅ IMPORTANTE: Route specifiche PRIMA di quelle con parametri! */}
        <Route path="/assessment/new" element={<NewAssessment />} />
        
        {/* Assessment form che riceve l'ID della sessione */}
        <Route path="/assessment/:sessionId" element={<AssessmentForm />} />
        
        {/* Route di fallback per compatibilità */}
        <Route path="/assessment" element={<AssessmentForm />} />

<Route path="/results/:id" element={<ResultsTablePage />} />        
        <Route path="/results-table/:id" element={<ResultsTablePage />} />
        <Route path="/sessions" element={<Sessions />} />
      </Routes>
    </Router>
  );
};

export default App;
