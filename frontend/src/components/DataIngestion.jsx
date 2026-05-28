import { useState } from 'react';

export default function DataIngestion() {
  const [selectedSource, setSelectedSource] = useState('SAP');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [telemetryLog, setTelemetryLog] = useState(null);
  const [validationError, setValidationError] = useState(null);

  // Validation mapping: source type to expected filename patterns
  const sourceFilePatterns = {
    'SAP': ['sap'],
    'UTILITY': ['utility'],
    'TRAVEL': ['travel']
  };

  const validateFileMatchesSource = (file, source) => {
    if (!file) return true; 
    
    const fileName = file.name.toLowerCase();
    const patterns = sourceFilePatterns[source] || [];
    
    const matches = patterns.some(pattern => fileName.includes(pattern));
    
    if (!matches) {
      return `File mismatch: "${file.name}" does not match the selected "${source}" source. Expected filename to contain: ${patterns.join(' or ')}.`;
    }
    
    return null; 
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0]);
      setValidationError(null);
      
      // Validate file on selection
      const error = validateFileMatchesSource(e.target.files[0], selectedSource);
      if (error) {
        setValidationError(error);
      }
    }
  };

  const handleIngestSubmit = async (e) => {
  e.preventDefault();
  if (!uploadFile) {
    alert("Please attach a valid source data file to process.");
    return;
  }

  // Validate file matches selected source
  const validationErrorMsg = validateFileMatchesSource(uploadFile, selectedSource);
  if (validationErrorMsg) {
    setValidationError(validationErrorMsg);
    return;
  }

  setValidationError(null);

  setUploading(true);
  setTelemetryLog(null);

  const payload = new FormData();
  payload.append('file', uploadFile);
  payload.append('source_type', selectedSource);
  
  const mockSourceMap = { 'SAP': '1', 'UTILITY': '2', 'TRAVEL': '3' };
  payload.append('source_id', mockSourceMap[selectedSource]);

  try {
    const accessToken = localStorage.getItem('access_token');
    
    const uploadHeaders = {};
    if (accessToken) {
      uploadHeaders['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/ingest/`, {
      method: 'POST',
      headers: uploadHeaders, 
      body: payload           
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
                  onClick={() => {
                    setSelectedSource(src.id);
                    setValidationError(null);
                    // Re-validate current file against new source
                    if (uploadFile) {
                      const error = validateFileMatchesSource(uploadFile, src.id);
                      if (error) {
                        setValidationError(error);
                      }
                    }
                  }}
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
                {uploadFile ? <span className={`font-mono font-bold ${validationError ? 'text-red-400' : 'text-indigo-400'}`}>{uploadFile.name}</span> : 'Select raw client report document'}
              </div>
              <p className="text-xs text-slate-500">Supports raw operational ledger exports (.csv, .json)</p>
            </div>
          </div>

          {/* Validation Error Display */}
          {validationError && (
            <div className="bg-red-950/30 border border-red-900/60 text-red-400 p-3 rounded-lg flex items-start gap-2">
              <svg className="w-5 h-5 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div className="text-xs">
                <span className="font-bold block mb-1">File Source Mismatch</span>
                <span className="text-red-300">{validationError}</span>
              </div>
            </div>
          )}

          {/* Submit Action Block */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={uploading || !!validationError}
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