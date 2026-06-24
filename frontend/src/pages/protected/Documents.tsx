import {
  Calendar,
  Check,
  Download,
  Eye,
  FileText,
  Plus,
  Search,
  X,
  BookOpen,
  ArrowRight,
  Info,
  ShieldAlert,
} from 'lucide-react';
import React, { useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DocumentItem {
  id: string;
  title: string;
  circularNumber: string;
  category: string;
  uploadDate: string;
  fileSize: string;
  description: string;
  author: string;
  version: string;
  complianceDeadlines?: string;
  regulatoryScope?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  'All',
  'Master Directions',
  'Circulars',
  'Internal Policies',
  'External Guidelines',
];

const INITIAL_DOCUMENTS: DocumentItem[] = [
  {
    id: 'DOC-1024',
    title: 'RBI Master Direction - KYC (Know Your Customer) Guidelines',
    circularNumber: 'RBI/2016-17/49',
    category: 'Master Directions',
    uploadDate: '12 Jun 2026',
    fileSize: '1.2 MB',
    description: 'Consolidated instructions on Customer Acceptance Policy, Customer Identification Procedures, and Monitoring of Transactions. Updated with latest guidelines on digital onboarding and video-based KYC verification.',
    author: 'Compliance Dept',
    version: 'v4.2',
    complianceDeadlines: 'Strict compliance by Q3 2026 audit cycles.',
    regulatoryScope: 'All retail and corporate onboarding channels.'
  },
  {
    id: 'DOC-1025',
    title: 'Basel III Guidelines on Capital Adequacy & Risk Management',
    circularNumber: 'RBI/2012-13/56',
    category: 'External Guidelines',
    uploadDate: '15 May 2026',
    fileSize: '3.4 MB',
    description: 'Comprehensive guidelines establishing implementation criteria for capital conservation buffer, leverage ratio benchmarks, and liquidity coverage ratio regulations across all scheduled commercial banks.',
    author: 'Risk Policy Team',
    version: 'v3.1',
    complianceDeadlines: 'Quarterly reporting aligned with capital adequacy frameworks.',
    regulatoryScope: 'Treasury operations, Risk management team, and Asset-Liability Committee.'
  },
  {
    id: 'DOC-1026',
    title: 'Master Circular on Housing Finance and Retail Loans',
    circularNumber: 'RBI/2015-16/32',
    category: 'Circulars',
    uploadDate: '08 Jun 2026',
    fileSize: '850 KB',
    description: 'Consolidated instructions regarding credit standards, valuation protocols for mortgaged properties, loan-to-value (LTV) limits, and risk weights applicable to retail housing finance.',
    author: 'Lending Operations',
    version: 'v2.0',
    complianceDeadlines: 'Immediate alignment on new mortgage approvals.',
    regulatoryScope: 'Retail lending desks, underwriters, and branch credit managers.'
  },
  {
    id: 'DOC-1027',
    title: 'Internal Credit Risk & Underwriting Policy - FY26',
    circularNumber: 'N/A',
    category: 'Internal Policies',
    uploadDate: '01 Jun 2026',
    fileSize: '450 KB',
    description: 'Internal governance framework setting limits, credit rating matrices, delegation powers for credit approvals, and exposure benchmarks across various industry sectors.',
    author: 'Credit Risk Committee',
    version: 'v1.0',
    complianceDeadlines: 'Annual review due in May 2027.',
    regulatoryScope: 'Internal lending operations and credit sanctioning committees.'
  },
  {
    id: 'DOC-1028',
    title: 'RBI Guidelines on Cyber Security Framework in Banks',
    circularNumber: 'RBI/2016-17/204',
    category: 'Circulars',
    uploadDate: '22 May 2026',
    fileSize: '2.1 MB',
    description: 'Mandatory information security controls, incident reporting procedures, threat intelligence sharing platforms, and governance mechanisms for managing third-party technology risks.',
    author: 'IT Security Dept',
    version: 'v2.3',
    complianceDeadlines: 'Real-time alert logging verification required by July 2026.',
    regulatoryScope: 'IT security operations, data center engineers, and technology audit teams.'
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getCategoryStyles = (category: string) => {
  switch (category) {
    case 'Master Directions':
      return 'bg-[#f3f3f5] text-[#030213] ring-1 ring-[#030213]/10';
    case 'Circulars':
      return 'bg-amber-50 text-amber-700 ring-1 ring-amber-700/10';
    case 'Internal Policies':
      return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-700/10';
    case 'External Guidelines':
      return 'bg-purple-50 text-purple-700 ring-1 ring-purple-700/10';
    default:
      return 'bg-[#f3f3f5] text-gray-700 ring-1 ring-gray-700/10';
  }
};

// ─── Main Component ───────────────────────────────────────────────────────────

const Documents = () => {
  const [documents, setDocuments] = useState<DocumentItem[]>(INITIAL_DOCUMENTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadedIds, setDownloadedIds] = useState<Set<string>>(new Set());

  // Upload Form State
  const [newTitle, setNewTitle] = useState('');
  const [newCircular, setNewCircular] = useState('');
  const [newCategory, setNewCategory] = useState('Master Directions');
  const [newDescription, setNewDescription] = useState('');
  const [newAuthor, setNewAuthor] = useState('Compliance Dept');
  const [newVersion, setNewVersion] = useState('v1.0');
  const [formError, setFormError] = useState('');

  // Handle Search and Filter
  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.circularNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'All' || doc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Handle Mock File Download Simulation
  const triggerDownload = (id: string) => {
    setDownloadingId(id);
    setTimeout(() => {
      setDownloadedIds((prev) => {
        const next = new Set(prev);
        next.add(id);
        return next;
      });
      setDownloadingId(null);
    }, 1200);
  };

  // Handle Form Submission
  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim()) {
      setFormError('Please fill in all required fields (Title and Description).');
      return;
    }

    const newDoc: DocumentItem = {
      id: `DOC-${1000 + documents.length + 1}`,
      title: newTitle,
      circularNumber: newCircular.trim() || 'N/A',
      category: newCategory,
      uploadDate: new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      fileSize: '1.4 MB', // standard mock file size
      description: newDescription,
      author: newAuthor || 'Compliance Dept',
      version: newVersion || 'v1.0',
      complianceDeadlines: 'Immediate audit compliance check applicable.',
      regulatoryScope: 'Standard branch operations.',
    };

    setDocuments((prev) => [newDoc, ...prev]);

    // Reset Form
    setNewTitle('');
    setNewCircular('');
    setNewCategory('Master Directions');
    setNewDescription('');
    setNewAuthor('Compliance Dept');
    setNewVersion('v1.0');
    setFormError('');
    setIsUploadModalOpen(false);
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 font-sans relative min-h-screen">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Documents</h1>
          <p className="text-[14px] text-gray-500 mt-1">
            Repository of active banking regulations, RBI circulars, and branch policies.
          </p>
        </div>
        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="inline-flex items-center gap-2 bg-[#030213] text-white hover:bg-opacity-95 active:scale-98 transition-all px-4 h-10 rounded-md text-[13px] font-semibold cursor-pointer shadow-sm self-start sm:self-center"
        >
          <Plus size={16} />
          Upload Document
        </button>
      </div>

      {/* ── Search & Filter Pill Options ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-md border border-[rgba(0,0,0,0.1)] shadow-sm">
        <div className="relative w-full md:max-w-md">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search by title or RBI circular number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-md border border-[rgba(0,0,0,0.1)] bg-[#f3f3f5] text-[14px] text-gray-900 placeholder:text-gray-400 outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-[#030213]/20 transition-all"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-md text-[13px] font-semibold transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#030213] text-white'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 border border-transparent hover:border-[rgba(0,0,0,0.1)]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── Repository Table ── */}
      <div className="bg-white rounded-md border border-[rgba(0,0,0,0.1)] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[850px]">
            <thead>
              <tr className="bg-[#f3f3f5]/50 border-b border-[rgba(0,0,0,0.1)] text-[12px] font-semibold text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-4">Document Details</th>
                <th className="px-6 py-4 w-48">Category</th>
                <th className="px-6 py-4 w-40">Upload Date</th>
                <th className="px-6 py-4 w-32">File Size</th>
                <th className="px-6 py-4 w-52 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredDocs.length > 0 ? (
                filteredDocs.map((doc) => (
                  <tr key={doc.id} className="group hover:bg-[#f3f3f5]/70 transition-colors">
                    {/* Details Column */}
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-md bg-red-50 text-red-600 flex flex-col items-center justify-center shrink-0 border border-red-100 relative shadow-sm">
                          <FileText size={18} />
                          <span className="text-[7px] font-bold absolute bottom-0.5 tracking-tight uppercase">PDF</span>
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-[14px] font-bold text-gray-900 group-hover:text-[#030213] transition-colors pr-4">
                            {doc.title}
                          </h3>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-mono font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded border border-[rgba(0,0,0,0.1)]/50">
                              {doc.id}
                            </span>
                            {doc.circularNumber !== 'N/A' && (
                              <span className="text-[11px] font-mono font-medium text-[#030213] bg-[#f3f3f5]/50 px-1.5 py-0.5 rounded border border-[rgba(0,0,0,0.1)]/50">
                                Circular: {doc.circularNumber}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Category Column */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${getCategoryStyles(doc.category)}`}>
                        {doc.category}
                      </span>
                    </td>

                    {/* Date Column */}
                    <td className="px-6 py-4 text-[13px] text-gray-500 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={14} className="text-gray-400" />
                        {doc.uploadDate}
                      </div>
                    </td>

                    {/* Size Column */}
                    <td className="px-6 py-4 text-[13px] text-gray-500 font-medium">
                      {doc.fileSize}
                    </td>

                    {/* Actions Column */}
                    <td className="px-6 py-4 align-middle text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => setSelectedDoc(doc)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[rgba(0,0,0,0.1)] bg-white hover:bg-[#f3f3f5] text-gray-700 hover:text-gray-900 text-[12px] font-semibold transition-colors cursor-pointer shadow-sm"
                        >
                          <Eye size={14} />
                          View
                        </button>

                        <button
                          onClick={() => triggerDownload(doc.id)}
                          disabled={downloadingId === doc.id}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-semibold transition-all cursor-pointer ${
                            downloadedIds.has(doc.id)
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : downloadingId === doc.id
                              ? 'bg-gray-100 text-gray-400 border border-[rgba(0,0,0,0.1)] cursor-not-allowed'
                              : 'bg-[#030213] text-white hover:bg-opacity-90 shadow-sm'
                          }`}
                        >
                          {downloadingId === doc.id ? (
                            <>
                              <svg className="animate-spin h-3.5 w-3.5 text-gray-500" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              Progress
                            </>
                          ) : downloadedIds.has(doc.id) ? (
                            <>
                              <Check size={14} />
                              Downloaded
                            </>
                          ) : (
                            <>
                              <Download size={14} />
                              Download
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400 text-[14px]">
                    No regulations or documents matching your search filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Details Slide-over Panel (Drawer) ── */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 overflow-hidden" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
          <div className="absolute inset-0 overflow-hidden">
            {/* Backdrop Overlay */}
            <div
              onClick={() => setSelectedDoc(null)}
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-xs transition-opacity duration-300"
            />

            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <div className="pointer-events-auto w-screen max-w-md transform bg-white shadow-xl transition-all duration-300 ease-in-out border-l border-[rgba(0,0,0,0.1)]">
                <div className="flex h-full flex-col overflow-y-scroll bg-white">
                  {/* Drawer Header */}
                  <div className="bg-[#f3f3f5] border-b border-[rgba(0,0,0,0.1)] px-6 py-5">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <span className="inline-flex items-center rounded-md bg-[#f3f3f5] px-2 py-0.5 text-[11px] font-mono font-medium text-[#030213] ring-1 ring-inset ring-[#030213]/10">
                          {selectedDoc.id}
                        </span>
                        <h2 className="text-lg font-bold text-gray-900 pr-2">
                          {selectedDoc.title}
                        </h2>
                      </div>
                      <div className="ml-3 flex h-7 items-center">
                        <button
                          type="button"
                          onClick={() => setSelectedDoc(null)}
                          className="rounded-md bg-white text-gray-400 hover:text-gray-500 outline-none p-1.5 border border-[rgba(0,0,0,0.1)] hover:border-gray-300 transition-all cursor-pointer"
                        >
                          <span className="sr-only">Close panel</span>
                          <X size={18} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Drawer Body */}
                  <div className="flex-1 px-6 py-6 space-y-6">
                    {/* Metadata Grid */}
                    <div className="bg-[#f3f3f5] rounded-md p-4 border border-[rgba(0,0,0,0.1)]/60 grid grid-cols-2 gap-y-4 gap-x-6">
                      <div>
                        <span className="text-[11px] text-gray-400 block font-semibold uppercase tracking-wider">Category</span>
                        <span className="text-[13px] text-gray-700 font-bold">{selectedDoc.category}</span>
                      </div>
                      <div>
                        <span className="text-[11px] text-gray-400 block font-semibold uppercase tracking-wider">Circular Number</span>
                        <span className="text-[13px] text-gray-700 font-mono font-semibold">{selectedDoc.circularNumber}</span>
                      </div>
                      <div>
                        <span className="text-[11px] text-gray-400 block font-semibold uppercase tracking-wider">Upload Date</span>
                        <span className="text-[13px] text-gray-700 font-medium">{selectedDoc.uploadDate}</span>
                      </div>
                      <div>
                        <span className="text-[11px] text-gray-400 block font-semibold uppercase tracking-wider">File Size</span>
                        <span className="text-[13px] text-gray-700 font-medium">{selectedDoc.fileSize}</span>
                      </div>
                      <div>
                        <span className="text-[11px] text-gray-400 block font-semibold uppercase tracking-wider">Author / Desk</span>
                        <span className="text-[13px] text-gray-700 font-medium">{selectedDoc.author}</span>
                      </div>
                      <div>
                        <span className="text-[11px] text-gray-400 block font-semibold uppercase tracking-wider">Version</span>
                        <span className="text-[13px] text-gray-700 font-semibold">{selectedDoc.version}</span>
                      </div>
                    </div>

                    {/* Summary */}
                    <div className="space-y-2">
                      <h4 className="text-[12px] font-bold uppercase text-gray-400 tracking-wider">Overview Summary</h4>
                      <p className="text-[13px] text-gray-600 leading-relaxed bg-white">
                        {selectedDoc.description}
                      </p>
                    </div>

                    {/* Applicability & Compliance Deadlines */}
                    <div className="space-y-3 border-t border-[rgba(0,0,0,0.1)] pt-5">
                      <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200/50 p-3 rounded-md">
                        <ShieldAlert size={16} className="shrink-0" />
                        <div className="text-[12px] font-medium leading-normal">
                          <span className="font-bold">Compliance Checklist:</span> {selectedDoc.complianceDeadlines}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-gray-700 bg-[#f3f3f5] border border-[rgba(0,0,0,0.1)]/50 p-3 rounded-md">
                        <Info size={16} className="shrink-0 text-gray-400" />
                        <div className="text-[12px] leading-normal font-medium">
                          <span className="font-bold text-gray-600">Scope:</span> {selectedDoc.regulatoryScope}
                        </div>
                      </div>
                    </div>

                    {/* Simulated Document Preview */}
                    <div className="space-y-2 border-t border-[rgba(0,0,0,0.1)] pt-5">
                      <h4 className="text-[12px] font-bold uppercase text-gray-400 tracking-wider">Document Preview</h4>
                      <div className="border border-[rgba(0,0,0,0.1)] rounded-md p-4 bg-gray-900 text-gray-100 font-mono text-[11px] h-44 overflow-y-auto leading-relaxed select-none">
                        <span className="text-gray-400 block border-b border-gray-800 pb-1.5 mb-2">[PREVIEW ONLY - SECURE ENVIRONMENT]</span>
                        RESERVE BANK OF INDIA guidelines under regulatory reference.<br/>
                        <br/>
                        1. GENERAL FRAMEWORK AND ONBOARDING STATUS<br/>
                        Pursuant to section 35A of the Banking Regulation Act, 1949, commercial banks are instructed to verify consumer risk rating.<br/>
                        <br/>
                        2. INTERNAL SYSTEM CONTROLS AND SANCTIONS<br/>
                        All transactions over authorized limits must generate instant system log points. Compliance tracking tools are mandatory across branches.
                      </div>
                    </div>
                  </div>

                  {/* Drawer Footer Actions */}
                  <div className="border-t border-[rgba(0,0,0,0.1)] px-6 py-5 bg-[#f3f3f5] flex items-center justify-end gap-3">
                    <button
                      onClick={() => setSelectedDoc(null)}
                      className="px-4 py-2 border border-[rgba(0,0,0,0.1)] rounded-md text-gray-700 hover:bg-gray-100 transition-colors text-[13px] font-semibold cursor-pointer"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => {
                        triggerDownload(selectedDoc.id);
                        setSelectedDoc(null);
                      }}
                      className="px-4 py-2 bg-[#030213] text-white hover:bg-opacity-90 rounded-md text-[13px] font-semibold transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
                    >
                      <Download size={14} />
                      Download Document
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Upload Document Modal ── */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
            {/* Backdrop Blur Overlay */}
            <div
              onClick={() => setIsUploadModalOpen(false)}
              className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs transition-opacity duration-300"
            />

            {/* Modal Box */}
            <div className="relative transform overflow-hidden rounded-md bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg border border-[rgba(0,0,0,0.1)]">
              <div className="bg-white px-6 pb-6 pt-5">
                <div className="flex items-center justify-between border-b border-[rgba(0,0,0,0.1)] pb-3.5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-md bg-[#f3f3f5] text-[#030213] flex items-center justify-center border border-[rgba(0,0,0,0.1)]">
                      <BookOpen size={16} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900" id="modal-title">
                        Upload Regulation Document
                      </h3>
                      <p className="text-[12px] text-gray-400 mt-0.5">Add banking guidelines to the central branch repository.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsUploadModalOpen(false)}
                    className="text-gray-400 hover:text-gray-500 border border-gray-150 hover:border-[rgba(0,0,0,0.1)] rounded-md p-1.5 transition-colors cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>

                {formError && (
                  <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md text-[12px] font-medium border border-red-200">
                    {formError}
                  </div>
                )}

                <form onSubmit={handleUploadSubmit} className="mt-4 space-y-4">
                  {/* Title */}
                  <div>
                    <label className="block text-[12px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Document Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. RBI Master Direction - KYC Guidelines"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full h-10 px-3 rounded-md border border-[rgba(0,0,0,0.1)] bg-[#f3f3f5] text-[13px] text-gray-900 placeholder:text-gray-400 outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-[#030213]/20 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Circular Number */}
                    <div>
                      <label className="block text-[12px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                        RBI Circular Reference
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. RBI/2016-17/49"
                        value={newCircular}
                        onChange={(e) => setNewCircular(e.target.value)}
                        className="w-full h-10 px-3 rounded-md border border-[rgba(0,0,0,0.1)] bg-[#f3f3f5] text-[13px] text-gray-900 placeholder:text-gray-400 outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-[#030213]/20 transition-all"
                      />
                    </div>

                    {/* Category Selection */}
                    <div>
                      <label className="block text-[12px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                        Category <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        className="w-full h-10 px-3 rounded-md border border-[rgba(0,0,0,0.1)] bg-white text-[13px] text-gray-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-[#030213]/20 transition-all cursor-pointer"
                      >
                        {CATEGORIES.filter((c) => c !== 'All').map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Author Dept */}
                    <div>
                      <label className="block text-[12px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                        Author / Issuing Body
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Compliance Dept"
                        value={newAuthor}
                        onChange={(e) => setNewAuthor(e.target.value)}
                        className="w-full h-10 px-3 rounded-md border border-[rgba(0,0,0,0.1)] bg-[#f3f3f5] text-[13px] text-gray-900 placeholder:text-gray-400 outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-[#030213]/20 transition-all"
                      />
                    </div>

                    {/* Version */}
                    <div>
                      <label className="block text-[12px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                        Document Version
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. v1.0"
                        value={newVersion}
                        onChange={(e) => setNewVersion(e.target.value)}
                        className="w-full h-10 px-3 rounded-md border border-[rgba(0,0,0,0.1)] bg-[#f3f3f5] text-[13px] text-gray-900 placeholder:text-gray-400 outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-[#030213]/20 transition-all"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-[12px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Overview & Applicability Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Brief overview explaining what rules are covered in this regulation guidelines..."
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      className="w-full p-3 rounded-md border border-[rgba(0,0,0,0.1)] bg-[#f3f3f5] text-[13px] text-gray-900 placeholder:text-gray-400 outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-[#030213]/20 transition-all resize-none"
                    />
                  </div>

                  {/* Fake File Selection */}
                  <div className="border border-dashed border-[rgba(0,0,0,0.1)] rounded-md p-5 bg-[#f3f3f5] hover:bg-gray-100/50 transition-colors flex flex-col items-center justify-center text-center cursor-pointer select-none">
                    <FileText size={24} className="text-gray-400 mb-2" />
                    <span className="text-[12px] font-bold text-gray-700">regulatory_policy_rbi_update.pdf</span>
                    <span className="text-[11px] text-gray-400 mt-0.5">Drag new PDF circular file or click to browse</span>
                  </div>
                </form>
              </div>

              {/* Modal Footer */}
              <div className="bg-[#f3f3f5] px-6 py-4 flex items-center justify-end gap-3 border-t border-[rgba(0,0,0,0.1)]">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 border border-[rgba(0,0,0,0.1)] rounded-md text-gray-700 hover:bg-gray-100 transition-colors text-[13px] font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUploadSubmit}
                  className="px-4 py-2 bg-[#030213] text-white hover:bg-opacity-90 rounded-md text-[13px] font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  Confirm Upload
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Documents;
