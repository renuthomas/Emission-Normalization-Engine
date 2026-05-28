import { useState } from 'react';
import LoginPage from './components/LoginPage.jsx'; 
import AnalystDashboard from './components/AnalystDashboard.jsx'; 
import DataIngestion from './components/DataIngestion.jsx'; 
import toast,{Toaster} from "react-hot-toast"
export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => !!localStorage.getItem('access_token')
  );
  
  const [activeTab, setActiveTab] = useState('INGEST');

  const handleLoginSuccess = () => {
    toast.success('Login successful!');
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans antialiased">
      <Toaster/>
      {/* Global Application Nav Bar with Logout Safety Hook */}
      <nav className="bg-slate-950 border-b border-slate-800 px-6 py-4 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <span className="text-xl font-black tracking-tight text-white">Breathe <span className="text-indigo-500">ESG</span></span>
            <span className="text-[10px] bg-slate-800 border border-slate-700 font-mono text-slate-400 px-2 py-0.5 rounded uppercase tracking-wider">
              Enterprise Client Workspace
            </span>
          </div>
          
          {/* Operational View Tab Switches */}
          <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveTab('INGEST')}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold tracking-wide transition-all ${
                activeTab === 'INGEST' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              1. Ingest Data Sources
            </button>
            <button
              onClick={() => setActiveTab('REVIEW')}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold tracking-wide transition-all ${
                activeTab === 'REVIEW' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              2. Review & Reconcile Ledger
            </button>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 transition-all text-xs font-semibold py-1.5 px-3 rounded-lg flex items-center gap-1.5 shadow-sm"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 01-3-3h4a3 3 0 013 3v1" />
          </svg>
          Terminate Session
        </button>
      </nav>

      <main className="p-6">
        {activeTab === 'INGEST' ? <DataIngestion /> : <AnalystDashboard />}
      </main>
    </div>
  );
}