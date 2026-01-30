import React, { useState, useEffect } from 'react';
import { Download, FileText, FileSpreadsheet, Presentation, Search, Plus, Edit2, Trash2, X, Settings } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { supabase } from './supabaseClient';

const DocumentHub = () => {
  // Admin state
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [showDocForm, setShowDocForm] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedMenu, setSelectedMenu] = useState('Eksternal');
  const [internalAccessGranted, setInternalAccessGranted] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Documents from Supabase
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Panduan',
    type: 'pdf',
    menu: 'Eksternal',
    thumbnail: '',
    download_url: ''
  });

  // Load documents from Supabase
  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoadingDocs(true);
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Gagal memuat dokumen');
    } finally {
      setLoadingDocs(false);
    }
  };

  const categories = ['All', 'Panduan', 'Data', 'Memo'];
  const menus = ['Internal', 'Eksternal'];

  const getFileIcon = (type) => {
    switch(type) {
      case 'ppt': return <Presentation className="w-5 h-5" />;
      case 'excel': return <FileSpreadsheet className="w-5 h-5" />;
      case 'pdf': return <FileText className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  const getFileColor = (type) => {
    switch(type) {
      case 'ppt': return 'bg-orange-100 text-orange-600';
      case 'excel': return 'bg-green-100 text-green-600';
      case 'pdf': return 'bg-red-100 text-red-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  // Admin login
  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminPassword === 'admin123') {
      setIsAdmin(true);
      setShowAdminLogin(false);
      setAdminPassword('');
      toast.success('Login admin berhasil!');
    } else {
      toast.error('Password admin salah!');
    }
  };

  // Add/Edit document
  const handleSaveDocument = async (e) => {
    e.preventDefault();
    try {
      if (editingDoc) {
        // Update existing
        const { error } = await supabase
          .from('documents')
          .update(formData)
          .eq('id', editingDoc.id);

        if (error) throw error;
        toast.success('Dokumen berhasil diupdate!');
      } else {
        // Add new
        const { error } = await supabase
          .from('documents')
          .insert([formData]);

        if (error) throw error;
        toast.success('Dokumen berhasil ditambahkan!');
      }
      
      fetchDocuments(); // Refresh list
      resetForm();
    } catch (error) {
      console.error('Error saving document:', error);
      toast.error('Gagal menyimpan dokumen');
    }
  };

  // Delete document
  const handleDeleteDocument = async (id) => {
    if (window.confirm('Yakin ingin menghapus dokumen ini?')) {
      try {
        const { error } = await supabase
          .from('documents')
          .delete()
          .eq('id', id);

        if (error) throw error;
        
        toast.success('Dokumen berhasil dihapus!');
        fetchDocuments(); // Refresh list
      } catch (error) {
        console.error('Error deleting document:', error);
        toast.error('Gagal menghapus dokumen');
      }
    }
  };

  // Edit document
  const handleEditDocument = (doc) => {
    setEditingDoc(doc);
    setFormData({
      title: doc.title,
      description: doc.description,
      category: doc.category,
      type: doc.type,
      menu: doc.menu,
      thumbnail: doc.thumbnail,
      download_url: doc.download_url
    });
    setShowDocForm(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'Panduan',
      type: 'pdf',
      menu: 'Eksternal',
      thumbnail: '',
      download_url: ''
    });
    setEditingDoc(null);
    setShowDocForm(false);
  };

  // Handle menu click
  const handleMenuClick = (menu) => {
    if (menu === 'Internal' && !internalAccessGranted) {
      setSelectedMenu(menu);
    } else if (menu === 'Eksternal') {
      setSelectedMenu(menu);
      setPasswordError('');
      setPasswordInput('');
    } else {
      setSelectedMenu(menu);
    }
  };

  // Handle password submit
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setPasswordError('');

    try {
      const response = await fetch('/api/check-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput }),
      });

      const data = await response.json();

      if (data.success) {
        setInternalAccessGranted(true);
        setPasswordError('');
        setPasswordInput('');
        toast.success('Akses Internal diberikan!');
      } else {
        setPasswordError('Password salah, coba lagi.');
      }
    } catch (error) {
      setPasswordError('Gagal koneksi ke server.');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter documents
  const filteredDocuments = documents.filter(doc => {
    const matchesMenu = doc.menu === selectedMenu;
    const matchesCategory = selectedCategory === 'All' || doc.category === selectedCategory;
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          doc.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesMenu && matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Keperluan Dokumen Program MBG</h1>
              <p className="mt-2 text-gray-600">Berisi Panduan, Data, dan Memo.</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowAdminLogin(true)}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
                title="Admin Login"
              >
                <Settings className="w-6 h-6" />
              </button>
              <img src="/images/danantara.png" alt="Logo 1" className="h-12 w-auto" />
              <img src="/images/BTN_2024.svg (1).png" alt="Logo 2" className="h-12 w-auto" />
            </div>
          </div>
        </div>
      </header>

      {/* Admin Login Modal */}
      {showAdminLogin && !isAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Admin Login</h2>
              <button onClick={() => setShowAdminLogin(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleAdminLogin}>
              <input
                type="password"
                placeholder="Password Admin"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg mb-4"
                autoFocus
              />
              <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
                Login
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Admin Panel Toggle */}
      {isAdmin && (
        <div className="bg-green-600 text-white py-2 px-4 text-center">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <span>🔧 Mode Admin Aktif - Connected to Supabase</span>
            <button
              onClick={() => setShowAdminPanel(!showAdminPanel)}
              className="bg-white text-green-600 px-4 py-1 rounded hover:bg-gray-100"
            >
              {showAdminPanel ? 'Tutup Admin Panel' : 'Buka Admin Panel'}
            </button>
          </div>
        </div>
      )}

      {/* Admin Panel */}
      {isAdmin && showAdminPanel && (
        <div className="bg-white border-b border-gray-200 py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Kelola Dokumen</h2>
              <button
                onClick={() => setShowDocForm(true)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-5 h-5" />
                Tambah Dokumen
              </button>
            </div>

            {/* Document List */}
            {loadingDocs ? (
              <div className="text-center py-8">Loading documents...</div>
            ) : (
              <div className="space-y-2">
                {documents.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-semibold">{doc.title}</h3>
                      <p className="text-sm text-gray-600">{doc.category} • {doc.menu} • {doc.type.toUpperCase()}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditDocument(doc)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add/Edit Document Form */}
      {showDocForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white p-6 rounded-lg max-w-2xl w-full mx-4 my-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{editingDoc ? 'Edit Dokumen' : 'Tambah Dokumen Baru'}</h2>
              <button onClick={resetForm}>
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSaveDocument} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Judul</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Deskripsi</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg"
                  rows="3"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Kategori</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    <option value="Panduan">Panduan</option>
                    <option value="Data">Data</option>
                    <option value="Memo">Memo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tipe File</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    <option value="pdf">PDF</option>
                    <option value="ppt">PPT</option>
                    <option value="excel">Excel</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Menu</label>
                <select
                  value={formData.menu}
                  onChange={(e) => setFormData({...formData, menu: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="Internal">Internal</option>
                  <option value="Eksternal">Eksternal</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">URL Thumbnail</label>
                <input
                  type="text"
                  value={formData.thumbnail}
                  onChange={(e) => setFormData({...formData, thumbnail: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="/images/nama-file.png"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Upload gambar ke folder public/images/, lalu tulis: /images/nama-file.png</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">URL Download</label>
                <input
                  type="text"
                  value={formData.download_url}
                  onChange={(e) => setFormData({...formData, download_url: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="https://drive.google.com/uc?export=download&id=..."
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Gunakan format direct download dari Google Drive</p>
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                >
                  {editingDoc ? 'Update Dokumen' : 'Tambah Dokumen'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Menu Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-4">
            {menus.map(menu => (
              <button
                key={menu}
                onClick={() => handleMenuClick(menu)}
                className={`py-4 px-6 font-semibold text-lg border-b-4 transition-colors ${
                  selectedMenu === menu
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-blue-600 hover:border-blue-600'
                }`}
              >
                {menu}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Password Form for Internal */}
      {selectedMenu === 'Internal' && !internalAccessGranted && (
        <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md border border-gray-300">
          <form onSubmit={handlePasswordSubmit}>
            <label className="block mb-2 font-semibold text-gray-700">
              🔒 Masukkan Password untuk akses Internal:
            </label>
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              placeholder="Password"
              autoFocus
              disabled={isLoading}
            />
            {passwordError && <p className="text-red-600 mb-4">{passwordError}</p>}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-md transition-colors disabled:bg-gray-400"
            >
              {isLoading ? 'Memverifikasi...' : 'Submit'}
            </button>
          </form>
        </div>
      )}

      {/* Documents View */}
      {(selectedMenu === 'Eksternal' || internalAccessGranted) && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Filters */}
          <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 mb-4">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-3 rounded-lg whitespace-nowrap font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="flex mb-8">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Cari dokumen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Loading State */}
          {loadingDocs && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Memuat dokumen...</p>
            </div>
          )}

          {/* Documents Grid */}
          {!loadingDocs && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDocuments.map(doc => (
                <div key={doc.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-200">
                  <div className="relative h-48 bg-gray-200 overflow-hidden">
                    <img src={doc.thumbnail} alt={doc.title} className="w-full h-full object-cover" />
                    <div className={`absolute top-3 right-3 p-2 rounded-lg ${getFileColor(doc.type)}`}>
                      {getFileIcon(doc.type)}
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded">
                        {doc.category}
                      </span>
                      <span className="text-xs text-gray-500 uppercase">{doc.type}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{doc.title}</h3>
                    <p className="text-gray-600 text-sm mb-4">{doc.description}</p>
                    <button
                      onClick={() => {
                        toast.success('Download dimulai!');
                        window.open(doc.download_url, '_blank');
                      }}
                      className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loadingDocs && filteredDocuments.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada dokumen ditemukan</h3>
              <p className="text-gray-600">Coba ubah kata kunci pencarian atau filter kategori</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DocumentHub;