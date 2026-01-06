import React, { useState, useRef } from 'react';
import { Upload, Plus, Search, Edit2, Trash2, Key, X, Users, FileSpreadsheet, AlertCircle, Check } from 'lucide-react';
import { Employee } from '../types';

interface UserManagementProps {
  users: Employee[];
  onRefresh: () => void;
}

export default function UserManagement({ users, onRefresh }: UserManagementProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Employee | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [formData, setFormData] = useState({ nik: '', nama: '', departemen: '', jabatan: '', role: 'user' as 'admin' | 'user' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const filteredUsers = users.filter(user => 
    user.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.nik.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.departemen?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.jabatan?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddUser = async () => {
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showNotification('success', 'User berhasil ditambahkan');
      setIsAddModalOpen(false);
      setFormData({ nik: '', nama: '', departemen: '', jabatan: '', role: 'user' });
      onRefresh();
    } catch (error: any) {
      showNotification('error', error.message || 'Gagal menambahkan user');
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    try {
      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showNotification('success', 'User berhasil diupdate');
      setEditingUser(null);
      setFormData({ nik: '', nama: '', departemen: '', jabatan: '', role: 'user' });
      onRefresh();
    } catch (error: any) {
      showNotification('error', error.message || 'Gagal mengupdate user');
    }
  };

  const handleDeleteUser = async (user: Employee) => {
    if (!confirm(`Hapus user ${user.nama}?`)) return;
    try {
      const res = await fetch(`/api/users/${user.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Gagal menghapus user');
      showNotification('success', 'User berhasil dihapus');
      onRefresh();
    } catch (error: any) {
      showNotification('error', error.message);
    }
  };

  const handleResetPassword = async (user: Employee) => {
    if (!confirm(`Reset password ${user.nama} ke default (123456)?`)) return;
    try {
      const res = await fetch(`/api/users/${user.id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: '123456' })
      });
      if (!res.ok) throw new Error('Gagal reset password');
      showNotification('success', 'Password berhasil direset ke 123456');
    } catch (error: any) {
      showNotification('error', error.message);
    }
  };

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/users/upload-excel', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showNotification('success', data.message);
      onRefresh();
    } catch (error: any) {
      showNotification('error', error.message || 'Gagal import Excel');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const openEditModal = (user: Employee) => {
    setEditingUser(user);
    setFormData({
      nik: user.nik,
      nama: user.nama,
      departemen: user.departemen || '',
      jabatan: user.jabatan || '',
      role: user.role
    });
  };

  return (
    <div className="flex-1 bg-zinc-50 p-6 overflow-auto">
      {notification && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg ${
          notification.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {notification.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
          {notification.message}
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Users className="text-emerald-600" size={28} />
            <h1 className="text-2xl font-bold text-zinc-800">Manajemen User</h1>
          </div>
          <div className="flex gap-3">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleExcelUpload}
              accept=".xlsx,.xls"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              <FileSpreadsheet size={18} />
              {isUploading ? 'Importing...' : 'Import Excel'}
            </button>
            <button
              onClick={() => {
                setFormData({ nik: '', nama: '', departemen: '', jabatan: '', role: 'user' });
                setIsAddModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
            >
              <Plus size={18} />
              Tambah User
            </button>
          </div>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama, NIK, departemen..."
            className="w-full pl-10 pr-4 py-2.5 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-600 uppercase">No</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-600 uppercase">Nama</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-600 uppercase">NIK</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-600 uppercase">Departemen</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-600 uppercase">Jabatan</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-600 uppercase">Role</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-zinc-600 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-zinc-500">
                    {searchQuery ? 'Tidak ada user yang cocok' : 'Belum ada user'}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, index) => (
                  <tr key={user.id} className="hover:bg-zinc-50">
                    <td className="px-4 py-3 text-sm text-zinc-600">{index + 1}</td>
                    <td className="px-4 py-3 text-sm font-medium text-zinc-800">{user.nama}</td>
                    <td className="px-4 py-3 text-sm text-zinc-600 font-mono">{user.nik}</td>
                    <td className="px-4 py-3 text-sm text-zinc-600">{user.departemen || '-'}</td>
                    <td className="px-4 py-3 text-sm text-zinc-600">{user.jabatan || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        user.role === 'admin' 
                          ? 'bg-purple-100 text-purple-700' 
                          : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {user.role === 'admin' ? 'Admin' : 'User'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openEditModal(user)}
                          className="p-1.5 text-zinc-400 hover:text-blue-500 hover:bg-blue-50 rounded"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleResetPassword(user)}
                          className="p-1.5 text-zinc-400 hover:text-amber-500 hover:bg-amber-50 rounded"
                          title="Reset Password"
                        >
                          <Key size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user)}
                          className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded"
                          title="Hapus"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 text-sm text-zinc-500">
          Total: {filteredUsers.length} user
        </div>
      </div>

      {(isAddModalOpen || editingUser) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                {editingUser ? 'Edit User' : 'Tambah User Baru'}
              </h2>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingUser(null);
                }}
                className="p-1 hover:bg-zinc-100 rounded"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">NIK *</label>
                <input
                  type="text"
                  value={formData.nik}
                  onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="C-012345"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Nama *</label>
                <input
                  type="text"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Nama lengkap"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Departemen</label>
                <input
                  type="text"
                  value={formData.departemen}
                  onChange={(e) => setFormData({ ...formData, departemen: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="HSE, Operation, dll"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Jabatan</label>
                <input
                  type="text"
                  value={formData.jabatan}
                  onChange={(e) => setFormData({ ...formData, jabatan: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Manager, Pengawas, dll"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'user' })}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingUser(null);
                }}
                className="flex-1 px-4 py-2 border border-zinc-300 rounded-lg hover:bg-zinc-50"
              >
                Batal
              </button>
              <button
                onClick={editingUser ? handleUpdateUser : handleAddUser}
                disabled={!formData.nik || !formData.nama}
                className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingUser ? 'Update' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
