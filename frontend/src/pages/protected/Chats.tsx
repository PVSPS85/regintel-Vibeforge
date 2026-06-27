import {
  Hash,
  Search,
  Send,
  Lock,
  Loader2,
  Plus,
  MessageSquare,
  X,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatMember {
  id: string;
  name: string;
  email?: string;
  role?: string;
}

interface ChatItem {
  id: string;
  is_group: boolean;
  team_id?: string;
  display_name?: string;
  members: ChatMember[];
  created_at: string;
}

interface ChatMessage {
  id: string;
  chat_id: string;
  sender_id: string;
  sender_name?: string;
  sender_role?: string;
  content: string;
  created_at: string;
}

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  branch_id?: string;
}

interface TeamItem {
  id: string;
  name: string;
  branch_id: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PALETTES = [
  'bg-indigo-600',
  'bg-[#030213]',
  'bg-emerald-600',
  'bg-violet-600',
  'bg-rose-500',
  'bg-sky-600',
  'bg-amber-600',
  'bg-teal-600',
];

const getInitials = (name?: string) => {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
};

const getChatTitle = (chat: ChatItem, currentUserId?: string) => {
  if (chat.is_group) return chat.display_name || 'Group Chat';
  const otherMember = chat.members?.find((m) => m.id !== currentUserId);
  return otherMember ? otherMember.name : chat.display_name || 'Direct Message';
};

const formatTime = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return 'Just now';
  }
};

// ─── Sub-components ────────────────────────────────────────────────────────────

