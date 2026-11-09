import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import adminApi from '../../api/admin';
import {
  Users as UsersIcon,
  Search,
  Shield,
  ShieldAlert,
  UserCheck,
  UserX,
  Loader2,
  Building2,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function Users() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [page, setPage] = useState(1);

  // Department creation modal state
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptHandles, setNewDeptHandles] = useState([]);

  // Fetch users
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users', { search, roleFilter, activeFilter, page }],
    queryFn: () =>
      adminApi.getUsers({
        q: search || undefined,
        role: roleFilter || undefined,
        active: activeFilter ? activeFilter === 'true' : undefined,
        page,
        limit: 15,
      }),
  });

  // Fetch departments
  const { data: departments = [] } = useQuery({
    queryKey: ['admin', 'departments'],
    queryFn: () => adminApi.getDepartments(),
  });

  const users = data?.users || [];
  const meta = data?.meta || { total: 0, page: 1, limit: 15, totalPages: 1 };

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: ({ id, role, isActive, departmentId }) =>
      adminApi.updateUser(id, { role, isActive, departmentId }),
    onSuccess: () => {
      toast.success('User updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to update user');
    },
  });

  // Create department mutation
  const createDeptMutation = useMutation({
    mutationFn: () => adminApi.createDepartment({ name: newDeptName, handles: newDeptHandles }),
    onSuccess: () => {
      toast.success('Department created!');
      setShowDeptModal(false);
      setNewDeptName('');
      setNewDeptHandles([]);
      queryClient.invalidateQueries({ queryKey: ['admin', 'departments'] });
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to create department');
    },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            User & Field Officer Administration
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage citizen access, assign municipal field roles, and configure departments
          </p>
        </div>

        <button
          onClick={() => setShowDeptModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition-colors self-start sm:self-auto"
        >
          <Building2 className="w-4 h-4" />
          Add Department
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          <div className="lg:col-span-6 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by name, email, or phone number..."
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="lg:col-span-3">
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
            >
              <option value="">All Roles</option>
              <option value="citizen">Citizens</option>
              <option value="officer">Field Officers</option>
              <option value="admin">Administrators</option>
            </select>
          </div>

          <div className="lg:col-span-3">
            <select
              value={activeFilter}
              onChange={(e) => {
                setActiveFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
            >
              <option value="">All Statuses</option>
              <option value="true">Active Only</option>
              <option value="false">Inactive / Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-6">User / Contact</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4 text-center">Reports Filed</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Joined</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
                    Loading user records...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    No users matching criteria.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center shrink-0">
                          {u.name ? u.name[0].toUpperCase() : 'U'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 truncate">{u.name}</p>
                          <p className="text-[11px] text-slate-400 font-mono truncate">{u.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Role selector */}
                    <td className="py-3.5 px-4">
                      <select
                        value={u.role}
                        onChange={(e) =>
                          updateUserMutation.mutate({ id: u.id, role: e.target.value })
                        }
                        className={`text-xs px-2.5 py-1 rounded-lg border font-semibold ${
                          u.role === 'admin'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : u.role === 'officer'
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        <option value="citizen">Citizen</option>
                        <option value="officer">Officer</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>

                    {/* Department assignment */}
                    <td className="py-3.5 px-4">
                      <select
                        value={u.department_id || ''}
                        onChange={(e) =>
                          updateUserMutation.mutate({
                            id: u.id,
                            departmentId: e.target.value || null,
                          })
                        }
                        className="text-xs px-2 py-1 rounded-lg border border-slate-200 bg-white text-slate-700"
                      >
                        <option value="">None (General)</option>
                        {departments.map((dept) => (
                          <option key={dept.id} value={dept.id}>
                            {dept.name}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Reports count */}
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-700">
                      {u.reports_count || 0}
                    </td>

                    {/* Active toggle */}
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() =>
                          updateUserMutation.mutate({ id: u.id, isActive: !u.is_active })
                        }
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1 transition-colors ${
                          u.is_active
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {u.is_active ? (
                          <>
                            <UserCheck className="w-3 h-3" /> Active
                          </>
                        ) : (
                          <>
                            <UserX className="w-3 h-3" /> Suspended
                          </>
                        )}
                      </button>
                    </td>

                    {/* Joined date */}
                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {u.created_at ? format(new Date(u.created_at), 'MMM d, yyyy') : '—'}
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-6 text-right">
                      <button
                        onClick={() =>
                          updateUserMutation.mutate({ id: u.id, isActive: !u.is_active })
                        }
                        className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                      >
                        {u.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing <strong>{(meta.page - 1) * meta.limit + 1}</strong> to{' '}
            <strong>{Math.min(meta.page * meta.limit, meta.total)}</strong> of{' '}
            <strong>{meta.total}</strong> accounts
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={meta.page <= 1}
              className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-slate-800">
              Page {meta.page} of {meta.totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
              disabled={meta.page >= meta.totalPages}
              className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Add Department Modal */}
      {showDeptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              Create Municipal Department
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Department Name
              </label>
              <input
                type="text"
                value={newDeptName}
                onChange={(e) => setNewDeptName(e.target.value)}
                placeholder="e.g. Roads & Bridges, Sanitation, Traffic"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeptModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => createDeptMutation.mutate()}
                disabled={createDeptMutation.isPending || !newDeptName.trim()}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
              >
                {createDeptMutation.isPending ? 'Creating...' : 'Create Department'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
