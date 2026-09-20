import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Header } from './components/Header';
import { LandingPage } from './pages/LandingPage';
import { Dashboard } from './pages/Dashboard';
import { UploadContract } from './pages/UploadContract';
import { ContractDetails } from './pages/ContractDetails';
import { Obligations } from './pages/Obligations';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-white text-black">
        <Header />
        <main className="flex-1 w-full">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
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
