import { useState, useEffect } from 'react';
import { authProvider } from '../utils/auth';
import toast,{Toaster} from "react-hot-toast"

export default function AnalystDashboard() {
  const [activities, setActivities] = useState([]);
  const [selectedRow, setSelectedRow] = useState(null);
  const [reason, setReason] = useState("");

 useEffect(() => {
  fetch(`${import.meta.env.VITE_BACKEND_URL}/api/review/`, {
    headers: authProvider.getAuthHeaders()
  })
  .then(res => {
    if (!res.ok) throw new Error("Ledger retrieval failure.");
    return res.json();
  })
  .then(data => setActivities(data))
  .catch(err => console.error("API Handshake Error:", err));
}, []);

  const handleStatusUpdate = (id, newStatus) => {
  if (!reason.trim()) {
    alert("Please provide audit rationale comments before updating records.");
    return;
  }

  fetch(`${import.meta.env.VITE_BACKEND_URL}/api/review/${id}/`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`
    },
    body: JSON.stringify({
      status: newStatus,
      change_reason: reason
    })
  })
    .then(async (res) => {
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData?.error || "Update failed");
      }

      return res.json();
    })
    .then((updated) => {
      toast.success("Record updated successfully");

      setActivities(prev =>
        prev.map(a => a.id === id ? updated : a)
      );

      setSelectedRow(updated);
      setReason("");
    })
    .catch(err => {
      toast.error(err.message);
      console.error(err);
    });
  };

   return (
    <div className="grid grid-cols-3 gap-6">
      <Toaster/>
      
      {/* LEFT MAIN COLUMN */}
      <div className="col-span-2 flex flex-col gap-6">
        {/* Ledger Table */}
        <div className="bg-slate-950 border border-slate-800 rounded-lg shadow-xl overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase text-xs font-semibold tracking-wider">
              <tr>
                <th className="p-4">Activity Stream</th>
                <th className="p-4">Reporting Window</th>
                <th className="p-4">Calculated Impact</th>
                <th className="p-4">Audit Status</th>
              </tr>
            </thead>
    
            <tbody className="divide-y divide-slate-900">
              {activities.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => setSelectedRow(row)}
                  className={`cursor-pointer transition-colors duration-150 ${
                    selectedRow?.id === row.id
                      ? 'bg-indigo-950/40 border-l-4 border-indigo-500'
                      : 'hover:bg-slate-900/50'
                  }`}
                >
                  <td className="p-4">
                    <div className="font-medium text-slate-200">
                      {row.activity_type}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Scope Cat: {row.scope_category}
                    </div>
                  </td>
    
                  <td className="p-4 text-slate-300 font-mono text-xs">
                    {row.start_date} → {row.end_date}
                  </td>
    
                  <td className="p-4">
                    <div className="font-semibold text-emerald-400 font-mono">
                      {row.co2e_metric_tons} MT CO2e
                    </div>
                    <div className="text-xs text-slate-500">
                      {row.normalized_quantity} {row.normalized_unit}
                    </div>
                  </td>
    
                  <td className="p-4">
                    <span
                      className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${
                        row.status === 'SUSPICIOUS'
                          ? 'bg-amber-950 text-amber-400 border border-amber-800'
                          : row.status === 'APPROVED'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : row.status === 'LOCKED'
                          ? 'bg-slate-800 text-slate-400'
                          : 'bg-blue-950 text-blue-400 border border-blue-800'
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Chain of Custody Timeline */}
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-5 shadow-xl">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <svg
              className="w-3.5 h-3.5 text-indigo-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            
            Immutable Audit History Trail ({selectedRow?.audit_history?.length || 0})
          </h4>
          
          {selectedRow?.audit_history?.length > 0 ? (
            <div className="space-y-3 max-h-100 overflow-y-auto pr-1">
              {selectedRow.audit_history.map((log) => (
                <div
                  key={log.id}
                  className="bg-slate-900/80 border border-slate-800 rounded-lg p-3 text-xs space-y-1.5"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-300 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                      {log.user_name || "System Pipeline"}
                    </span>
  
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
  
                  <div className="text-[11px] text-slate-400">
                    Action:
                    <span className="ml-2 text-amber-400 font-mono bg-amber-950/30 px-1.5 py-0.5 rounded border border-amber-900/40">
                      {log.action}
                    </span>
                  </div>
  
                  <div className="grid grid-cols-2 gap-2 bg-slate-950 p-2 rounded border border-slate-800/60 font-mono text-[10px]">
                    <div>
                      <span className="text-red-500 block text-[9px] uppercase font-bold">
                        Previous
                      </span>
                      <span className="text-slate-400">
                        {log.previous_values?.status || 'N/A'}
                      </span>
                    </div>
  
                    <div>
                      <span className="text-emerald-500 block text-[9px] uppercase font-bold">
                        New
                      </span>
                      <span className="text-slate-200 font-bold">
                        {log.new_values?.status || 'N/A'}
                      </span>
                    </div>
                  </div>
  
                  {log.reason && (
                    <div className="bg-slate-950/40 border-l-2 border-slate-700 px-2 py-1 italic text-slate-400 text-[11px]">
                      "{log.reason}"
                    </div>
                  )}
                </div>
              ))}
            </div>
            ) : 
            (<div className="text-slate-500 italic text-[11px] bg-slate-900/40 border border-slate-800/40 rounded-lg p-3 text-center">
              No manual adjustments recorded.
            </div>)}
        </div>
      </div>
      
      {/* RIGHT SIDE PANEL */}
      <div className="bg-slate-950 border border-slate-800 rounded-lg p-5 shadow-xl h-fit sticky top-6">
        {selectedRow ? (
          <div>
            <h3 className="text-lg font-semibold border-b border-slate-800 pb-3 text-slate-200">Audit Verification Trace</h3>
            {selectedRow.flags && selectedRow.flags.length > 0 && (
              <div className="mt-4 bg-amber-950/30 border border-amber-900 rounded p-3 text-xs text-amber-400">
                <span className="font-bold uppercase block mb-1">Pipeline Alerts:</span>
                <ul className="list-disc pl-4 space-y-1">
                  {selectedRow.flags.map((f, i) => <li key={i}>{f}</li>)}
                </ul>
              </div>
            )}
            {/* Immutable Raw Dump Comparison */}
            <div className="mt-5">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-2">Original Raw Ingested Data Blob</span>
              <pre className="bg-slate-900 border border-slate-800 rounded p-3 text-xs font-mono text-emerald-500 overflow-x-auto max-h-48">
                {JSON.stringify(selectedRow.raw_row_payload, null, 2)}
              </pre>
            </div>
            {/* Signoff Actions */}
            {selectedRow.status!=="LOCKED" && <div className="mt-6 border-t border-slate-800 pt-4">
              <label className="block text-xs font-medium text-slate-400 mb-2">Analyst Action Attestation Log</label>
              <textarea 
                className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                placeholder="State review findings or override reason..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />                
              <div className="flex gap-2 mt-3">
                <button 
                  onClick={() => handleStatusUpdate(selectedRow.id, 'APPROVED')}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 transition-colors text-white font-medium py-2 rounded text-sm shadow-md"
                >
                  Verify & Approve
                </button>
                <button 
                  onClick={() => handleStatusUpdate(selectedRow.id, 'LOCKED')}
                  className="bg-indigo-600 hover:bg-indigo-500 transition-colors text-white font-medium px-4 py-2 rounded text-sm shadow-md"
                >
                  Lock for Audit
                </button>
              </div>
            </div>}
          </div>
          ) : (
            <div className="text-center py-12 text-slate-500 text-sm">
              Select an activity transaction field row to launch deep inspection audit verification drawer.
            </div>
          )}
      </div>
    </div>
  ) 
}