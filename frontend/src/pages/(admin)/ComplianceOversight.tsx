
export default function ComplianceOversight() {
  const auditLogs = [
    { id: 1, action: "KYC Document Flagged: Name Mismatch", user: "AI Agent - AutoCheck", time: "Just now", severity: "high" },
    { id: 2, action: "Branch Transfer Approved: RM2-007", user: "Vikram Singh", time: "12 mins ago", severity: "info" },
    { id: 3, action: "New Regulation Ingested: RBI Circular 2026", user: "System", time: "1 hour ago", severity: "low" },
    { id: 4, action: "Suspicious Transaction: Acc #8890", user: "AI Agent - TransactionMonitor", time: "2 hours ago", severity: "high" },
  ];

  return (
    <div className="flex flex-col h-full w-full bg-[#ffffff] p-8 font-sans">
      <header className="mb-10">
        <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">Compliance Oversight Monitoring</h1>
        <p className="text-gray-500 mt-2">Macro-view panel tracking the absolute compliance health of the branch.</p>
      </header>

      {/* Metrics Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <div className="bg-red-50/50 border border-red-100 rounded-md p-6 flex flex-col justify-center">
          <h2 className="text-sm font-semibold text-red-600 uppercase tracking-wider mb-2">Total Flags Raised by AI Agents</h2>
          <div className="text-5xl font-bold text-red-700 tracking-tight">24</div>
          <p className="text-sm text-red-500 mt-2 font-medium">+3 since yesterday. Requires immediate attention.</p>
        </div>
        <div className="bg-amber-50/50 border border-amber-100 rounded-md p-6 flex flex-col justify-center">
          <h2 className="text-sm font-semibold text-amber-600 uppercase tracking-wider mb-2">Overdue Regulatory Deadlines</h2>
          <div className="text-5xl font-bold text-amber-700 tracking-tight">2</div>
          <p className="text-sm text-amber-600 mt-2 font-medium">RBI Reporting deadline exceeded by 1 day.</p>
        </div>
      </div>

      {/* Real-time Audit Trail Log */}
      <section className="bg-white border border-[rgba(0,0,0,0.1)] rounded-md shadow-sm overflow-hidden flex-1 flex flex-col">
        <div className="px-6 py-5 border-b border-[rgba(0,0,0,0.1)] flex items-center justify-between bg-[#f3f3f5]/30">
          <h2 className="text-lg font-semibold text-gray-900">Real-Time Audit Trail Log</h2>
          <button className="text-sm text-[#030213] hover:text-[#030213] font-medium flex items-center gap-1 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg>
            Filter Logs
          </button>
        </div>
        <div className="p-0 overflow-y-auto max-h-[400px]">
          <ul className="divide-y divide-gray-50">
            {auditLogs.map((log) => (
              <li key={log.id} className="p-6 hover:bg-[#f3f3f5]/50 transition-colors flex items-start gap-4">
                <div className={`mt-1.5 flex-shrink-0 w-2.5 h-2.5 rounded-full shadow-sm ${
                  log.severity === 'high' ? 'bg-red-500 shadow-red-200' :
                  log.severity === 'info' ? 'bg-[#030213] shadow-blue-200' : 'bg-gray-300 shadow-gray-200'
                }`}></div>
                <div className="flex-1">
                  <p className="text-base font-medium text-gray-900">{log.action}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-sm text-gray-500">
                    <span className="flex items-center gap-1 font-medium">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                      {log.user}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                    <span>{log.time}</span>
                  </div>
                </div>
                <button className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
                  Details
                </button>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
