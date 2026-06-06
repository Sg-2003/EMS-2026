import { Pencil, Trash2, AlertTriangle } from 'lucide-react';

const EmployeeCard = ({ employee, onEdit, onDelete, confirmDeleteId, isAdmin }) => {
  // Extract initials
  const initials = employee.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const isConfirming = confirmDeleteId === employee._id;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden group relative hover:shadow-lg transition-all duration-300">
      
      {/* Hover Actions */}
      {isAdmin && (
        <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
          <button 
            onClick={() => onEdit(employee)}
            className="p-2 bg-white rounded-lg text-slate-400 hover:text-indigo-600 shadow-sm border border-slate-100 hover:scale-105 transition-all"
            title="Edit"
          >
            <Pencil size={16} />
          </button>
          <button 
            onClick={() => onDelete(employee._id)}
            className={`p-2 rounded-lg shadow-sm border transition-all hover:scale-105 ${
              isConfirming
                ? 'bg-rose-600 text-white border-rose-600 animate-pulse'
                : 'bg-white text-slate-400 hover:text-rose-600 border-slate-100'
            }`}
            title={isConfirming ? 'Click again to confirm delete' : 'Delete'}
          >
            {isConfirming ? <AlertTriangle size={16} /> : <Trash2 size={16} />}
          </button>
        </div>
      )}

      {/* Confirm tooltip */}
      {isAdmin && isConfirming && (
        <div className="absolute top-14 right-3 z-20 bg-rose-600 text-white text-xs px-2 py-1 rounded-lg shadow-lg whitespace-nowrap pointer-events-none">
          Click again to confirm
        </div>
      )}

      {/* Top half - Gray Background */}
      <div className="bg-slate-100 h-32 relative flex items-center justify-center">
        <div className="absolute top-4 left-4 bg-white px-3 py-1 rounded-full text-xs font-medium text-slate-600 shadow-sm border border-slate-200">
          {employee.department || 'Unassigned'}
        </div>
        
        {/* Initials Badge - Shifted down to overlap */}
        <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-2xl font-bold tracking-widest absolute -bottom-10 border-4 border-white shadow-sm">
          {initials}
        </div>
      </div>

      {/* Bottom half - White Background */}
      <div className="pt-14 pb-6 px-6 text-center">
        <h3 className="text-lg font-semibold text-slate-900">{employee.name}</h3>
        <p className="text-sm text-slate-500 mt-1">{employee.position || 'Employee'}</p>
        
        {employee.status === 'inactive' && (
          <span className="inline-block mt-3 px-2 py-1 bg-rose-100 text-rose-600 text-xs rounded-md">
            Inactive
          </span>
        )}
      </div>
    </div>
  );
};

export default EmployeeCard;

