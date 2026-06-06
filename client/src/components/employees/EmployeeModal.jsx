import { useState, useEffect } from 'react';
import { X, Loader2Icon } from 'lucide-react';

const EmployeeModal = ({ isOpen, onClose, onSubmit, employee, loading }) => {
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', phone: '', joinDate: '', bio: '',
    department: 'Engineering', position: '', basicSalary: '', allowances: '', deductions: '', status: 'active'
  });

  useEffect(() => {
    if (employee) {
      setFormData({
        name: employee.name || '',
        email: employee.email || '',
        password: '', // Don't populate password on edit
        phone: employee.phone || '',
        joinDate: employee.joinDate ? new Date(employee.joinDate).toISOString().split('T')[0] : '',
        bio: employee.bio || '',
        department: employee.department || 'Engineering',
        position: employee.position || '',
        basicSalary: employee.basicSalary || '',
        allowances: employee.allowances || '',
        deductions: employee.deductions || '',
        status: employee.status || 'active'
      });
    } else {
      setFormData({
        name: '', email: '', password: '', phone: '', joinDate: '', bio: '',
        department: 'Engineering', position: '', basicSalary: '', allowances: '', deductions: '', status: 'active'
      });
    }
  }, [employee, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col relative">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">
            {employee ? 'Edit Employee' : 'Add Employee'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto flex-1">
          <form id="employeeForm" onSubmit={handleSubmit} className="space-y-8">
            
            {/* Section 1: Personal Information */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-4 uppercase tracking-wider">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Full Name *</label>
                  <input required name="name" value={formData.name} onChange={handleChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Phone Number</label>
                  <input name="phone" value={formData.phone} onChange={handleChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Join Date</label>
                  <input type="date" name="joinDate" value={formData.joinDate} onChange={handleChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm text-slate-600 mb-1">Bio</label>
                  <textarea name="bio" value={formData.bio} onChange={handleChange} rows="3" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"></textarea>
                </div>
              </div>
            </div>

            {/* Section 2: Employment Details */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-4 uppercase tracking-wider">Employment Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Department</label>
                  <select name="department" value={formData.department} onChange={handleChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none">
                    <option value="Engineering">Engineering</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Sales">Sales</option>
                    <option value="HR">HR</option>
                    <option value="Finance">Finance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Position</label>
                  <input name="position" value={formData.position} onChange={handleChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Basic Salary</label>
                  <input type="number" name="basicSalary" value={formData.basicSalary} onChange={handleChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Status</label>
                  <select name="status" value={formData.status} onChange={handleChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 3: Account Setup */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-4 uppercase tracking-wider">Account Setup</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Email *</label>
                  <input type="email" required name="email" value={formData.email} onChange={handleChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Password {employee && '(Leave blank to keep)'}</label>
                  <input type="password" required={!employee} name="password" value={formData.password} onChange={handleChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" />
                </div>
              </div>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 flex justify-end gap-3 bg-slate-50">
          <button type="button" onClick={onClose} className="px-5 py-2.5 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors font-medium">
            Cancel
          </button>
          <button type="submit" form="employeeForm" disabled={loading} className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center">
            {loading ? <Loader2Icon className="animate-spin mr-2 h-4 w-4" /> : null}
            {employee ? 'Save Changes' : 'Add Employee'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployeeModal;
