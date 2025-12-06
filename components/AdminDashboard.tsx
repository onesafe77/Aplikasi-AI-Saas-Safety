import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, Trash2, Search, ArrowLeft, CheckCircle2, Database, AlertCircle, FileType, HardDrive, LogOut, Loader2 } from 'lucide-react';
import { UploadedDocument } from '../types';

interface AdminDashboardProps {
  documents: UploadedDocument[];
  onUpload: (file: File) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ documents, onUpload, onDelete, onLogout }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setIsUploading(true);
      try {
        await onUpload(e.dataTransfer.files[0]);
      } catch (error) {
        console.error('Upload failed:', error);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsUploading(true);
      try {
        await onUpload(e.target.files[0]);
      } catch (error) {
        console.error('Upload failed:', error);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await onDelete(id);
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const totalSize = documents.length * 15; // Mock size calculation

  return (
    <div className="flex-1 bg-zinc-50 h-screen overflow-y-auto p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
                <button onClick={onLogout} className="p-2 hover:bg-zinc-200 rounded-full transition-colors flex items-center gap-2 group" title="Logout">
                    <LogOut className="w-5 h-5 text-zinc-600 group-hover:text-red-600" />
                    <span className="text-xs font-bold text-zinc-500 group-hover:text-red-600">KELUAR</span>
                </button>
                <div>
                    <h1 className="text-2xl font-display font-bold text-zinc-900">Knowledge Base Admin</h1>
                    <p className="text-zinc-500 text-sm">Kelola dokumen regulasi internal perusahaan untuk Si Asef.</p>
                </div>
            </div>
            <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-zinc-200 shadow-sm">
                <Database className="w-5 h-5 text-emerald-600" />
                <div>
                    <p className="text-xs text-zinc-400 font-bold uppercase">Total Dokumen</p>
                    <p className="text-lg font-bold text-zinc-900 leading-none">{documents.length}</p>
                </div>
            </div>
        </div>

        {/* Upload Area */}
        <div 
            className={`
                mb-10 border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center text-center transition-all
                ${isUploading ? 'border-emerald-500 bg-emerald-50 cursor-wait' : isDragging ? 'border-emerald-500 bg-emerald-50 scale-[1.01] cursor-pointer' : 'border-zinc-300 bg-white hover:border-emerald-400 hover:bg-zinc-50 cursor-pointer'}
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !isUploading && fileInputRef.current?.click()}
        >
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".txt,.md,.pdf,.doc,.docx"
                disabled={isUploading}
            />
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-sm ${isUploading ? 'bg-emerald-200 text-emerald-700' : 'bg-emerald-100 text-emerald-600'}`}>
                {isUploading ? <Loader2 className="w-8 h-8 animate-spin" /> : <UploadCloud className="w-8 h-8" />}
            </div>
            <h3 className="text-xl font-bold text-zinc-800 mb-2">
                {isUploading ? 'Mengupload Dokumen...' : 'Upload Dokumen Baru'}
            </h3>
            <p className="text-zinc-500 max-w-md mb-6">
                {isUploading ? 'Sedang memproses dan mengindeks dokumen. Mohon tunggu...' : 'Drag & drop file PDF, Word, atau TXT di sini. Si Asef akan otomatis membaca dan mempelajarinya sebagai referensi.'}
            </p>
            <button 
                className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-lg shadow-zinc-900/10 ${isUploading ? 'bg-zinc-400 text-white cursor-not-allowed' : 'bg-zinc-900 text-white hover:bg-emerald-600'}`}
                disabled={isUploading}
            >
                {isUploading ? 'Mengupload...' : 'Pilih File dari Komputer'}
            </button>
        </div>

        {/* Document List */}
        <div className="bg-white rounded-[2rem] border border-zinc-200 shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-zinc-100 flex items-center justify-between">
                <h3 className="font-bold text-lg text-zinc-800 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-emerald-600" />
                    Dokumen Aktif
                </h3>
                <div className="relative">
                    <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                        type="text" 
                        placeholder="Cari dokumen..." 
                        className="pl-9 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 w-64"
                    />
                </div>
            </div>

            {documents.length === 0 ? (
                <div className="p-12 text-center">
                    <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-zinc-300" />
                    </div>
                    <p className="text-zinc-500 font-medium">Belum ada dokumen yang diupload.</p>
                </div>
            ) : (
                <table className="w-full text-left">
                    <thead className="bg-zinc-50/50 text-xs font-bold text-zinc-400 uppercase tracking-wider">
                        <tr>
                            <th className="px-8 py-4">Nama File</th>
                            <th className="px-8 py-4">Tipe</th>
                            <th className="px-8 py-4">Tanggal Upload</th>
                            <th className="px-8 py-4">Status</th>
                            <th className="px-8 py-4 text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                        {documents.map((doc) => (
                            <tr key={doc.id} className="hover:bg-zinc-50/50 transition-colors group">
                                <td className="px-8 py-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-zinc-800 text-sm">{doc.name}</p>
                                            <p className="text-xs text-zinc-400">{doc.size}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-4">
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-100 text-zinc-600 text-xs font-bold uppercase">
                                        <FileType className="w-3 h-3" />
                                        {doc.type.split('/')[1] || 'FILE'}
                                    </span>
                                </td>
                                <td className="px-8 py-4 text-sm text-zinc-500">
                                    {new Date(doc.uploadDate).toLocaleDateString()}
                                </td>
                                <td className="px-8 py-4">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                        <span className="text-sm font-medium text-emerald-600">Terindeks</span>
                                    </div>
                                </td>
                                <td className="px-8 py-4 text-right">
                                    <button 
                                        onClick={() => handleDelete(doc.id)}
                                        className={`p-2 rounded-lg transition-colors ${deletingId === doc.id ? 'text-red-400 cursor-wait' : 'text-zinc-400 hover:text-red-500 hover:bg-red-50'}`}
                                        title="Hapus Dokumen"
                                        disabled={deletingId === doc.id}
                                    >
                                        {deletingId === doc.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
        
        <div className="mt-8 flex gap-4">
            <div className="flex-1 bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                    <HardDrive className="w-5 h-5" />
                </div>
                <div>
                    <h4 className="font-bold text-zinc-900 mb-1">Penyimpanan Aman</h4>
                    <p className="text-sm text-zinc-500">Dokumen dienkripsi dan hanya dapat diakses oleh akun perusahaan Anda. Tidak dibagikan ke publik.</p>
                </div>
            </div>
            <div className="flex-1 bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex items-start gap-4">
                <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
                    <Database className="w-5 h-5" />
                </div>
                <div>
                    <h4 className="font-bold text-zinc-900 mb-1">Auto-Training</h4>
                    <p className="text-sm text-zinc-500">Si Asef langsung mempelajari dokumen baru dalam hitungan detik setelah upload selesai.</p>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;