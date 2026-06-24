import {
  Hash,
  Paperclip,
  Search,
  Send,
  Smile,
  Mail,
  Lock,
  FileText,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

type ConversationType = 'dm' | 'team';

interface Conversation {
  id: number;
  type: ConversationType;
  name: string;
  avatar: string;
  avatarColor: string;
  lastMessage: string;
  time: string;
  unread: number;
  online?: boolean;
}

interface Message {
  id: number;
  senderId: 'me' | number;
  senderName: string;
  senderAvatar: string;
  senderColor: string;
  body: string;
  timestamp: string;
  attachment?: {
    fileName: string;
    fileSize: string;
    fileType: string;
  };
}

interface Employee {
  id: string;
  name: string;
  initials: string;
  avatarColor: string;
  role: string;
  department: string;
  online: boolean;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const CONVERSATIONS: Conversation[] = [
  { id: 1, type: 'team', name: 'IT Security Team', avatar: 'IS', avatarColor: 'bg-[#030213]', lastMessage: 'Task: 2FA rollout is now in progress.', time: '10:42 AM', unread: 5 },
  { id: 2, type: 'dm', name: 'Vikram Nair', avatar: 'VN', avatarColor: 'bg-emerald-600', lastMessage: 'Can you review the KYC report by EOD?', time: '9:15 AM', unread: 2, online: true },
  { id: 3, type: 'team', name: 'Compliance Core', avatar: 'CC', avatarColor: 'bg-violet-600', lastMessage: 'New RBI circular has been parsed.', time: 'Yesterday', unread: 0 },
  { id: 4, type: 'dm', name: 'Priya Sharma', avatar: 'PS', avatarColor: 'bg-rose-500', lastMessage: 'Thanks, I\'ll handle the escalation.', time: 'Yesterday', unread: 0, online: false },
  { id: 5, type: 'team', name: 'Fort Branch General', avatar: 'FG', avatarColor: 'bg-amber-600', lastMessage: 'Monthly review scheduled for Friday.', time: 'Mon', unread: 12 },
  { id: 6, type: 'dm', name: 'Rahul Desai', avatar: 'RD', avatarColor: 'bg-sky-600', lastMessage: 'Got it, will update the tracker.', time: 'Mon', unread: 0, online: true },
  { id: 7, type: 'dm', name: 'Neha Joshi', avatar: 'NJ', avatarColor: 'bg-teal-600', lastMessage: 'The audit is scheduled for next Thursday.', time: 'Sun', unread: 0, online: false },
];

const MESSAGES_BY_CONV: Record<number, Message[]> = {
  1: [
    { id: 1, senderId: 10, senderName: 'Rohit Pal', senderAvatar: 'RP', senderColor: 'bg-sky-600', body: 'Team, the 2FA implementation plan has been shared on the document drive.', timestamp: '10:30 AM' },
    { id: 2, senderId: 'me', senderName: 'Arjun Mehta', senderAvatar: 'AM', senderColor: 'bg-gray-700', body: 'Acknowledged. I\'ll review and assign sub-tasks by noon.', timestamp: '10:35 AM' },
    { id: 3, senderId: 11, senderName: 'Isha Mehta', senderAvatar: 'IM', senderColor: 'bg-rose-500', body: 'Should we prioritise the VPN gateway first or the internal portal?', timestamp: '10:38 AM' },
    { id: 4, senderId: 'me', senderName: 'Arjun Mehta', senderAvatar: 'AM', senderColor: 'bg-gray-700', body: 'Internal portal first — it\'s flagged as a Priority 1 in the compliance checklist.', timestamp: '10:40 AM' },
    { id: 5, senderId: 10, senderName: 'Rohit Pal', senderAvatar: 'RP', senderColor: 'bg-sky-600', body: 'Task: 2FA rollout is now in progress. See the attached policy for reference.', timestamp: '10:42 AM', attachment: { fileName: 'Firewall_Policy_v2.pdf', fileSize: '2.4 MB', fileType: 'PDF' } },
  ],
  2: [
    { id: 1, senderId: 20, senderName: 'Vikram Nair', senderAvatar: 'VN', senderColor: 'bg-emerald-600', body: 'Hi Arjun, the KYC audit report for Q2 is almost ready.', timestamp: '9:00 AM' },
    { id: 2, senderId: 'me', senderName: 'Arjun Mehta', senderAvatar: 'AM', senderColor: 'bg-gray-700', body: 'Great — how many accounts flagged this cycle?', timestamp: '9:10 AM' },
    { id: 3, senderId: 20, senderName: 'Vikram Nair', senderAvatar: 'VN', senderColor: 'bg-emerald-600', body: 'Can you review the KYC report by EOD? Found 14 high-value accounts with missing documents.', timestamp: '9:15 AM' },
  ],
};

const DIRECTORY: Employee[] = [
  { id: 'EMP-001', name: 'Vikram Nair', initials: 'VN', avatarColor: 'bg-emerald-600', role: 'Relationship Manager', department: 'Retail Banking', online: true },
  { id: 'EMP-002', name: 'Aisha Mehta', initials: 'AM', avatarColor: 'bg-[#030213]', role: 'Compliance Officer', department: 'Compliance', online: true },
  { id: 'EMP-003', name: 'Rahul Desai', initials: 'RD', avatarColor: 'bg-sky-600', role: 'Risk Operations Lead', department: 'Risk Management', online: false },
  { id: 'EMP-004', name: 'Priya Sharma', initials: 'PS', avatarColor: 'bg-rose-500', role: 'Compliance Associate', department: 'Compliance', online: true },
  { id: 'EMP-005', name: 'Rohit Pal', initials: 'RP', avatarColor: 'bg-indigo-600', role: 'IT Security Analyst', department: 'IT Security', online: true },
  { id: 'EMP-006', name: 'Neha Joshi', initials: 'NJ', avatarColor: 'bg-teal-600', role: 'Branch Manager', department: 'Management', online: true },
  { id: 'EMP-007', name: 'Isha Mehta', initials: 'IM', avatarColor: 'bg-amber-600', role: 'IT Support', department: 'IT Security', online: true },
  { id: 'EMP-008', name: 'Karan Singh', initials: 'KS', avatarColor: 'bg-violet-600', role: 'Auditor', department: 'Audit', online: false },
  { id: 'EMP-009', name: 'Simran Kaur', initials: 'SK', avatarColor: 'bg-pink-600', role: 'Teller', department: 'Retail Banking', online: true },
  { id: 'EMP-010', name: 'Ananya Rao', initials: 'AR', avatarColor: 'bg-orange-500', role: 'Customer Success', department: 'Retail Banking', online: false },
  { id: 'EMP-011', name: 'Kabir Das', initials: 'KD', avatarColor: 'bg-cyan-600', role: 'Credit Analyst', department: 'Risk Management', online: false },
  { id: 'EMP-012', name: 'Sanya Gupta', initials: 'SG', avatarColor: 'bg-fuchsia-600', role: 'Legal Advisor', department: 'Compliance', online: false },
];

const DEFAULT_MESSAGES = (name: string): Message[] => [
  {
    id: 1,
    senderId: 99,
    senderName: name,
    senderAvatar: name.slice(0, 2).toUpperCase(),
    senderColor: 'bg-violet-600',
    body: 'End-to-end encrypted chat initiated.',
    timestamp: 'Yesterday',
  },
];

// ─── Sub-components ────────────────────────────────────────────────────────────

const Avatar = ({
  initials,
  color,
  size = 'md',
  online,
}: {
  initials: string;
  color: string;
  size?: 'sm' | 'md' | 'lg';
  online?: boolean;
}) => {
  const sizeClass = size === 'sm' ? 'w-8 h-8 text-[11px]' : size === 'lg' ? 'w-10 h-10 text-[13px]' : 'w-9 h-9 text-[12px]';
  return (
    <div className="relative shrink-0">
      <div className={`${sizeClass} ${color} rounded-full flex items-center justify-center font-bold text-white shadow-inner`}>
        {initials}
      </div>
      {online !== undefined && (
        <span
          className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${
            online ? 'bg-emerald-500' : 'bg-gray-300'
          }`}
        />
      )}
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────

const Chats = () => {
  const [activeView, setActiveView] = useState<'Chats' | 'Directory'>('Chats');
  
  // Chats State
  const [activeChatId, setActiveChatId] = useState<number>(1);
  const [chatSearch, setChatSearch] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [messageMap, setMessageMap] = useState<Record<number, Message[]>>(MESSAGES_BY_CONV);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Directory State
  const [dirSearch, setDirSearch] = useState('');
  const [activeDept, setActiveDept] = useState('All');

  const activeConv = CONVERSATIONS.find((c) => c.id === activeChatId)!;
  const filteredConvs = CONVERSATIONS.filter((c) =>
    c.name.toLowerCase().includes(chatSearch.toLowerCase())
  );
  const messages = messageMap[activeChatId] ?? DEFAULT_MESSAGES(activeConv?.name ?? '');

  const departments = ['All', ...Array.from(new Set(DIRECTORY.map((e) => e.department)))];
  const onlineCount = DIRECTORY.filter((e) => e.online).length;

  const filteredDir = DIRECTORY.filter((e) => {
    const matchesSearch = e.name.toLowerCase().includes(dirSearch.toLowerCase()) || e.id.toLowerCase().includes(dirSearch.toLowerCase());
    const matchesDept = activeDept === 'All' || e.department === activeDept;
    return matchesSearch && matchesDept;
  });

  // Auto-scroll to bottom
  useEffect(() => {
    if (activeView === 'Chats') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeChatId, activeView]);

  const handleSend = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    const newMsg: Message = {
      id: Date.now(),
      senderId: 'me',
      senderName: 'Arjun Mehta',
      senderAvatar: 'AM',
      senderColor: 'bg-gray-700',
      body: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessageMap((prev) => ({
      ...prev,
      [activeChatId]: [...(prev[activeChatId] ?? DEFAULT_MESSAGES(activeConv.name)), newMsg],
    }));
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-[calc(100vh-5rem)] w-full overflow-hidden bg-white font-sans">
      {/* ── LEFT SUB-SIDEBAR ── */}
      <div className="w-80 flex flex-col h-full border-r border-gray-200 flex-shrink-0 bg-white">
        {/* Toggle Switch */}
        <div className="px-4 pt-5 pb-4 border-b border-[rgba(0,0,0,0.05)]">
          <div className="flex items-center p-1 bg-gray-100 rounded-full border border-[rgba(0,0,0,0.05)]">
            <button
              onClick={() => setActiveView('Chats')}
              className={`flex-1 py-1.5 text-[13px] font-bold rounded-full transition-all ${
                activeView === 'Chats' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Chats
            </button>
            <button
              onClick={() => setActiveView('Directory')}
              className={`flex-1 py-1.5 text-[13px] font-bold rounded-full transition-all ${
                activeView === 'Directory' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Directory
            </button>
          </div>
        </div>

        {/* Local Search */}
        <div className="px-4 py-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder={activeView === 'Chats' ? "Search conversations…" : "Name, ID, dept…"}
              value={activeView === 'Chats' ? chatSearch : dirSearch}
              onChange={(e) => activeView === 'Chats' ? setChatSearch(e.target.value) : setDirSearch(e.target.value)}
              className="w-full h-9 pl-8 pr-3 rounded-md bg-[#f3f3f5] border border-[rgba(0,0,0,0.1)] text-[13px] text-gray-900 placeholder:text-gray-400 outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-[#030213]/20 transition-all"
            />
          </div>
        </div>

        {/* Left Panel Content */}
        {activeView === 'Directory' ? (
          <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[12px] font-semibold text-gray-600">{onlineCount} online now</span>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Departments</p>
              {departments.map((dept) => {
                const count = dept === 'All' ? DIRECTORY.length : DIRECTORY.filter((e) => e.department === dept).length;
                return (
                  <button
                    key={dept}
                    onClick={() => setActiveDept(dept)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-[13px] font-semibold transition-colors ${
                      activeDept === dept ? 'bg-[#f3f3f5] text-indigo-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <span>{dept}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] ${
                      activeDept === dept ? 'bg-white text-gray-900 shadow-sm' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-0.5">
            {filteredConvs.map((conv) => {
              const isActive = conv.id === activeChatId;
              return (
                <button
                  key={conv.id}
                  onClick={() => setActiveChatId(conv.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-colors duration-100 ${
                    isActive ? 'bg-[#f3f3f5] text-indigo-900' : 'hover:bg-[#f3f3f5] text-gray-800'
                  }`}
                >
                  <Avatar initials={conv.avatar} color={conv.avatarColor} size="md" online={conv.online} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className={`text-[14px] font-semibold truncate ${isActive ? 'text-indigo-900' : 'text-gray-900'}`}>
                        {conv.type === 'team' && <Hash size={11} className="inline mr-0.5 opacity-60" />}
                        {conv.name}
                      </span>
                      <span className="text-[11px] text-gray-400 shrink-0">{conv.time}</span>
                    </div>
                    <p className="text-[13px] text-gray-500 truncate mt-0.5">{conv.lastMessage}</p>
                  </div>
                  {conv.unread > 0 && (
                    <span className="shrink-0 min-w-[20px] h-5 px-1.5 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center shadow-sm">
                      {conv.unread > 99 ? '99+' : conv.unread}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── RIGHT MAIN PANEL ── */}
      <div className="flex-1 flex flex-col h-full bg-gray-50/30">
        
        {activeView === 'Directory' ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Directory Header */}
            <div className="px-8 pt-8 pb-6 bg-white border-b border-[rgba(0,0,0,0.05)] shrink-0">
              <h2 className="text-2xl font-bold text-gray-900">Branch Employee Directory</h2>
              <p className="text-[14px] text-gray-500 mt-1 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                {onlineCount} online · {DIRECTORY.length} employees · Mumbai — Fort Branch
              </p>
            </div>

            {/* Directory Grid */}
            <div className="flex-1 overflow-y-auto p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredDir.map((emp) => (
                  <div key={emp.id} className="bg-white rounded-xl border border-[rgba(0,0,0,0.1)] shadow-sm p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-4">
                      <Avatar initials={emp.initials} color={emp.avatarColor} size="lg" online={emp.online} />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-[15px] font-bold text-gray-900 truncate">{emp.name}</h3>
                        <p className="text-[12px] font-mono text-gray-400">{emp.id}</p>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <span className="px-2 py-1 rounded bg-blue-50 text-blue-700 text-[11px] font-bold uppercase tracking-wider">{emp.role}</span>
                      <span className="px-2 py-1 rounded bg-gray-100 text-gray-600 text-[11px] font-semibold">{emp.department}</span>
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                      <button 
                        onClick={() => setActiveView('Chats')}
                        className="flex-1 h-9 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-[13px] font-bold flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer"
                      >
                        <Send size={14} />
                        Message
                      </button>
                      <button className="w-9 h-9 border border-[rgba(0,0,0,0.1)] hover:bg-gray-50 text-gray-600 rounded-md flex items-center justify-center transition-colors cursor-pointer shrink-0">
                        <Mail size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {filteredDir.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-[14px]">No employees found matching your criteria.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col h-full bg-white overflow-hidden">
            {/* Chat Header */}
            <div className="h-16 border-b border-[rgba(0,0,0,0.05)] px-6 flex items-center justify-between flex-shrink-0 bg-white">
              <div className="flex items-center gap-3">
                <Avatar initials={activeConv.avatar} color={activeConv.avatarColor} size="lg" online={activeConv.online} />
                <div>
                  <h3 className="text-[15px] font-bold text-gray-900 leading-tight flex items-center gap-1">
                    {activeConv.type === 'team' && <Hash size={13} className="text-gray-500" />}
                    {activeConv.name}
                    {activeConv.type === 'team' && (
                      <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100 uppercase tracking-wider">Team Chat</span>
                    )}
                  </h3>
                  <p className="text-[12px] text-gray-500">
                    {activeConv.type === 'team' ? 'Branch internal channel' : activeConv.online ? 'Online now' : 'Last seen recently'}
                  </p>
                </div>
              </div>
              {/* Encrypted Badge - NO CALL ICONS per instructions */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-100">
                <Lock size={12} className="shrink-0" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Encrypted</span>
              </div>
            </div>

            {/* Chat Feed */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
              {messages.map((msg, idx) => {
                const isMe = msg.senderId === 'me';
                const prevMsg = idx > 0 ? messages[idx - 1] : null;
                const showHeader = !prevMsg || prevMsg.senderId !== msg.senderId;

                return (
                  <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className="w-9 shrink-0">
                      {showHeader && <Avatar initials={msg.senderAvatar} color={msg.senderColor} size="md" />}
                    </div>
                    <div className={`flex flex-col gap-1 max-w-[65%] ${isMe ? 'items-end' : 'items-start'}`}>
                      {showHeader && (
                        <span className="text-[12px] font-semibold text-gray-500 px-1">
                          {isMe ? 'You' : msg.senderName}
                        </span>
                      )}
                      <div
                        className={`px-4 py-2.5 text-[14px] leading-relaxed shadow-sm ${
                          isMe
                            ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm'
                            : 'bg-white text-gray-900 border border-[rgba(0,0,0,0.1)] rounded-2xl rounded-tl-sm'
                        }`}
                      >
                        {msg.body}
                      </div>
                      
                      {msg.attachment && (
                        <div className={`flex items-center gap-3 p-3 mt-1 rounded-xl w-64 shadow-sm border ${
                          isMe ? 'bg-blue-50 border-blue-100' : 'bg-white border-[rgba(0,0,0,0.1)]'
                        }`}>
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                            msg.attachment.fileType === 'PDF' ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-600'
                          }`}>
                            <FileText size={20} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-bold text-gray-900 truncate">{msg.attachment.fileName}</p>
                            <p className="text-[11px] font-medium text-gray-500 mt-0.5">{msg.attachment.fileSize} • {msg.attachment.fileType}</p>
                          </div>
                        </div>
                      )}
                      
                      <span className="text-[11px] text-gray-400 px-1 mt-0.5">{msg.timestamp}</span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <div className="flex-shrink-0 bg-white border-t border-[rgba(0,0,0,0.05)] px-6 pt-4 pb-3">
              <div className="flex items-center gap-3 bg-[#f3f3f5] border border-[rgba(0,0,0,0.1)] rounded-full px-4 py-2 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all shadow-sm">
                <button title="Attach file" className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer p-1">
                  <Paperclip size={18} />
                </button>
                <input
                  type="text"
                  placeholder="Type a secure message..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 bg-transparent text-[14px] text-gray-900 placeholder:text-gray-400 outline-none"
                />
                <button title="Emoji" className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer p-1">
                  <Smile size={18} />
                </button>
                <button
                  onClick={handleSend}
                  disabled={!inputValue.trim()}
                  title="Send message"
                  className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 active:scale-95 shadow-sm cursor-pointer"
                >
                  <Send size={14} className="ml-0.5" />
                </button>
              </div>
              <div className="flex items-center justify-center gap-1.5 mt-2.5">
                <Lock size={10} className="text-gray-400" />
                <p className="text-[11px] font-medium text-gray-400 tracking-wide">
                  End-to-end encrypted · Branch-restricted · Internal use only
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chats;
