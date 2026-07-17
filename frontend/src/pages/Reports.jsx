import React, { useEffect, useState } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";

const API_BASE = "http://127.0.0.1:8000";

export default function Reports() {
  const { t } = useTranslation();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [previewReportId, setPreviewReportId] = useState(null);
  const [error, setError] = useState(null);
  const [pdfLang, setPdfLang] = useState("hi");

  // Fetch report list
  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/report/list`);
      setReports(res.data);
    } catch (err) {
      setError("Failed to fetch historical reports.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      const res = await axios.post(`${API_BASE}/report/generate?lang=${pdfLang}`);
      if (res.data.status === "success") {
        await fetchReports(); // Refresh the list
        setPreviewReportId(res.data.report_id); // Auto open preview
      }
    } catch (err) {
      alert("Failed to generate report. Make sure analysis has been run first.");
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = (reportId) => {
    const url = `${API_BASE}/report/download/${reportId}`;
    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.download = `${reportId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <div className="flex-1 p-8 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex justify-between items-end mb-10 pb-6 border-b border-forest-900/30">
          <div>
            <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">
              {t('reports_title')}
            </h1>
            <p className="text-forest-300 text-lg">Generate, preview, and download formal environmental analysis reports.</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <select
                value={pdfLang}
                onChange={(e) => setPdfLang(e.target.value)}
                disabled={generating}
                className="bg-forest-950/80 border border-forest-700/50 text-forest-200 text-sm rounded-xl focus:ring-emerald-500 focus:border-emerald-500 block px-4 py-3 outline-none appearance-none cursor-pointer pr-10 shadow-xl"
              >
                <option value="en">English Only</option>
                <option value="hi">+ हिंदी (Hindi)</option>
                <option value="mr">+ मराठी (Marathi)</option>
                <option value="gu">+ ગુજરાતી (Gujarati)</option>
                <option value="ta">+ தமிழ் (Tamil)</option>
                <option value="te">+ తెలుగు (Telugu)</option>
                <option value="kn">+ ಕನ್ನಡ (Kannada)</option>
                <option value="ml">+ മലയാളം (Malayalam)</option>
                <option value="bn">+ বাংলা (Bengali)</option>
                <option value="pa">+ ਪੰਜਾਬੀ (Punjabi)</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-forest-400">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
            </div>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium tracking-wide transition-all shadow-xl
                ${generating 
                  ? 'bg-forest-900 text-forest-400 cursor-not-allowed border border-forest-800' 
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/20 hover:-translate-y-0.5'
                }`}
            >
              {generating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-forest-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>{t('generating')}</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  <span>{t('generate_report')}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Report List */}
        <div className="glass-panel p-8">
          {reports.length === 0 ? (
            <div className="text-center py-16">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-forest-700 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-xl font-medium text-forest-200 mb-2">No Reports Available</h3>
              <p className="text-forest-400">Run an analysis and click generate to create your first report.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-forest-900/30">
              <table className="min-w-full divide-y divide-forest-900/50">
                <thead className="bg-forest-950/80">
                  <tr>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-forest-300 uppercase tracking-wider">Report ID</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-forest-300 uppercase tracking-wider">Generated Date</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-forest-300 uppercase tracking-wider">Format</th>
                    <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-forest-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-forest-900/20 bg-forest-900/10">
                  {reports.map((report) => (
                    <tr key={report.id} className="hover:bg-forest-900/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          <span className="text-sm font-medium text-forest-100">{report.id}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-forest-300">{report.date}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-900/40 text-red-400 border border-red-800/50">
                          PDF Document
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                        <a 
                          href={`${API_BASE}${report.url}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-emerald-400 hover:text-emerald-300 transition-colors inline-flex items-center"
                        >
                          {t('preview')}
                        </a>
                        <a 
                          href={`${API_BASE}${report.url}`} 
                          download
                          className="text-forest-300 hover:text-white transition-colors inline-flex items-center"
                        >
                          {t('download_pdf')}
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>

      {/* Preview Modal */}
      {previewReportId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-950/50">
              <h3 className="text-white font-bold flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                Document Preview: {previewReportId}.pdf
              </h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleDownload(previewReportId)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition"
                >
                  Download PDF
                </button>
                <button
                  onClick={() => setPreviewReportId(null)}
                  className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 p-2 rounded-lg transition"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                </button>
              </div>
            </div>
            <div className="flex-1 bg-slate-800 relative">
              <iframe
                src={`${API_BASE}/report/download/${previewReportId}#toolbar=0`}
                className="absolute inset-0 w-full h-full border-none rounded-b-3xl bg-white"
                title="PDF Preview"
              ></iframe>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
