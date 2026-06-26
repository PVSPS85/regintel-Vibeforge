import {
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  Filter,
  Search,
  User,
  Users,
} from 'lucide-react';
import { useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

type Priority = 'High' | 'Medium' | 'Low';
type Status = 'Pending' | 'In Progress' | 'Completed';

interface ActionPoint {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  dueDate: string;
  status: Status;
  assignedTo: string;
  assigneeType: 'user' | 'team';
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_TASKS: ActionPoint[] = [
  {
    id: 'AP-1042',
    title: 'Review KYC Documentation for High-Value Accounts',
    description: 'Verify missing identity documents for 14 flagged corporate accounts in the Fort Branch before Q2 audit.',
    priority: 'High',
    dueDate: 'Today',
    status: 'In Progress',
    assignedTo: 'Vikram Nair',
    assigneeType: 'user',
  },
  {
    id: 'AP-1043',
    title: 'Implement 2FA on Internal Portals',
    description: 'Roll out mandatory two-factor authentication for all branch employees accessing the core banking system.',
    priority: 'High',
    dueDate: 'Tomorrow',
    status: 'Pending',
    assignedTo: 'IT Security Team',
    assigneeType: 'team',
  },
  {
    id: 'AP-1044',
    title: 'Update Branch AML Procedures',
    description: 'Revise local anti-money laundering guidelines to reflect the latest RBI circular.',
    priority: 'Medium',
    dueDate: '24 Jun 2026',
    status: 'Pending',
    assignedTo: 'Compliance Core',
    assigneeType: 'team',
  },
  {
    id: 'AP-1045',
    title: 'Submit Monthly Compliance Report',
    description: 'Compile and submit the consolidated compliance rating report to the regional head office.',
    priority: 'High',
    dueDate: '30 Jun 2026',
    status: 'Completed',
    assignedTo: 'Arjun Mehta',
    assigneeType: 'user',
  },
  {
    id: 'AP-1046',
    title: 'Employee Training: Phishing Awareness',
    description: 'Ensure all branch staff complete the mandatory Q2 cybersecurity training module.',
    priority: 'Low',
    dueDate: '15 Jul 2026',
    status: 'Pending',
    assignedTo: 'Fort Branch General',
    assigneeType: 'team',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getPriorityStyles = (priority: Priority) => {
  switch (priority) {
    case 'High':
      return 'bg-red-50 text-red-700 ring-red-600/20';
    case 'Medium':
      return 'bg-amber-50 text-amber-700 ring-amber-600/20';
    case 'Low':
      return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20';
  }
};

const getStatusStyles = (status: Status) => {
  switch (status) {
    case 'Pending':
      return 'text-gray-500 bg-[#f3f3f5] border-[rgba(0,0,0,0.1)]';
    case 'In Progress':
      return 'text-[#030213] bg-[#f3f3f5] border-indigo-200';
    case 'Completed':
      return 'text-emerald-700 bg-emerald-50 border-emerald-200';
  }
};

// ─── Main Component ───────────────────────────────────────────────────────────

const ActionPoints = () => {
  const [tasks, setTasks] = useState<ActionPoint[]>(MOCK_TASKS);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<Status | 'All'>('All');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'All'>('All');

  const toggleTaskStatus = (id: string) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) => {
        if (task.id === id) {
          return {
            ...task,
            status: task.status === 'Completed' ? 'Pending' : 'Completed',
          };
        }
        return task;
      })
    );
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'All' || task.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 font-sans">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Action Points</h1>
        <p className="text-[14px] text-gray-500 mt-1">
          Manage and track compliance tasks and operational duties.
        </p>
      </div>

      {/* ── Toolbar (Search & Filters) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-white p-4 rounded-md border border-[rgba(0,0,0,0.1)] shadow-sm">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search tasks by ID or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-md border border-[rgba(0,0,0,0.1)] bg-[#f3f3f5] text-[14px] text-gray-900 placeholder:text-gray-400 outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-[#030213]/20 transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as Status | 'All')}
              className="h-10 px-3 rounded-md border border-[rgba(0,0,0,0.1)] bg-white text-[13px] font-medium text-gray-700 outline-none hover:bg-[#f3f3f5] focus:border-indigo-400 focus:ring-2 focus:ring-[#030213]/20 cursor-pointer appearance-none"
            >
              <option value="All">All Status</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as Priority | 'All')}
            className="h-10 px-3 rounded-md border border-[rgba(0,0,0,0.1)] bg-white text-[13px] font-medium text-gray-700 outline-none hover:bg-[#f3f3f5] focus:border-indigo-400 focus:ring-2 focus:ring-[#030213]/20 cursor-pointer appearance-none"
          >
            <option value="All">All Priorities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {/* ── Task List ── */}
      <div className="bg-white rounded-md border border-[rgba(0,0,0,0.1)] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-[#f3f3f5]/50 border-b border-[rgba(0,0,0,0.1)] text-[12px] font-semibold text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-4 w-12"></th>
                <th className="px-6 py-4">Task Details</th>
                <th className="px-6 py-4 w-32">Priority</th>
                <th className="px-6 py-4 w-40">Due Date</th>
                <th className="px-6 py-4 w-40">Status</th>
                <th className="px-6 py-4 w-48">Assigned To</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTasks.length > 0 ? (
                filteredTasks.map((task) => {
                  const isCompleted = task.status === 'Completed';
                  return (
                    <tr
                      key={task.id}
                      className={`group hover:bg-[#f3f3f5] transition-colors ${
                        isCompleted ? 'bg-[#f3f3f5]/30' : ''
                      }`}
                    >
                      {/* Checkbox Action */}
                      <td className="px-6 py-4 align-top pt-5">
                        <button
                          onClick={() => toggleTaskStatus(task.id)}
                          className={`flex items-center justify-center w-6 h-6 rounded-full transition-colors ${
                            isCompleted
                              ? 'text-emerald-500 hover:text-gray-400'
                              : 'text-gray-300 hover:text-emerald-500'
                          }`}
                          aria-label={isCompleted ? 'Mark as pending' : 'Mark as completed'}
                        >
                          {isCompleted ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                        </button>
                      </td>

                      {/* Title & Description */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[12px] font-mono font-medium text-gray-400 bg-gray-100 px-1.5 rounded">
                              {task.id}
                            </span>
                            <span
                              className={`text-[14px] font-bold ${
                                isCompleted ? 'text-gray-500 line-through' : 'text-gray-900'
                              }`}
                            >
                              {task.title}
                            </span>
                          </div>
                          <p className="text-[13px] text-gray-500 leading-snug line-clamp-2 pr-4">
                            {task.description}
                          </p>
                        </div>
                      </td>

                      {/* Priority */}
                      <td className="px-6 py-4 align-top pt-5">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-1 text-[11px] font-semibold ring-1 ring-inset ${getPriorityStyles(
                            task.priority
                          )}`}
                        >
                          {task.priority}
                        </span>
                      </td>

                      {/* Due Date */}
                      <td className="px-6 py-4 align-top pt-5">
                        <div className="flex items-center gap-1.5 text-[13px] font-medium text-gray-600">
                          <Calendar size={14} className="text-gray-400" />
                          {task.dueDate}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 align-top pt-5">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold border ${getStatusStyles(
                            task.status
                          )}`}
                        >
                          {task.status === 'In Progress' && <Clock size={12} />}
                          {task.status === 'Completed' && <CheckCircle2 size={12} />}
                          {task.status}
                        </span>
                      </td>

                      {/* Assigned To */}
                      <td className="px-6 py-4 align-top pt-5">
                        <div className="flex items-center gap-2 text-[13px] font-medium text-gray-700">
                          {task.assigneeType === 'team' ? (
                            <div className="w-6 h-6 rounded-md bg-[#f3f3f5] text-[#030213] flex items-center justify-center shrink-0">
                              <Users size={12} />
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                              <User size={12} />
                            </div>
                          )}
                          <span className="truncate">{task.assignedTo}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 text-[14px]">
                    No action points found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ActionPoints;
