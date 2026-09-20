import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Header } from './components/Header';
import { Dashboard } from './pages/Dashboard';
import { UploadContract } from './pages/UploadContract';
import { ContractDetails } from './pages/ContractDetails';
import { Obligations } from './pages/Obligations';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-neutral-50 text-neutral-900">
        <Header />
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/upload" element={<UploadContract />} />
            <Route path="/contracts/:id" element={<ContractDetails />} />
            <Route path="/contracts/:id/obligations" element={<Obligations />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
};
export default App;
