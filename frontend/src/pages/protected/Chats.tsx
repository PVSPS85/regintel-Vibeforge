import {
  Hash,
  Paperclip,
  Phone,
  Search,
  Send,
  Smile,
  Video,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

type ConversationType = 'dm' | 'team';

interface Conversation {
  id: number;
  type: ConversationType;
  name: string;
  avatar: string;           // initials
  avatarColor: string;      // tailwind bg class
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
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const CONVERSATIONS: Conversation[] = [
  {
    id: 1,
    type: 'team',
    name: 'IT Security Team',
    avatar: 'IS',
    avatarColor: 'bg-indigo-600',
    lastMessage: 'Task: 2FA rollout is now in progress.',
    time: '10:42 AM',
    unread: 5,
  },
  {
    id: 2,
    type: 'dm',
    name: 'Vikram Nair',
    avatar: 'VN',
    avatarColor: 'bg-emerald-600',
    lastMessage: 'Can you review the KYC report by EOD?',
    time: '9:15 AM',
    unread: 2,
    online: true,
  },
  {
    id: 3,
    type: 'team',
    name: 'Compliance Core',
    avatar: 'CC',
    avatarColor: 'bg-violet-600',
    lastMessage: 'New RBI circular has been parsed.',
    time: 'Yesterday',
    unread: 0,
  },
  {
    id: 4,
    type: 'dm',
    name: 'Priya Sharma',
    avatar: 'PS',
    avatarColor: 'bg-rose-500',
    lastMessage: 'Thanks, I\'ll handle the escalation.',
    time: 'Yesterday',
    unread: 0,
    online: false,
  },
  {
    id: 5,
    type: 'team',
    name: 'Fort Branch General',
    avatar: 'FG',
    avatarColor: 'bg-amber-600',
    lastMessage: 'Monthly review scheduled for Friday.',
    time: 'Mon',
    unread: 12,
  },
  {
    id: 6,
    type: 'dm',
    name: 'Rahul Desai',
    avatar: 'RD',
    avatarColor: 'bg-sky-600',
    lastMessage: 'Got it, will update the tracker.',
    time: 'Mon',
    unread: 0,
    online: true,
  },
  {
    id: 7,
    type: 'dm',
    name: 'Neha Joshi',
    avatar: 'NJ',
    avatarColor: 'bg-teal-600',
    lastMessage: 'The audit is scheduled for next Thursday.',
    time: 'Sun',
    unread: 0,
    online: false,
  },
];

const MESSAGES_BY_CONV: Record<number, Message[]> = {
  1: [
    {
      id: 1,
      senderId: 10,
      senderName: 'Rohit Pal',
      senderAvatar: 'RP',
      senderColor: 'bg-sky-600',
      body: 'Team, the 2FA implementation plan has been shared on the document drive.',
      timestamp: '10:30 AM',
    },
    {
      id: 2,
      senderId: 'me',
      senderName: 'Arjun Mehta',
      senderAvatar: 'AM',
      senderColor: 'bg-gray-700',
      body: 'Acknowledged. I\'ll review and assign sub-tasks by noon.',
      timestamp: '10:35 AM',
    },
    {
      id: 3,
      senderId: 11,
      senderName: 'Isha Mehta',
      senderAvatar: 'IM',
      senderColor: 'bg-rose-500',
      body: 'Should we prioritise the VPN gateway first or the internal portal?',
      timestamp: '10:38 AM',
    },
    {
      id: 4,
      senderId: 'me',
      senderName: 'Arjun Mehta',
      senderAvatar: 'AM',
      senderColor: 'bg-gray-700',
      body: 'Internal portal first — it\'s flagged as a Priority 1 in the compliance checklist.',
      timestamp: '10:40 AM',
    },
    {
      id: 5,
      senderId: 10,
      senderName: 'Rohit Pal',
      senderAvatar: 'RP',
      senderColor: 'bg-sky-600',
      body: 'Task: 2FA rollout is now in progress.',
      timestamp: '10:42 AM',
    },
  ],
  2: [
    {
      id: 1,
      senderId: 20,
      senderName: 'Vikram Nair',
      senderAvatar: 'VN',
      senderColor: 'bg-emerald-600',
      body: 'Hi Arjun, the KYC audit report for Q2 is almost ready.',
      timestamp: '9:00 AM',
    },
    {
      id: 2,
      senderId: 'me',
      senderName: 'Arjun Mehta',
      senderAvatar: 'AM',
      senderColor: 'bg-gray-700',
      body: 'Great — how many accounts flagged this cycle?',
      timestamp: '9:10 AM',
    },
    {
      id: 3,
      senderId: 20,
      senderName: 'Vikram Nair',
      senderAvatar: 'VN',
      senderColor: 'bg-emerald-600',
      body: 'Can you review the KYC report by EOD? Found 14 high-value accounts with missing documents.',
      timestamp: '9:15 AM',
    },
  ],
};

// Default messages for conversations without specific mock data
const DEFAULT_MESSAGES = (name: string): Message[] => [
  {
    id: 1,
    senderId: 99,
    senderName: name,
    senderAvatar: name.slice(0, 2).toUpperCase(),
    senderColor: 'bg-violet-600',
    body: 'Hello! This conversation is active.',
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
      <div className={`${sizeClass} ${color} rounded-full flex items-center justify-center font-bold text-white`}>
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

// ─── Main Chats Page ──────────────────────────────────────────────────────────

const Chats = () => {
  const [activeId, setActiveId] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [messageMap, setMessageMap] = useState<Record<number, Message[]>>(MESSAGES_BY_CONV);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeConv = CONVERSATIONS.find((c) => c.id === activeId)!;

  const filteredConvs = CONVERSATIONS.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const messages = messageMap[activeId] ?? DEFAULT_MESSAGES(activeConv?.name ?? '');

  // Auto-scroll to bottom when messages change or conversation switches
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeId]);

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
      [activeId]: [...(prev[activeId] ?? DEFAULT_MESSAGES(activeConv.name)), newMsg],
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
    // Fill the exact height of the main content area (Layout sets flex-col on the right column)
    <div className="flex h-[calc(100vh-64px)] font-sans overflow-hidden">

      {/* ── LEFT PANEL: Conversation List ── */}
      <div className="w-72 shrink-0 border-r border-gray-200 bg-white flex flex-col">

        {/* Header */}
        <div className="px-4 pt-5 pb-3">
          <h2 className="text-[17px] font-bold text-gray-900 mb-3">Messages</h2>
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search conversations…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="
                w-full h-9 pl-8 pr-3 rounded-lg bg-gray-50 border border-gray-200
                text-[13px] text-gray-900 placeholder:text-gray-400 outline-none
                focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20
                transition-[border-color,box-shadow] duration-150
              "
            />
          </div>
        </div>

        {/* Section label */}
        <div className="px-4 pb-1.5">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">
            All Conversations
          </p>
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-0.5">
          {filteredConvs.map((conv) => {
            const isActive = conv.id === activeId;
            return (
              <button
                key={conv.id}
                onClick={() => setActiveId(conv.id)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left
                  transition-colors duration-100
                  ${isActive
                    ? 'bg-indigo-50 text-indigo-900'
                    : 'hover:bg-gray-50 text-gray-800'
                  }
                `}
              >
                {/* Avatar */}
                <Avatar initials={conv.avatar} color={conv.avatarColor} size="md" online={conv.online} />

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className={`text-[14px] font-semibold truncate ${isActive ? 'text-indigo-900' : 'text-gray-900'}`}>
                      {conv.type === 'team' && (
                        <Hash size={11} className="inline mr-0.5 opacity-60" />
                      )}
                      {conv.name}
                    </span>
                    <span className="text-[11px] text-gray-400 shrink-0">{conv.time}</span>
                  </div>
                  <p className="text-[13px] text-gray-500 truncate mt-0.5">{conv.lastMessage}</p>
                </div>

                {/* Unread badge */}
                {conv.unread > 0 && (
                  <span className="shrink-0 min-w-[20px] h-5 px-1.5 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center">
                    {conv.unread > 99 ? '99+' : conv.unread}
                  </span>
                )}
              </button>
            );
          })}
          {filteredConvs.length === 0 && (
            <p className="text-center text-[13px] text-gray-400 mt-8 px-4">
              No conversations match "<span className="font-medium">{searchQuery}</span>"
            </p>
          )}
        </div>
      </div>

      {/* ── RIGHT PANEL: Active Conversation ── */}
      <div className="flex-1 flex flex-col bg-gray-50 min-w-0">

        {/* Chat Header */}
        <div className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <Avatar
              initials={activeConv.avatar}
              color={activeConv.avatarColor}
              size="lg"
              online={activeConv.online}
            />
            <div>
              <h3 className="text-[15px] font-bold text-gray-900 leading-tight flex items-center gap-1">
                {activeConv.type === 'team' && <Hash size={13} className="text-gray-500" />}
                {activeConv.name}
              </h3>
              <p className="text-[12px] text-gray-500">
                {activeConv.type === 'team'
                  ? 'Team channel'
                  : activeConv.online
                  ? 'Online now'
                  : 'Last seen recently'}
              </p>
            </div>
          </div>

          {/* Right-side actions */}
          <div className="flex items-center gap-1">
            <button
              title="Voice Call"
              className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"
            >
              <Phone size={17} />
            </button>
            <button
              title="Video Call"
              className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"
            >
              <Video size={17} />
            </button>
          </div>
        </div>

        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {messages.map((msg, idx) => {
            const isMe = msg.senderId === 'me';
            // Only show avatar + name if sender changes
            const prevMsg = idx > 0 ? messages[idx - 1] : null;
            const showHeader = !prevMsg || prevMsg.senderId !== msg.senderId;

            return (
              <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar — only show if first in a group */}
                <div className="w-9 shrink-0">
                  {showHeader && (
                    <Avatar initials={msg.senderAvatar} color={msg.senderColor} size="md" />
                  )}
                </div>

                {/* Bubble group */}
                <div className={`flex flex-col gap-1 max-w-[65%] ${isMe ? 'items-end' : 'items-start'}`}>
                  {showHeader && (
                    <span className="text-[12px] font-semibold text-gray-500 px-1">
                      {isMe ? 'You' : msg.senderName}
                    </span>
                  )}
                  <div
                    className={`
                      px-4 py-2.5 rounded-2xl text-[14px] leading-relaxed shadow-sm
                      ${isMe
                        ? 'rounded-tr-sm text-white'
                        : 'rounded-tl-sm bg-white text-gray-900 border border-gray-200'
                      }
                    `}
                    style={isMe ? { background: '#030213' } : {}}
                  >
                    {msg.body}
                  </div>
                  <span className="text-[11px] text-gray-400 px-1">{msg.timestamp}</span>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* ── Message Input ── */}
        <div className="shrink-0 bg-white border-t border-gray-200 px-6 py-4">
          <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-[border-color,box-shadow] duration-150">
            {/* Attachment */}
            <button
              title="Attach file"
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Paperclip size={18} />
            </button>

            {/* Input */}
            <input
              type="text"
              placeholder={`Message ${activeConv.type === 'team' ? '#' : ''}${activeConv.name}…`}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent text-[14px] text-gray-900 placeholder:text-gray-400 outline-none"
            />

            {/* Emoji */}
            <button
              title="Emoji"
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Smile size={18} />
            </button>

            {/* Send */}
            <button
              onClick={handleSend}
              disabled={!inputValue.trim()}
              title="Send message"
              className="
                w-8 h-8 rounded-lg flex items-center justify-center text-white
                transition-[opacity,transform] duration-150
                disabled:opacity-30 disabled:cursor-not-allowed
                hover:opacity-90 active:scale-95
              "
              style={{ background: '#030213' }}
            >
              <Send size={15} />
            </button>
          </div>

          <p className="text-center text-[11px] text-gray-400 mt-2">
            Press <kbd className="px-1 py-0.5 bg-gray-100 border border-gray-200 rounded text-[10px] font-mono">Enter</kbd> to send
          </p>
        </div>
      </div>
    </div>
  );
};

export default Chats;
