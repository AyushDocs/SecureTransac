import { useState } from "react";
import { generateStealthAddress, processReport } from "../api/client";
import { useAuth } from "../context/AuthContext";
import PageWrapper from "../layout/PageWrapper";

function SubmitReport() {
  const { user, role, activeRole } = useAuth();
  const currentRole = activeRole || role;
  const isCompany = currentRole === 'company';

  const [targetAddress, setTargetAddress] = useState("");
  const [reportReason, setReportReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Stealth Reporting
  const [stealthData, setStealthData] = useState(null);
  const [useStealth, setUseStealth] = useState(false);
  const [generatingStealth, setGeneratingStealth] = useState(false);

  const handleGenerateStealth = async () => {
    setGeneratingStealth(true);
    try {
      const result = await generateStealthAddress();
      if (result.success) {
        setStealthData(result);
        setUseStealth(true);
      }
    } catch (error) {
      console.error(error);
      alert("Failed to generate stealth identity.");
    } finally {
      setGeneratingStealth(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!targetAddress || !reportReason) return;
    
    if (targetAddress.toLowerCase() === user.address.toLowerCase()) {
        alert("You cannot report yourself.");
        return;
    }

    const reporterAddress = (useStealth && stealthData) ? stealthData.stealthAddress : user.address;
    
    setLoading(true);
    try {
      await processReport(reporterAddress, targetAddress, reportReason);
      setSuccess(true);
      setTargetAddress("");
      setReportReason("");
      // Reset stealth if it was one-time
      if (useStealth) {
          setStealthData(null);
          setUseStealth(false);
      }
      setTimeout(() => setSuccess(false), 5000);
    } catch (error) {
      alert("Failed to submit report. Please check the address and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper title="Submit a System Report">
      <div className="max-w-2xl mx-auto">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 shadow-xl">
          <div className="flex items-center gap-4 mb-6">
            <div className={`p-3 rounded-full ${isCompany ? 'bg-red-500/20 text-red-500' : 'bg-yellow-500/20 text-yellow-500'}`}>
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Report Suspicious Activity</h2>
              <p className="text-gray-400">Help protect the ecosystem by flagging bad actors.</p>
            </div>
          </div>

          {isCompany && (
            <div className="mb-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg flex items-start gap-3">
              <span className="text-xl">🛡️</span>
              <div>
                <h4 className="text-blue-400 font-bold text-sm uppercase">Trusted Company Access</h4>
                <p className="text-blue-300/80 text-xs mt-1">
                  Your reports carry <span className="text-white font-bold">significantly higher weight (5x)</span> in our AI scoring model. 
                  Please verify all claims thoroughly before submitting. False reporting may lead to authority revocation.
                </p>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg text-green-400 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              <span>Report submitted successfully. The Trust Score has been updated.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Target Wallet Address</label>
              <div className="relative">
                <input 
                  type="text" 
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg pl-10 pr-4 py-3 text-white focus:ring-1 focus:ring-red-500 focus:border-red-500 outline-none transition-all font-mono"
                  placeholder="0x..."
                  value={targetAddress}
                  onChange={(e) => setTargetAddress(e.target.value)}
                  required
                />
                <div className="absolute left-3 top-3 text-gray-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Reason for Report</label>
              <textarea 
                className="w-full bg-gray-950 border border-gray-800 rounded-lg p-4 text-white focus:ring-1 focus:ring-red-500 focus:border-red-500 outline-none transition-all min-h-[120px]"
                placeholder="Describe the suspicious behavior (e.g., 'Phishing attempt via email', 'Rug pull scam', 'Identity theft')..."
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                required
              />
              <p className="text-xs text-gray-600 mt-2 text-right">
                Keywords like "scam", "fraud", "theft" trigger immediate AI analysis.
              </p>
            </div>

            <div className="bg-gray-950 border border-gray-800 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900/40">
                    <div className="flex items-center gap-2">
                        <span className="text-lg">🕶️</span>
                        <div>
                            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Privacy Protection</h4>
                            <p className="text-[10px] text-gray-500">Submit this report using a one-time stealth identity.</p>
                        </div>
                    </div>
                </div>
                
                <div className="p-4 space-y-4">
                    {!stealthData ? (
                        <button 
                            type="button"
                            onClick={handleGenerateStealth}
                            disabled={generatingStealth}
                            className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold rounded-lg transition-colors border border-gray-700 flex items-center justify-center gap-2"
                        >
                            {generatingStealth ? (
                                <div className="w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                            ) : "👻 Generate Stealth Identity"}
                        </button>
                    ) : (
                        <div className="flex items-center justify-between bg-indigo-500/10 border border-indigo-500/20 p-3 rounded-lg">
                            <div className="min-w-0">
                                <div className="text-[10px] text-white font-bold flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                    Stealth ID Active
                                </div>
                                <div className="text-[9px] text-indigo-400 font-mono truncate w-48">{stealthData.stealthAddress}</div>
                            </div>
                            <div className="flex items-center gap-3">
                                <label className="relative inline-flex items-center cursor-pointer scale-90">
                                    <input 
                                        type="checkbox" 
                                        className="sr-only peer" 
                                        checked={useStealth}
                                        onChange={() => setUseStealth(!useStealth)}
                                    />
                                    <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                                </label>
                                <button type="button" onClick={() => setStealthData(null)} title="Clear Stealth ID" className="text-gray-600 hover:text-red-500 transition-colors">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v2m4 0h3-10z" /></svg>
                                </button>
                            </div>
                        </div>
                    )}
                    
                    {useStealth && (
                        <div className="p-2 bg-yellow-500/10 border border-yellow-500/20 rounded text-[9px] text-yellow-500/70 italic">
                            <b>Privacy Warning:</b> Using a stealth address ensures your real handle is hidden, but you will not earn reputation rewards for this report.
                        </div>
                    )}
                </div>
            </div>

            <button 
              type="submit" 
              disabled={loading || !targetAddress || !reportReason}
              className={`w-full py-4 rounded-lg font-bold text-white uppercase tracking-wider transition-all transform hover:-translate-y-1 ${
                loading 
                  ? 'bg-gray-700 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 shadow-lg shadow-red-900/30'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Processing...
                </span>
              ) : (
                "Submit Critical Report"
              )}
            </button>
          </form>
        </div>
      </div>
    </PageWrapper>
  );
}

export default SubmitReport;
