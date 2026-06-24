import {
  MessageSquare,
  Search,
  Check,
  Mail,
  Phone,
  MapPin,
  Building,
} from 'lucide-react';
import { useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Employee {
  id: string;
  name: string;
  role: string;
  department: string;
  branch: string;
  email: string;
  phone: string;
  avatar: string;
  avatarColor: string;
  online: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MOCK_EMPLOYEES: Employee[] = [
  {
    id: 'EMP-9402',
    name: 'Priya Sharma',
    role: 'Compliance Associate',
    department: 'Risk & Compliance',
    branch: 'Mumbai - Fort Branch',
    email: 'priya.sharma@regintel.com',
    phone: '+91 98765 43210',
    avatar: 'PS',
    avatarColor: 'bg-rose-500',
    online: true,
  },
  {
    id: 'EMP-1042',
    name: 'Vikram Nair',
    role: 'Relationship Manager',
    department: 'Retail Banking',
    branch: 'Mumbai - Fort Branch',
    email: 'vikram.nair@regintel.com',
    phone: '+91 98765 43211',
    avatar: 'VN',
    avatarColor: 'bg-emerald-600',
    online: true,
  },
  {
    id: 'EMP-2201',
    name: 'Harshith',
    role: 'Branch Manager',
    department: 'Operations',
    branch: 'Bengaluru - Whitefield Branch',
    email: 'harshith.k@regintel.com',
    phone: '+91 98765 43212',
    avatar: 'HK',
    avatarColor: 'bg-violet-600',
    online: false,
  },
  {
    id: 'EMP-3049',
    name: 'Arjun Mehta',
    role: 'IT Security Analyst',
    department: 'Information Technology',
    branch: 'Mumbai - Fort Branch',
    email: 'arjun.mehta@regintel.com',
    phone: '+91 98765 43213',
    avatar: 'AM',
    avatarColor: 'bg-[#030213]',
    online: true,
  },
  {
    id: 'EMP-1108',
    name: 'Aisha Mehta',
    role: 'Compliance Officer',
    department: 'Risk & Compliance',
    branch: 'Mumbai - Fort Branch',
    email: 'aisha.mehta@regintel.com',
    phone: '+91 98765 43214',
    avatar: 'AM',
    avatarColor: 'bg-amber-600',
    online: true,
  },
  {
    id: 'EMP-4050',
    name: 'Rahul Desai',
    role: 'Risk Operations Lead',
    department: 'Risk Management',
    branch: 'Mumbai - Fort Branch',
    email: 'rahul.desai@regintel.com',
    phone: '+91 98765 43215',
    avatar: 'RD',
    avatarColor: 'bg-sky-600',
    online: false,
  },
];

// ─── Main Component ───────────────────────────────────────────────────────────

const Directory = () => {
  const [employees] = useState<Employee[]>(MOCK_EMPLOYEES);
  const [searchQuery, setSearchQuery] = useState('');
  const [messagedIds, setMessagedIds] = useState<Set<string>>(new Set());

  // Filter Employees
  const filteredEmployees = employees.filter((emp) => {
    return (
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.department.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Handle Message Button Click Simulation
  const handleMessageClick = (id: string) => {
    setMessagedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    setTimeout(() => {
      setMessagedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 2000);
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 font-sans min-h-screen">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Branch Directory</h1>
          <p className="text-[14px] text-gray-500 mt-1">
            Browse and connect with other branch compliance team members and managers.
          </p>
        </div>
      </div>

      {/* ── Search Bar ── */}
      <div className="bg-white p-4 rounded-md border border-[rgba(0,0,0,0.1)] shadow-sm flex items-center">
        <div className="relative w-full max-w-md">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search by name, role, or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-md border border-[rgba(0,0,0,0.1)] bg-[#f3f3f5] text-[14px] text-gray-900 placeholder:text-gray-400 outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-[#030213]/20 transition-all"
          />
        </div>
      </div>

      {/* ── Employee Grid ── */}
      {filteredEmployees.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEmployees.map((emp) => (
            <div
              key={emp.id}
              className="bg-white rounded-md border border-[rgba(0,0,0,0.1)] shadow-sm p-6 hover:shadow-md hover:border-gray-300 transition-all flex flex-col justify-between"
            >
              {/* Employee Top Details */}
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  {/* Initials Avatar and Online Status */}
                  <div className="relative shrink-0">
                    <div
                      className={`w-14 h-14 rounded-full ${emp.avatarColor} text-white flex items-center justify-center text-lg font-bold shadow-inner`}
                    >
                      {emp.avatar}
                    </div>
                    <span
                      className={`absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
                        emp.online ? 'bg-emerald-500' : 'bg-gray-300'
                      }`}
                      title={emp.online ? 'Online' : 'Offline'}
                    />
                  </div>

                  {/* Name and Title */}
                  <div className="space-y-0.5">
                    <h2 className="text-[16px] font-bold text-gray-900 tracking-tight">{emp.name}</h2>
                    <p className="text-[12px] font-semibold text-[#030213]">{emp.role}</p>
                    <p className="text-[11px] font-medium text-gray-400 font-mono">{emp.id}</p>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-[rgba(0,0,0,0.1)]" />

                {/* Contact Metadata */}
                <div className="space-y-2 text-[12px] text-gray-500 font-medium">
                  <div className="flex items-center gap-2">
                    <Building size={14} className="text-gray-400" />
                    <span>{emp.department}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-gray-400" />
                    <span>{emp.branch}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-gray-400" />
                    <span className="truncate">{emp.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-gray-400" />
                    <span>{emp.phone}</span>
                  </div>
                </div>
              </div>

              {/* Message Action Button */}
              <div className="pt-5 mt-4 border-t border-[rgba(0,0,0,0.1)]">
                <button
                  onClick={() => handleMessageClick(emp.id)}
                  className={`w-full h-10 rounded-md text-[13px] font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                    messagedIds.has(emp.id)
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-[#030213] text-white hover:bg-opacity-90 shadow-sm active:scale-98'
                  }`}
                >
                  {messagedIds.has(emp.id) ? (
                    <>
                      <Check size={14} />
                      Chat Initialized
                    </>
                  ) : (
                    <>
                      <MessageSquare size={14} />
                      Message
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-md border border-[rgba(0,0,0,0.1)] p-12 text-center text-gray-400 text-[14px]">
          No branch employees found matching your criteria.
        </div>
      )}
    </div>
  );
};

export default Directory;
