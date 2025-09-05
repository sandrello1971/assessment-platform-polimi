// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AssessmentForm from './pages/AssessmentForm';
import ResultsPage from './pages/ResultsPage';
import Sessions from './pages/Sessions';
import NewAssessment from './pages/NewAssessment';
import CompanyForm from './pages/CompanyForm';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* Nuova route per inserire dati azienda */}
        <Route path="/company-form" element={<CompanyForm />} />
        
        {/* ✅ IMPORTANTE: Route specifiche PRIMA di quelle con parametri! */}
        <Route path="/assessment/new" element={<NewAssessment />} />
        
        {/* Assessment form che riceve l'ID della sessione */}
        <Route path="/assessment/:sessionId" element={<AssessmentForm />} />
        
        {/* Route di fallback per compatibilità */}
        <Route path="/assessment" element={<AssessmentForm />} />
        
        <Route path="/results/:id" element={<ResultsPage />} />
        <Route path="/sessions" element={<Sessions />} />
      </Routes>
    </Router>
  );
};

export default App;
