import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LangProvider } from './context/LangContext';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import NotebookPage from './pages/NotebookPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  return (
    <LangProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-950 text-gray-100">
          <Navbar />
          <main className="max-w-5xl mx-auto px-4 py-6">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/notebooks/:id" element={<NotebookPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </LangProvider>
  );
}
