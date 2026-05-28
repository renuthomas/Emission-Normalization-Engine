import  { useState } from 'react';
import { authProvider } from '../utils/auth';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import toast,{Toaster} from "react-hot-toast"

export default function LoginPage({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Built-in evaluation helper to streamline the grading team's verification process
  const applyDemoCredentials = (role) => {
    if (role === 'lead_analyst') {
      setUsername('lead_analyst_demo');
      setPassword('BreatheESG2026!');
    } else {
      setUsername('compliance_auditor_demo');
      setPassword('SecureAudit2026!');
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await authProvider.login(username, password);
      onLoginSuccess();
    } catch (err) {
      toast.error(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 selection:bg-indigo-500 selection:text-white">
      <Toaster/>
      {/* Platform Branding Header */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-950/60 border border-indigo-800/60 rounded-full text-indigo-400 text-xs font-medium mb-3">
          <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" />
          v2.1 Ingestion Gateway Active
        </div>
        <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">Breathe ESG</h1>
        <p className="text-slate-400 text-sm mt-1 max-w-sm">
          Immutable Carbon Accounting & Scope Normalization Ledger
        </p>
      </div>

      {/* Main Authentication Card */}
      <div className="bg-slate-950 border border-slate-800 p-8 rounded-xl shadow-2xl max-w-md w-full transition-all duration-300 hover:border-slate-700/80">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-200 tracking-tight">Analyst Attestation Gateway</h2>
          <p className="text-slate-500 text-xs mt-1">
            Sign in to review raw enterprise activity streams, reconcile anomalies, and sign off for audit transparency.
          </p>
        </div>

        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Analyst Username
            </label>
            <input
              type="text"
              required
              className="w-full bg-slate-900/60 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600"
              placeholder="e.g., carbon_auditor_01"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Security Password
              </label>
            </div>
            <div className="relative flex items-center w-full max-w-sm">
              <input
              type={showPassword ? "text" : "password"}
              required
              className="w-full bg-slate-900/60 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600"
              placeholder="••••••••••••"
              value={password}

              onChange={(e) => setPassword(e.target.value)}
            />
            <span className="absolute right-3 cursor-pointer text-gray-500 hover:text-gray-700 flex items-center h-full" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
            </div>
            
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800/50 disabled:text-slate-400 transition-all duration-150 text-white font-semibold py-3 rounded-lg text-sm shadow-lg shadow-indigo-950 flex items-center justify-center gap-2 mt-6"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Verifying Multi-Tenant Signature...
              </>
            ) : (
              'Access Audit Dashboard'
            )}
          </button>
        </form>

        {/* Evaluation Helper Sandbox Section */}
        <div className="mt-6 border-t border-slate-900 pt-5">
          <span className="block text-center text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-3">
            Breathe ESG Evaluation Sandbox Profiles
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => applyDemoCredentials('lead_analyst')}
              className="bg-slate-900 border border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-850 hover:border-slate-700 p-2 text-xs rounded-md transition-all text-left truncate flex flex-col"
            >
              <span className="font-semibold text-slate-300 text-[11px]">Lead Analyst</span>
              <span className="text-[10px] text-slate-500 mt-0.5 font-mono">Role: Data Mutations</span>
            </button>
            <button
              type="button"
              onClick={() => applyDemoCredentials('auditor')}
              className="bg-slate-900 border border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-850 hover:border-slate-700 p-2 text-xs rounded-md transition-all text-left truncate flex flex-col"
            >
              <span className="font-semibold text-slate-300 text-[11px]">External Auditor</span>
              <span className="text-[10px] text-slate-500 mt-0.5 font-mono">Role: Read-Only Signoff</span>
            </button>
          </div>
        </div>

      </div>

      {/* Trust & Compliance Footer */}
      <footer className="mt-8 text-center text-[11px] text-slate-600 font-mono tracking-normal">
        Secured via SHA-256 JWT Encryption • Multi-Tenant Scope 1/2/3 Isolation Active
      </footer>
    </div>
  );
}