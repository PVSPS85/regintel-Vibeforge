
export default function UserManagement() {
  const staffMembers = [
    { id: 101, name: 'Vikram Singh', role: 'Branch Manager', status: 'Active', branch: 'MUM' },
    { id: 102, name: 'Neha Gupta', role: 'Compliance Officer', status: 'Active', branch: 'BLR' },
    { id: 103, name: 'Amit Kumar', role: 'Relationship Manager', status: 'On Leave', branch: 'DEL' },
  ];

  return (
    <div className="flex flex-col h-full w-full bg-[#ffffff] p-8 font-sans">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">User & Role Management</h1>
          <p className="text-gray-500 mt-2">Central dashboard for employee permissions and administrative oversight.</p>
        </div>
        <button onClick={() => alert('Route connected: Action')}  className="bg-[#030213] hover:bg-[#030213] text-white px-5 py-2.5 rounded-md text-sm font-medium shadow-sm transition-colors flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
          Add Employee
        </button>
      </header>

      <div className="grid gap-4">
        {staffMembers.map((staff) => (
          <div key={staff.id} className="flex items-center justify-between p-6 bg-white border border-[rgba(0,0,0,0.1)] rounded-md shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-semibold text-lg">
                {staff.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                  {staff.name}
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${staff.status === 'Active' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                    {staff.status}
                  </span>
                </h3>
                <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                  <span>{staff.role}</span>
                  <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                  <span className="font-medium text-gray-700">Branch: {staff.branch}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button onClick={() => alert('Route connected: Action')}  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-[rgba(0,0,0,0.1)] rounded-md hover:bg-[#f3f3f5] transition-colors shadow-sm">
                Modify Permissions
              </button>
              <button onClick={() => alert('Route connected: Action')}  className="px-4 py-2 text-sm font-medium text-[#030213] bg-[#f3f3f5] border border-[rgba(0,0,0,0.1)] rounded-md hover:bg-blue-100 transition-colors shadow-sm">
                Initiate Branch Transfer
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
