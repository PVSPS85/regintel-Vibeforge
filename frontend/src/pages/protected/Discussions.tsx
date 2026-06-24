import {
  MessageSquare,
  Plus,
  Search,
  X,
  User,
  Calendar,
  Send,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import { useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Comment {
  author: string;
  role: string;
  text: string;
  time: string;
}

interface DiscussionThread {
  id: string;
  title: string;
  category: string;
  authorName: string;
  authorRole: string;
  date: string;
  commentsCount: number;
  content: string;
  comments: Comment[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  'All',
  'KYC / Onboarding',
  'IT Security',
  'Audit Prep',
  'General',
];

const INITIAL_THREADS: DiscussionThread[] = [
  {
    id: 'TH-201',
    title: 'Updates on KYC guidelines and digital onboarding protocols',
    category: 'KYC / Onboarding',
    authorName: 'Priya Sharma',
    authorRole: 'Compliance Associate',
    date: 'Today',
    commentsCount: 3,
    content: 'The latest RBI guidelines clarify the use of video-based customer identification processes (V-CIP). I have uploaded the parsed PDF circular to our documents repository. All relationship managers please ensure onboarding forms are revised by Friday.',
    comments: [
      { author: 'Harshith', role: 'Branch Manager', text: 'Approved. All underwriting desks please review immediately.', time: '2 hours ago' },
      { author: 'Vikram Nair', role: 'Relationship Manager', text: 'Are the new KYC checklist forms updated in the branch portal?', time: '1 hour ago' },
      { author: 'Priya Sharma', role: 'Compliance Associate', text: 'Yes Vikram, they are live in the internal templates folder.', time: '30 mins ago' },
    ],
  },
  {
    id: 'TH-202',
    title: 'Implementation of new firewall policy next weekend',
    category: 'IT Security',
    authorName: 'Arjun Mehta',
    authorRole: 'IT Security Analyst',
    date: 'Yesterday',
    commentsCount: 2,
    content: 'Network engineering is scheduling firewall rule updates next Saturday between 02:00 and 04:00 AM IST. Expect brief connectivity interruptions for regional terminals. Local database transactions will automatically queue.',
    comments: [
      { author: 'Harshith', role: 'Branch Manager', text: 'Notify the regional center about the maintenance window so transactions are routed properly.', time: '1 day ago' },
      { author: 'Arjun Mehta', role: 'IT Security Analyst', text: 'Done. Regional heads have approved the scheduled maintenance.', time: '18 hours ago' },
    ],
  },
  {
    id: 'TH-203',
    title: 'RBI Cyber Audit Preparation - Log Consolidation',
    category: 'Audit Prep',
    authorName: 'Aisha Mehta',
    authorRole: 'Compliance Officer',
    date: '20 Jun 2026',
    commentsCount: 1,
    content: 'Our branch cybersecurity audit begins on July 10th. All logs for access permissions, firewall updates, and compliance exceptions must be consolidated. Let\'s meet on Wednesday to run through the checklist.',
    comments: [
      { author: 'Priya Sharma', role: 'Compliance Associate', text: 'I have gathered the Fort branch records, will share the spreadsheet tomorrow.', time: '2 days ago' },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getCategoryStyles = (category: string) => {
  switch (category) {
    case 'KYC / Onboarding':
      return 'bg-rose-50 text-rose-700 ring-rose-600/10';
    case 'IT Security':
      return 'bg-[#f3f3f5] text-[#030213] ring-[#030213]/10';
    case 'Audit Prep':
      return 'bg-amber-50 text-amber-700 ring-amber-600/10';
    default:
      return 'bg-[#f3f3f5] text-gray-700 ring-gray-600/10';
  }
};

// ─── Main Component ───────────────────────────────────────────────────────────

const Discussions = () => {
  const [threads, setThreads] = useState<DiscussionThread[]>(INITIAL_THREADS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedThread, setSelectedThread] = useState<DiscussionThread | null>(null);

  // New Thread Form States
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('KYC / Onboarding');
  const [newContent, setNewContent] = useState('');
  const [formError, setFormError] = useState('');

  // Comment Form State
  const [commentText, setCommentText] = useState('');

  // Filter Threads
  const filteredThreads = threads.filter((t) => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || t.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Handle Create Thread
  const handleCreateThread = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) {
      setFormError('Please fill in all required fields.');
      return;
    }

    const newThread: DiscussionThread = {
      id: `TH-${200 + threads.length + 1}`,
      title: newTitle,
      category: newCategory,
      authorName: 'Aisha Mehta', // Mock active user
      authorRole: 'Compliance Officer',
      date: 'Just now',
      commentsCount: 0,
      content: newContent,
      comments: [],
    };

    setThreads((prev) => [newThread, ...prev]);

    // Reset Form
    setNewTitle('');
    setNewCategory('KYC / Onboarding');
    setNewContent('');
    setFormError('');
    setIsModalOpen(false);
  };

  // Handle Post Comment
  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !selectedThread) return;

    const newComment: Comment = {
      author: 'Aisha Mehta', // Mock active user
      role: 'Compliance Officer',
      text: commentText,
      time: 'Just now',
    };

    // Update state lists
    setThreads((prev) =>
      prev.map((t) => {
        if (t.id === selectedThread.id) {
          const updatedComments = [...t.comments, newComment];
          return {
            ...t,
            comments: updatedComments,
            commentsCount: updatedComments.length,
          };
        }
        return t;
      })
    );

    // Update active drawer thread details
    setSelectedThread((prev) => {
      if (!prev) return null;
      const updatedComments = [...prev.comments, newComment];
      return {
        ...prev,
        comments: updatedComments,
        commentsCount: updatedComments.length,
      };
    });

    setCommentText('');
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 font-sans min-h-screen relative">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Discussions Forum</h1>
          <p className="text-[14px] text-gray-500 mt-1">
            Exchange regulatory compliance notes and operational security queries with the branch team.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 bg-[#030213] text-white hover:bg-opacity-95 active:scale-98 transition-all px-4 h-10 rounded-md text-[13px] font-semibold cursor-pointer shadow-sm self-start sm:self-center"
        >
          <Plus size={16} />
          New Discussion
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
            placeholder="Search discussion threads by title..."
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

      {/* ── Thread List ── */}
      <div className="bg-white rounded-md border border-[rgba(0,0,0,0.1)] shadow-sm divide-y divide-gray-100 overflow-hidden">
        {filteredThreads.length > 0 ? (
          filteredThreads.map((thread) => (
            <div
              key={thread.id}
              onClick={() => setSelectedThread(thread)}
              className="p-5 hover:bg-[#f3f3f5]/50 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
            >
              <div className="space-y-2 flex-1">
                {/* Title & Category Badge */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${getCategoryStyles(thread.category)}`}>
                    {thread.category}
                  </span>
                  <span className="text-[11px] font-mono font-medium text-gray-400 bg-gray-100 px-1 rounded border border-[rgba(0,0,0,0.1)]/20">
                    {thread.id}
                  </span>
                </div>

                <h3 className="text-[15px] font-bold text-gray-900 group-hover:text-[#030213] transition-colors pr-6">
                  {thread.title}
                </h3>

                {/* Author Metadata */}
                <div className="flex items-center gap-2 text-[12px] text-gray-400 font-medium">
                  <span className="flex items-center gap-1">
                    <User size={12} />
                    {thread.authorName}
                  </span>
                  <span>•</span>
                  <span>{thread.authorRole}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {thread.date}
                  </span>
                </div>
              </div>

              {/* Comment Count Badge */}
              <div className="shrink-0 flex items-center justify-end">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#f3f3f5] border border-[rgba(0,0,0,0.1)] text-[12px] font-bold text-gray-600 group-hover:bg-[#f3f3f5] group-hover:border-[rgba(0,0,0,0.1)] group-hover:text-[#030213] transition-colors">
                  <MessageSquare size={13} className="text-gray-400 group-hover:text-indigo-400" />
                  {thread.commentsCount} Comments
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="p-12 text-center text-gray-400 text-[14px]">
            No discussion threads found.
          </div>
        )}
      </div>

      {/* ── Thread Details Slide-over Panel (Drawer) ── */}
      {selectedThread && (
        <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 overflow-hidden">
            {/* Backdrop overlay */}
            <div
              onClick={() => setSelectedThread(null)}
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-xs transition-opacity duration-300"
            />

            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <div className="pointer-events-auto w-screen max-w-lg transform bg-white shadow-xl transition-all duration-300 ease-in-out border-l border-[rgba(0,0,0,0.1)]">
                <div className="flex h-full flex-col bg-white">
                  {/* Drawer Header */}
                  <div className="bg-[#f3f3f5] border-b border-[rgba(0,0,0,0.1)] px-6 py-5">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${getCategoryStyles(selectedThread.category)}`}>
                            {selectedThread.category}
                          </span>
                          <span className="text-[11px] font-mono font-medium text-gray-400">
                            {selectedThread.id}
                          </span>
                        </div>
                        <h2 className="text-[17px] font-bold text-gray-900 leading-snug">
                          {selectedThread.title}
                        </h2>
                        {/* Author Metadata */}
                        <div className="text-[12px] text-gray-400 font-medium">
                          Posted by <span className="text-gray-600 font-bold">{selectedThread.authorName}</span> ({selectedThread.authorRole}) • {selectedThread.date}
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedThread(null)}
                        className="rounded-md bg-white text-gray-400 hover:text-gray-500 outline-none p-1.5 border border-[rgba(0,0,0,0.1)] hover:border-gray-300 transition-all cursor-pointer"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Drawer Body - Scrollable */}
                  <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                    {/* Thread Topic Content */}
                    <div className="bg-[#f3f3f5]/40 rounded-md p-4.5 border border-[rgba(0,0,0,0.1)]/60 text-[13.5px] text-gray-700 leading-relaxed">
                      {selectedThread.content}
                    </div>

                    {/* Comments List */}
                    <div className="space-y-4">
                      <h4 className="text-[12px] font-bold uppercase text-gray-400 tracking-wider">
                        Discussion Feed ({selectedThread.commentsCount})
                      </h4>

                      <div className="space-y-3.5">
                        {selectedThread.comments.length > 0 ? (
                          selectedThread.comments.map((comment, index) => (
                            <div key={index} className="flex gap-3">
                              {/* Circle avatar */}
                              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0 border border-[rgba(0,0,0,0.1)]/60 font-bold text-[11px] text-gray-600">
                                {comment.author.substring(0, 2).toUpperCase()}
                              </div>

                              <div className="bg-[#f3f3f5]/50 border border-[rgba(0,0,0,0.1)]/50 rounded-md p-3 flex-1 space-y-1">
                                <div className="flex items-center justify-between text-[11px] font-medium">
                                  <div>
                                    <span className="text-gray-800 font-bold">{comment.author}</span>
                                    <span className="text-gray-400 ml-1">({comment.role})</span>
                                  </div>
                                  <span className="text-gray-400">{comment.time}</span>
                                </div>
                                <p className="text-[12.5px] text-gray-650 leading-relaxed font-sans select-text">
                                  {comment.text}
                                </p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-center text-gray-400 py-4 text-[12.5px]">No replies yet. Start the conversation!</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Drawer Footer Comment Post Input */}
                  <div className="border-t border-[rgba(0,0,0,0.1)] p-4 bg-[#f3f3f5]">
                    <form onSubmit={handlePostComment} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Write a reply..."
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        className="flex-1 h-10 px-3 rounded-md border border-[rgba(0,0,0,0.1)] bg-white text-[13px] text-gray-900 placeholder:text-gray-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-[#030213]/20 transition-all font-sans"
                      />
                      <button
                        type="submit"
                        disabled={!commentText.trim()}
                        className="h-10 w-10 bg-[#030213] text-white hover:bg-opacity-95 rounded-md flex items-center justify-center cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                      >
                        <Send size={15} />
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── New Thread Modal ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
            {/* Backdrop Overlay */}
            <div
              onClick={() => setIsModalOpen(false)}
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
                        Create New Thread
                      </h3>
                      <p className="text-[12px] text-gray-400 mt-0.5">Start a discussion with branch employees.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsModalOpen(false)}
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

                <form onSubmit={handleCreateThread} className="mt-4 space-y-4">
                  {/* Title */}
                  <div>
                    <label className="block text-[12px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Thread Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Updates on new V-CIP onboarding checklists"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full h-10 px-3 rounded-md border border-[rgba(0,0,0,0.1)] bg-[#f3f3f5] text-[13px] text-gray-900 placeholder:text-gray-400 outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-[#030213]/20 transition-all"
                    />
                  </div>

                  {/* Category */}
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

                  {/* Topic Content */}
                  <div>
                    <label className="block text-[12px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Discussion Message <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={5}
                      placeholder="Write your discussion topic details here. All branch employees in your work groups can read and reply to this thread..."
                      value={newContent}
                      onChange={(e) => setNewContent(e.target.value)}
                      className="w-full p-3 rounded-md border border-[rgba(0,0,0,0.1)] bg-[#f3f3f5] text-[13px] text-gray-900 placeholder:text-gray-400 outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-[#030213]/20 transition-all resize-none"
                    />
                  </div>
                </form>
              </div>

              {/* Modal Footer */}
              <div className="bg-[#f3f3f5] px-6 py-4 flex items-center justify-end gap-3 border-t border-[rgba(0,0,0,0.1)]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-[rgba(0,0,0,0.1)] rounded-md text-gray-700 hover:bg-gray-100 transition-colors text-[13px] font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateThread}
                  className="px-4 py-2 bg-[#030213] text-white hover:bg-opacity-90 rounded-md text-[13px] font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  Post Thread
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

export default Discussions;
