import { useState, useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { Plus, Search, Loader2Icon } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import EmployeeCard from '../components/employees/EmployeeCard';
import EmployeeModal from '../components/employees/EmployeeModal';
import { useAuth } from '../context/AuthContext';

const Employees = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All Departments');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const confirmTimerRef = useRef(null);

  // Fetch employees
  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/employees', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmployees(res.data.data);
      setFilteredEmployees(res.data.data);
    } catch (error) {
      toast.error('Failed to load employees');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // Filter employees
  useEffect(() => {
    let result = employees;
    if (departmentFilter !== 'All Departments') {
      result = result.filter(emp => emp.department === departmentFilter);
    }
    if (searchQuery) {
      result = result.filter(emp => emp.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    setFilteredEmployees(result);
  }, [searchQuery, departmentFilter, employees]);

  // Handle Add/Edit
  const handleSubmit = async (formData) => {
    setLoading(true);
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    // Sanitize data: remove empty strings for optional numeric/date fields
    const payload = { ...formData };
    if (payload.basicSalary === '') payload.basicSalary = null;
    if (payload.allowances === '') payload.allowances = null;
    if (payload.deductions === '') payload.deductions = null;
    if (payload.joinDate === '') payload.joinDate = null;

    try {
      if (selectedEmployee) {
        // Edit
        await axios.put(`/api/employees/${selectedEmployee._id}`, payload, { headers });
        toast.success('Employee updated successfully');
      } else {
        // Add
        await axios.post('/api/employees', payload, { headers });
        toast.success('Employee added successfully');
      }
      setIsModalOpen(false);
      fetchEmployees();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Action failed');
    } finally {
      setLoading(false);
    }
  };

  // Handle Delete — two-step inline confirmation
  const handleDelete = async (id) => {
    if (confirmDeleteId !== id) {
      // First click: arm the confirmation
      setConfirmDeleteId(id);
      clearTimeout(confirmTimerRef.current);
      confirmTimerRef.current = setTimeout(() => setConfirmDeleteId(null), 3000);
      return;
    }
    // Second click: proceed with deletion
    clearTimeout(confirmTimerRef.current);
    setConfirmDeleteId(null);
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`/api/employees/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Employee deleted successfully');
      fetchEmployees();
    } catch (error) {
      toast.error('Failed to delete employee');
    }
  };

  const openAddModal = () => {
    setSelectedEmployee(null);
    setIsModalOpen(true);
  };

  const openEditModal = (employee) => {
    setSelectedEmployee(employee);
    setIsModalOpen(true);
  };

  return (
    <div className="animate-fade-in pb-10">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Employees</h1>
          <p className="text-slate-500 mt-1">Manage your team members</p>
        </div>
        {isAdmin && (
          <button 
            onClick={openAddModal}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <Plus size={18} />
            Add Employee
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search employees..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
          />
        </div>
        <select 
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          className="w-full md:w-64 px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none appearance-none transition-all cursor-pointer"
        >
          <option value="All Departments">All Departments</option>
          <option value="Engineering">Engineering</option>
          <option value="Marketing">Marketing</option>
          <option value="Sales">Sales</option>
          <option value="HR">HR</option>
          <option value="Finance">Finance</option>
        </select>
      </div>

      {/* Grid */}
      {fetching ? (
        <div className="flex justify-center items-center h-64">
          <Loader2Icon className="animate-spin text-indigo-500" size={32} />
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div className="text-center py-20 bg-white border border-slate-200 rounded-2xl">
          <p className="text-slate-500 mb-4">No employees found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredEmployees.map((emp) => (
            <EmployeeCard 
              key={emp._id} 
              employee={emp} 
              onEdit={openEditModal} 
              onDelete={handleDelete}
              confirmDeleteId={confirmDeleteId}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      <EmployeeModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        employee={selectedEmployee}
        loading={loading}
      />

    </div>
  );
};

export default Employees;