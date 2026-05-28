import { useState } from 'react';

export default function DataIngestion() {
  const [selectedSource, setSelectedSource] = useState('SAP');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [telemetryLog, setTelemetryLog] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0]);
    }
  };

  const handleIngestSubmit = async (e) => {
  e.preventDefault();
  if (!uploadFile) {
    alert("Please attach a valid source data file to process.");
    return;
  }

  setUploading(true);
  setTelemetryLog(null);

  // 1. Package the form attributes cleanly
  const payload = new FormData();
  payload.append('file', uploadFile);
  payload.append('source_type', selectedSource);
  
  const mockSourceMap = { 'SAP': '1', 'UTILITY': '2', 'TRAVEL': '3' };
  payload.append('source_id', mockSourceMap[selectedSource]);

  try {
    // 2. CRITICAL: Fetch ONLY the token string, DO NOT inherit the application/json header string
    const accessToken = localStorage.getItem('access_token');
    
    // Build a pristine, isolated headers envelope explicitly for multipart streams
    const uploadHeaders = {};
    if (accessToken) {
      uploadHeaders['Authorization'] = `Bearer ${accessToken}`;
    }

    // 3. Fire the clean network request
    const response = await fetch('http://127.0.0.1:8000/api/ingest/', {
      method: 'POST',
      headers: uploadHeaders, // Uses clean headers containing ONLY the authorization token
      body: payload           // Browser automatically appends multipart/form-data with boundaries
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Data schema parsing failure encountered.');
    }

    setTelemetryLog({
      status: 'SUCCESS',
      message: `Successfully processed file! Batch tracking initialized.`
    });
    setUploadFile(null);
  } catch (err) {
    setTelemetryLog({
      status: 'FAILED',
      message: err.message || 'Pipeline pipeline disruption.'
    });
  } finally {
    setUploading(false);
  }
};

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-slate-950 border border-slate-800 p-6 rounded-xl shadow-2xl">
        <h2 className="text-xl font-bold text-slate-200 tracking-tight mb-1">Raw Pipeline Ingestion Gateway</h2>
        <p className="text-slate-400 text-xs mb-6">Select upstream client pipeline structure to parse, clean, and normalize emissions activities.</p>

        <form onSubmit={handleIngestSubmit} className="space-y-6">
          {/* Source System Classification Toggle */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Target Enterprise Source System</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'SAP', name: 'SAP ERP (Fuel/Procurement)', desc: 'Handles technical headers and YYYYMMDD string alignment' },
                { id: 'UTILITY', name: 'Utility Portal Export', desc: 'Resolves complex billing cycle monthly crossovers' },
                { id: 'TRAVEL', name: 'Corporate Travel (Navan/Concur)', desc: 'Processes airport codes into spatial passenger-km vectors' }
              ].map((src) => (
                <button
                  type="button"
                  key={src.id}
                  onClick={() => setSelectedSource(src.id)}
                  className={`p-4 border text-left rounded-lg transition-all duration-150 flex flex-col ${
                    selectedSource === src.id 
                      ? 'bg-indigo-950/40 border-indigo-500 ring-1 ring-indigo-500' 
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700/80'
                  }`}
                >
                  <span className="font-bold text-slate-200 text-sm">{src.name}</span>
                  <span className="text-[11px] text-slate-500 mt-1 font-normal leading-relaxed">{src.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Secure File Upload Dropzone Wrapper */}
          <div className="border-2 border-dashed border-slate-800 hover:border-slate-700 bg-slate-900/30 rounded-xl p-8 transition-colors text-center relative">
            <input 
              type="file" 
              id="file-upload"
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              onChange={handleFileChange}
              accept=".csv,.json"
            />
            <div className="space-y-2 pointer-events-none">
              <svg className="w-8 h-8 text-slate-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <div className="text-sm text-slate-300 font-medium">
                {uploadFile ? <span className="text-indigo-400 font-mono font-bold">{uploadFile.name}</span> : 'Select raw client report document'}
              </div>
              <p className="text-xs text-slate-500">Supports raw operational ledger exports (.csv, .json)</p>
            </div>
          </div>

          {/* Submit Action Block */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={uploading}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800/40 text-white font-semibold py-2.5 px-6 rounded-lg text-sm transition-all shadow-md flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Parsing Structural Elements...
                </>
              ) : 'Execute Normalization Ingestion'}
            </button>
          </div>
        </form>
      </div>

      {/* Real-time Processing Ingestion Feedback Stream */}
      {telemetryLog && (
        <div className={`border p-4 rounded-xl flex items-start gap-3 shadow-lg ${
          telemetryLog.status === 'SUCCESS' 
            ? 'bg-emerald-950/20 border-emerald-900/60 text-emerald-400' 
            : 'bg-red-950/20 border-red-900/60 text-red-400'
        }`}>
          <div className="text-sm font-medium">
            <span className="font-bold tracking-wider uppercase block text-xs mb-0.5">
              Pipeline Operational Feedback [{telemetryLog.status}]
            </span>
            <span className="text-xs text-slate-300 font-mono leading-relaxed">{telemetryLog.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}