const Avatar = ({
  initials,
  colorIndex = 0,
  size = 'md',
  online = true,
}: {
  initials: string;
  colorIndex?: number;
  size?: 'sm' | 'md' | 'lg';
  online?: boolean;
}) => {
  const sizeClass = size === 'sm' ? 'w-8 h-8 text-[11px]' : size === 'lg' ? 'w-10 h-10 text-[13px]' : 'w-9 h-9 text-[12px]';
  const color = PALETTES[Math.abs(colorIndex) % PALETTES.length];
  return (
    <div className="relative shrink-0">
      <div className={`${sizeClass} ${color} rounded-full flex items-center justify-center font-bold text-white shadow-inner`}>
        {initials}
      </div>
      <span
        className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${
          online ? 'bg-emerald-500' : 'bg-gray-300'
        }`}
      />
    </div>
  );
};

// ─── New Chat Modal ────────────────────────────────────────────────────────────

interface NewChatModalProps {
  onClose: () => void;
  users: UserItem[];
  teams: TeamItem[];
  onStartChat: (chat: ChatItem) => void;
}

const NewChatModal: React.FC<NewChatModalProps> = ({ onClose, users, teams, onStartChat }) => {
  const [tab, setTab] = useState<'dm' | 'team'>('dm');
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!selectedId) return;
    setLoading(true);
    try {
      const payload = tab === 'dm'
        ? { is_group: false, target_user_id: selectedId }
        : { is_group: true, team_id: selectedId };
      const res = await api.post<ChatItem>('/chats/', payload);
      onStartChat(res.data);
      onClose();
    } catch (err: any) {
      console.error("Failed creating chat:", err);
      alert(err.response?.data?.detail || "Could not initiate conversation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-in fade-in zoom-in-95 duration-200 p-6">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
          <h3 className="text-lg font-bold text-gray-900">New Conversation</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer"><X size={18} /></button>
        </div>

        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => { setTab('dm'); setSelectedId(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
              tab === 'dm' ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
            }`}
          >
            Direct Message
          </button>
          <button
            type="button"
            onClick={() => { setTab('team'); setSelectedId(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
              tab === 'team' ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
            }`}
          >
            Team Channel
          </button>
        </div>

        <div className="space-y-4">
          <label className="block text-xs font-bold uppercase text-gray-600">
            {tab === 'dm' ? 'Select Branch Employee' : 'Select Team'}
          </label>
          {tab === 'dm' ? (
            users.length === 0 ? (
              <p className="text-xs text-gray-400 italic py-2 text-center">No other branch employees available.</p>
            ) : (
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-900 outline-none focus:border-blue-500"
              >
                <option value="">Choose an employee...</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                ))}
              </select>
            )
          ) : (
            teams.length === 0 ? (
              <p className="text-xs text-gray-400 italic py-2 text-center">No teams available in this workspace.</p>
            ) : (
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-900 outline-none focus:border-blue-500"
              >
                <option value="">Choose a team...</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            )
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 cursor-pointer">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={loading || !selectedId}
            className="px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            Start Chat
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────

const Chats = () => {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<'Chats' | 'Directory'>('Chats');
  
  // Real Data State
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  // UI State
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [chatSearch, setChatSearch] = useState('');
  const [dirSearch, setDirSearch] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchContactsAndTeams = async () => {
    try {
      const [usersRes, teamsRes] = await Promise.all([
        api.get<UserItem[]>('/users/'),
        api.get<TeamItem[]>('/teams/')
      ]);
      setUsers(usersRes.data || []);
      setTeams(teamsRes.data || []);
    } catch (err) {
      console.error("Failed loading contacts/teams:", err);
    }
  };

  const fetchChats = async (isBackground = false) => {
    try {
      if (!isBackground) setLoadingChats(true);
      const res = await api.get<ChatItem[]>('/chats/');
      const list = res.data || [];
      setChats(list);
      if (!activeChatId && list.length > 0) {
        setActiveChatId(list[0].id);
      }
    } catch (err) {
      console.error("Failed loading chats:", err);
    } finally {
      if (!isBackground) setLoadingChats(false);
    }
  };

  const fetchMessages = async (chatId: string, isBackground = false) => {
    try {
      if (!isBackground) setLoadingMessages(true);
      const res = await api.get<ChatMessage[]>(`/chats/${chatId}/messages`);
      // Sort chronologically ascending for standard chat display
      const sorted = (res.data || []).slice().reverse();
      setMessages(sorted);
    } catch (err) {
      console.error("Failed loading thread messages:", err);
    } finally {
      if (!isBackground) setLoadingMessages(false);
    }
  };

  useEffect(() => {
    fetchChats();
    fetchContactsAndTeams();
  }, [user?.branch_id]);

  // Live Polling Mechanism (Every 3 seconds)
  useEffect(() => {
    if (!activeChatId) return;
    fetchMessages(activeChatId);

    const interval = setInterval(() => {
      fetchMessages(activeChatId, true);
      fetchChats(true);
    }, 3000);

    return () => clearInterval(interval);
  }, [activeChatId]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (activeView === 'Chats') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeView]);

  const handleSend = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || !activeChatId || sending) return;
    setSending(true);
    try {
      await api.post(`/chats/${activeChatId}/messages`, { content: trimmed });
      setInputValue('');
      await fetchMessages(activeChatId, true);
    } catch (err: any) {
      console.error("Failed transmitting message:", err);
      alert(err.response?.data?.detail || "Failed transmitting message to backend.");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleStartDirectMessage = async (targetUser: UserItem) => {
    try {
      const res = await api.post<ChatItem>('/chats/', { is_group: false, target_user_id: targetUser.id });
      const newChat = res.data;
      setChats((prev) => (prev.some((c) => c.id === newChat.id) ? prev : [newChat, ...prev]));
      setActiveChatId(newChat.id);
      setActiveView('Chats');
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed initiating conversation.");
    }
  };

  const activeConv = chats.find((c) => c.id === activeChatId);
  const activeTitle = activeConv ? getChatTitle(activeConv, user?.id) : '';

  const filteredConvs = chats.filter((c) =>
    getChatTitle(c, user?.id).toLowerCase().includes(chatSearch.toLowerCase())
  );

  const otherEmployees = users.filter((u) => u.id !== user?.id);
  const filteredDir = otherEmployees.filter((emp) =>
    emp.name.toLowerCase().includes(dirSearch.toLowerCase()) ||
    emp.role.toLowerCase().includes(dirSearch.toLowerCase()) ||
    emp.email.toLowerCase().includes(dirSearch.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f9fafb] font-sans text-gray-900 overflow-hidden">

      {/* ── TOP BAR / NAV ── */}
      <div className="h-16 border-b border-[rgba(0,0,0,0.05)] px-8 flex items-center justify-between flex-shrink-0 bg-white">
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-bold tracking-tight text-gray-900">Internal Communications</h1>
          <div className="flex items-center gap-1 bg-[#f3f3f5] p-1 rounded-lg">
            <button
              onClick={() => setActiveView('Chats')}
              className={`px-4 py-1.5 rounded-md text-[13px] font-bold transition-colors cursor-pointer ${
                activeView === 'Chats' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Conversations ({chats.length})
            </button>
            <button
              onClick={() => setActiveView('Directory')}
              className={`px-4 py-1.5 rounded-md text-[13px] font-bold transition-colors cursor-pointer ${
                activeView === 'Directory' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Branch Directory ({otherEmployees.length})
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsNewModalOpen(true)}
            className="h-9 px-4 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-bold flex items-center gap-2 transition-colors shadow-sm cursor-pointer"
          >
            <Plus size={15} /> New Chat
          </button>
        </div>
      </div>

      {/* ── BODY SPLIT ── */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* ── LEFT SIDEBAR (CHATS OR DIRECTORY FILTER) ── */}
        <div className="w-80 bg-white border-r border-[rgba(0,0,0,0.05)] flex flex-col flex-shrink-0">
          
          <div className="p-4 border-b border-[rgba(0,0,0,0.05)]">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder={activeView === 'Chats' ? 'Search conversations...' : 'Search contacts...'}
                value={activeView === 'Chats' ? chatSearch : dirSearch}
                onChange={(e) => activeView === 'Chats' ? setChatSearch(e.target.value) : setDirSearch(e.target.value)}
                className="w-full h-9 pl-9 pr-3 rounded-lg border border-[rgba(0,0,0,0.1)] bg-[#f9fafb] text-[13px] placeholder:text-gray-400 outline-none focus:border-blue-400 transition-all"
              />
            </div>
          </div>

          {activeView === 'Chats' ? (
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {loadingChats ? (
                <div className="py-12 flex flex-col items-center justify-center text-gray-400 gap-2">
                  <Loader2 size={20} className="animate-spin text-blue-600" />
                  <span className="text-xs font-medium">Syncing threads...</span>
                </div>
              ) : filteredConvs.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <MessageSquare size={28} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-xs font-bold text-gray-600">No active conversations</p>
                  <p className="text-[11px] text-gray-400 mt-1">Start messaging branch contacts from the directory or start a new chat.</p>
                </div>
              ) : (
                filteredConvs.map((conv, idx) => {
                  const isActive = conv.id === activeChatId;
                  const title = getChatTitle(conv, user?.id);
                  const initials = getInitials(title);

                  return (
                    <button
                      key={conv.id}
                      onClick={() => setActiveChatId(conv.id)}
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all cursor-pointer ${
                        isActive ? 'bg-blue-50/80 text-blue-950 ring-1 ring-blue-200' : 'hover:bg-gray-50 text-gray-800'
                      }`}
                    >
                      <Avatar initials={initials} colorIndex={idx} size="md" online={true} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className={`text-[13px] font-bold truncate ${isActive ? 'text-blue-900' : 'text-gray-900'}`}>
                            {conv.is_group && <Hash size={12} className="inline mr-0.5 text-blue-600" />}
                            {title}
                          </span>
                          <span className="text-[10px] font-medium text-gray-400 shrink-0">{formatTime(conv.created_at)}</span>
                        </div>
                        <p className="text-[12px] text-gray-500 truncate mt-0.5">
                          {conv.is_group ? 'Team internal communication channel' : 'End-to-end branch DM'}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              <p className="px-3 py-2 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Available Branch Staff</p>
              {filteredDir.map((emp, idx) => (
                <button
                  key={emp.id}
                  onClick={() => handleStartDirectMessage(emp)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-gray-50 transition-all cursor-pointer"
                >
                  <Avatar initials={getInitials(emp.name)} colorIndex={idx} size="sm" online={true} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-gray-900 truncate">{emp.name}</p>
                    <p className="text-[11px] text-gray-400 truncate">{emp.role}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── RIGHT MAIN PANEL ── */}
        <div className="flex-1 flex flex-col h-full bg-gray-50/40">
          
          {activeView === 'Directory' ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="px-8 pt-8 pb-6 bg-white border-b border-[rgba(0,0,0,0.05)] shrink-0">
                <h2 className="text-2xl font-bold text-gray-900">Branch Employee Directory</h2>
                <p className="text-[14px] text-gray-500 mt-1 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  {otherEmployees.length} colleagues assigned to your active workspace branch
                </p>
              </div>

              <div className="flex-1 overflow-y-auto p-8">
                {filteredDir.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 text-sm">No branch employees found matching your criteria.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredDir.map((emp, idx) => (
                      <div key={emp.id} className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-5 hover:shadow-md transition-shadow flex flex-col justify-between">
                        <div>
                          <div className="flex items-start gap-4">
                            <Avatar initials={getInitials(emp.name)} colorIndex={idx} size="lg" online={true} />
                            <div className="flex-1 min-w-0">
                              <h3 className="text-[15px] font-bold text-gray-900 truncate">{emp.name}</h3>
                              <p className="text-xs text-gray-400 truncate">{emp.email}</p>
                            </div>
                          </div>
                          <div className="mt-4 flex flex-wrap items-center gap-2">
                            <span className="px-2 py-1 rounded bg-blue-50 text-blue-700 text-[11px] font-bold uppercase tracking-wider">{emp.role}</span>
                          </div>
                        </div>
                        <div className="mt-6 flex items-center gap-2 pt-4 border-t border-gray-100">
                          <button 
                            onClick={() => handleStartDirectMessage(emp)}
                            className="flex-1 h-9 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer"
                          >
                            <Send size={13} /> Message
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : !activeConv ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-gray-400">
              <MessageSquare size={48} className="text-gray-300 mb-3 stroke-[1.5]" />
              <h3 className="text-base font-bold text-gray-700">No Conversation Selected</h3>
              <p className="text-xs text-gray-400 mt-1 max-w-sm">Choose a conversation from the sidebar on the left or start a new chat with any colleague in your branch.</p>
              <button
                onClick={() => setIsNewModalOpen(true)}
                className="mt-5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer transition-colors"
              >
                Start New Chat
              </button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col h-full bg-white overflow-hidden">
              
              {/* Chat Thread Header */}
              <div className="h-16 border-b border-[rgba(0,0,0,0.05)] px-6 flex items-center justify-between flex-shrink-0 bg-white">
                <div className="flex items-center gap-3">
                  <Avatar initials={getInitials(activeTitle)} colorIndex={chats.findIndex(c => c.id === activeChatId)} size="lg" online={true} />
                  <div>
                    <h3 className="text-[15px] font-bold text-gray-900 leading-tight flex items-center gap-1.5">
                      {activeConv.is_group && <Hash size={14} className="text-blue-600" />}
                      {activeTitle}
                      {activeConv.is_group && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100 uppercase tracking-wider">Team Channel</span>
                      )}
                    </h3>
                    <p className="text-[11px] text-gray-500">
                      {activeConv.is_group ? `${activeConv.members.length} members connected` : 'Active secure direct session'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-[11px] font-bold">
                  <Lock size={11} className="shrink-0" />
                  <span>Live & Encrypted</span>
                </div>
              </div>

              {/* Message History View */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#f9fafb]/60">
                {loadingMessages && messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-400 gap-2">
                    <Loader2 size={20} className="animate-spin text-blue-600" />
                    <span className="text-xs font-medium">Loading thread history...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-gray-400">
                    <p className="text-xs font-semibold text-gray-600">No messages in this conversation yet.</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Be the first to send a message below.</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isMe = msg.sender_id === user?.id;
                    const initials = getInitials(msg.sender_name || 'User');
                    return (
                      <div key={msg.id || idx} className={`flex gap-3 max-w-[80%] ${isMe ? 'ml-auto flex-row-reverse' : ''}`}>
                        <Avatar initials={initials} colorIndex={idx + 3} size="sm" online={true} />
                        <div className={`flex flex-col gap-1 ${isMe ? 'items-end' : ''}`}>
                          <div className="flex items-center gap-2 px-1">
                            <span className="text-[11px] font-bold text-gray-700">{isMe ? 'You' : msg.sender_name || 'Colleague'}</span>
                            {msg.sender_role && <span className="text-[10px] text-gray-400">· {msg.sender_role}</span>}
                            <span className="text-[10px] text-gray-400">{formatTime(msg.created_at)}</span>
                          </div>
                          <div
                            className={`px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed shadow-sm break-words ${
                              isMe
                                ? 'bg-blue-600 text-white rounded-tr-xs'
                                : 'bg-white text-gray-900 border border-gray-200/80 rounded-tl-xs'
                            }`}
                          >
                            {msg.content}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Box */}
              <div className="flex-shrink-0 bg-white border-t border-[rgba(0,0,0,0.05)] px-6 pt-4 pb-4">
                <div className="flex items-center gap-3 bg-[#f3f3f5] border border-[rgba(0,0,0,0.1)] rounded-full px-4 py-2 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 transition-all shadow-sm">
                  <input
                    type="text"
                    placeholder="Type a secure live message..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={sending}
                    className="flex-1 bg-transparent text-[14px] text-gray-900 placeholder:text-gray-400 outline-none disabled:opacity-50"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!inputValue.trim() || sending}
                    title="Transmit message"
                    className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white transition-all disabled:opacity-40 hover:bg-blue-700 active:scale-95 shadow-sm cursor-pointer"
                  >
                    {sending ? <Loader2 size={13} className="animate-spin" /> : <Send size={14} className="ml-0.5" />}
                  </button>
                </div>
                <div className="flex items-center justify-center gap-1.5 mt-2.5">
                  <Lock size={10} className="text-gray-400" />
                  <p className="text-[11px] font-medium text-gray-400 tracking-wide">
                    End-to-end transmitted · PostgreSQL persistence · Branch restricted
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {isNewModalOpen && (
        <NewChatModal
          onClose={() => setIsNewModalOpen(false)}
          users={otherEmployees}
          teams={teams}
          onStartChat={(newChat: ChatItem) => {
            setChats((prev) => (prev.some((c) => c.id === newChat.id) ? prev : [newChat, ...prev]));
            setActiveChatId(newChat.id);
            setActiveView('Chats');
          }}
        />
      )}
    </div>
  );
};

export default Chats;
