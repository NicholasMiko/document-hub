import React, { useState, useEffect } from 'react';
import { Download, FileText, FileSpreadsheet, Presentation, Search, Plus, Edit2, Trash2, X, Settings, Upload } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { supabase } from './supabaseClient';

const DocumentHub = () => {
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
  const [uploadingFile, setUploadingFile] = useState(false);

  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(true);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Panduan',
    type: 'pdf',
    menu: 'Eksternal',
    thumbnail: '',
    download_url: ''
  });

  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [documentFile, setDocumentFile] = useState(null);

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
      console.error('Error:', error);
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

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminPassword === 'admin123') {
      setIsAdmin(true);
      setShowAdminLogin(false);
      setAdminPassword('');
      toast.success('Login admin berhasil!');
    } else {
      toast.error('Password salah!');
    }
  };

  const uploadFile = async (file, bucket) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
    const { data, error } = await supabase.storage.from(bucket).upload(fileName, file);
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(fileName);
    return publicUrl;
  };

  const handleSaveDocument = async (e) => {
    e.preventDefault();
    if (!documentFile && !formData.download_url) return toast.error('Pilih file atau isi link!');

    const MAX_IMG_SIZE = 10 * 1024 * 1024; // 10MB
    const MAX_DOC_SIZE = 40 * 1024 * 1024; // 40MB

    if (thumbnailFile && thumbnailFile.size > MAX_IMG_SIZE) return toast.error('Gambar max 10MB!');
    if (documentFile && documentFile.size > MAX_DOC_SIZE) return toast.error('File max 40MB!');

    try {
      setUploadingFile(true);
      let thumbnailUrl = formData.thumbnail;
      let documentUrl = formData.download_url;

      if (thumbnailFile) {
        toast.loading('Uploading thumbnail...', { id: 'up' });
        thumbnailUrl = await uploadFile(thumbnailFile, 'thumbnails');
      }
      if (documentFile) {
        toast.loading('Uploading document...', { id: 'up' });
        documentUrl = await uploadFile(documentFile, 'documents');
      }
      toast.dismiss('up');

      const docData = { ...formData, thumbnail: thumbnailUrl, download_url: documentUrl };
      const { error } = editingDoc 
        ? await supabase.from('documents').update(docData).eq('id', editingDoc.id)
        : await supabase.from('documents').insert([docData]);

      if (error) throw error;
      toast.success('Berhasil!');
      fetchDocuments();
      resetForm();
    } catch (error) {
      toast.error('Error: ' + error.message);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleDeleteDocument = async (id) => {
    if (!window.confirm('Hapus dokumen?')) return;
    try {
      const { error } = await supabase.from('documents').delete().eq('id', id);
      if (error) throw error;
      toast.success('Dihapus');
      fetchDocuments();
    } catch (error) {
      toast.error('Gagal hapus');
    }
  };

  const handleEditDocument = (doc) => {
    setEditingDoc(doc);
    setFormData({ ...doc });
    setShowDocForm(true);
  };

  const resetForm = () => {
    setFormData({ title: '', description: '', category: 'Panduan', type: 'pdf', menu: 'Eksternal', thumbnail: '', download_url: '' });
    setThumbnailFile(null);
    setDocumentFile(null);
    setEditingDoc(null);
    setShowDocForm(false);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch('/api/check-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput }),
      });
      const data = await res.json();
      if (data.success) {
        setInternalAccessGranted(true);
        toast.success('Akses dibuka!');
      } else {
        setPasswordError('Password salah!');
      }
    } catch (err) {
      setPasswordError('Gagal koneksi');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredDocs = documents.filter(doc => {
    const mMenu = doc.menu === selectedMenu;
    const mCat = selectedCategory === 'All' || doc.category === selectedCategory;
    const mSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase());
    return mMenu && mCat && mSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <Toaster position="top-right" />
      
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-blue-900">Resource Hub Program MBG</h1>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Bank BTN Official</p>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setShowAdminLogin(true)} className="p-2 text-gray-300 hover:text-blue-600 transition-colors"><Settings size={20}/></button>
            <img src="/images/danantara.png" alt="Logo" className="h-8" />
            <img src="/images/BTN_2024.svg (1).png" alt="Logo" className="h-8" />
          </div>
        </div>
      </header>

      {isAdmin && (
        <div className="bg-yellow-400 text-blue-900 py-1.5 text-center text-[10px] font-black tracking-widest">
          ADMIN MODE — <button onClick={() => setShowAdminPanel(!showAdminPanel)} className="underline">PANEL KONTROL</button>
        </div>
      )}

      {isAdmin && showAdminPanel && (
        <div className="max-w-7xl mx-auto p-6 bg-white border-b shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold">Database Dokumen</h2>
            <button onClick={() => setShowDocForm(true)} className="bg-blue-600 text-white px-5 py-2 rounded-xl flex gap-2 items-center hover:bg-blue-700 font-bold text-sm shadow-lg shadow-blue-100">
              <Plus size={18} /> Tambah Data
            </button>
          </div>
          <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-2">
            {documents.map(doc => (
              <div key={doc.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex flex-col">
                  <span className="font-bold text-sm">{doc.title}</span>
                  <span className="text-[9px] text-gray-400 uppercase font-black">{doc.menu} • {doc.category}</span>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handleEditDocument(doc)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit2 size={16} /></button>
                  <button onClick={() => handleDeleteDocument(doc.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showDocForm && (
        <div className="fixed inset-0 bg-blue-900/40 backdrop-blur-sm flex items-start justify-center z-[60] p-4 overflow-y-auto">
          <div className="bg-white p-8 rounded-[2rem] max-w-2xl w-full my-8 shadow-2xl relative border">
            <div className="flex justify-between items-center mb-8 sticky top-0 bg-white/90 backdrop-blur-md py-2 border-b z-10">
              <h2 className="text-2xl font-black text-gray-800 tracking-tight">{editingDoc ? 'Update' : 'Upload'} Dokumen</h2>
              <button onClick={resetForm} className="p-2 hover:bg-gray-100 rounded-full"><X /></button>
            </div>
            
            <form onSubmit={handleSaveDocument} className="space-y-6 pb-6">
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nama Dokumen</label>
                  <input className="w-full p-3.5 bg-gray-50 border rounded-2xl outline-none focus:ring-2 focus:ring-blue-500" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Keterangan</label>
                  <textarea className="w-full p-3.5 bg-gray-50 border rounded-2xl outline-none focus:ring-2 focus:ring-blue-500" rows="2" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <select className="p-3.5 bg-gray-50 border rounded-2xl outline-none" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                  {categories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select className="p-3.5 bg-gray-50 border rounded-2xl outline-none" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                  <option value="pdf">PDF</option><option value="ppt">PPT</option><option value="excel">Excel</option>
                </select>
              </div>

              <select className="w-full p-3.5 bg-gray-50 border rounded-2xl outline-none font-bold text-blue-700" value={formData.menu} onChange={e => setFormData({...formData, menu: e.target.value})}>
                <option value="Internal">INTERNAL ACCESS</option><option value="Eksternal">PUBLIC ACCESS</option>
              </select>
              
              <div className="p-6 border-2 border-dashed border-blue-100 rounded-[2rem] bg-blue-50/30">
                 <span className="text-[10px] font-black text-blue-600 block mb-3 uppercase tracking-widest">Opsi A: Upload File (Max 40MB)</span>
                 <input type="file" className="text-xs w-full text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-blue-600 file:text-white" onChange={e => setDocumentFile(e.target.files[0])} />
                 
                 <div className="flex items-center gap-3 my-4"><div className="h-px bg-blue-100 flex-1"></div><span className="text-[9px] text-blue-300 font-black">ATAU</span><div className="h-px bg-blue-100 flex-1"></div></div>
                 
                 <span className="text-[10px] font-black text-blue-600 block mb-3 uppercase tracking-widest">Opsi B: Link Google Drive</span>
                 <input placeholder="https://drive.google.com/..." className="w-full p-3.5 bg-white border rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500" value={formData.download_url} onChange={e => setFormData({...formData, download_url: e.target.value})} />
              </div>

              <div className="p-5 border rounded-[2rem] bg-white">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Gambar Preview (Max 10MB)</label>
                <input type="file" accept="image/*" onChange={e => setThumbnailFile(e.target.files[0])} />
              </div>

              <button type="submit" disabled={uploadingFile} className="w-full bg-blue-700 text-white py-4 rounded-2xl font-black text-xs tracking-widest shadow-xl shadow-blue-100 active:scale-95">
                {uploadingFile ? 'MEMPROSES...' : 'PUBLIKASIKAN DOKUMEN'}
              </button>
            </form>
          </div>
        </div>
      )}

      {showAdminLogin && (
        <div className="fixed inset-0 bg-blue-950/80 backdrop-blur-md flex items-center justify-center z-[70] p-4">
          <div className="bg-white p-8 rounded-[2.5rem] w-full max-w-sm shadow-2xl">
            <h2 className="font-black text-xl text-center mb-6">System Access</h2>
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <input autoFocus type="password" placeholder="••••••••" className="w-full p-4 bg-gray-50 rounded-2xl text-center text-2xl tracking-[0.5em] outline-none border focus:ring-2 focus:ring-blue-500" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} />
              <button type="submit" className="w-full bg-blue-700 text-white py-4 rounded-2xl font-black tracking-widest text-xs">LOGIN</button>
              <button type="button" onClick={() => setShowAdminLogin(false)} className="w-full text-gray-400 text-[10px] font-bold uppercase py-2">Batal</button>
            </form>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto p-4 sm:p-10">
        <div className="flex bg-white p-2 rounded-2xl shadow-sm mb-10 border inline-flex">
          {menus.map(m => (
            <button key={m} onClick={() => { setSelectedMenu(m); if(m === 'Eksternal') setInternalAccessGranted(false); }} className={`px-10 py-3 rounded-xl font-black text-xs tracking-widest uppercase transition-all ${selectedMenu === m ? 'bg-blue-700 text-white shadow-lg' : 'text-gray-400'}`}>{m}</button>
          ))}
        </div>

        {selectedMenu === 'Internal' && !internalAccessGranted ? (
          <div className="max-w-md mx-auto bg-white p-12 rounded-[3rem] shadow-2xl border text-center mt-6">
            <h2 className="text-2xl font-black text-gray-800 mb-2">Restricted Area</h2>
            <p className="text-gray-400 mb-8 text-sm">Masukkan password akses internal.</p>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <input type="password" placeholder="Kode Akses" className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-center font-bold" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} />
              {passwordError && <p className="text-red-500 text-[10px] font-black tracking-widest">{passwordError}</p>}
              <button className="w-full bg-blue-700 text-white py-4 rounded-2xl font-black tracking-widest text-xs">BUKA AKSES</button>
            </form>
          </div>
        ) : (
          <>
            <div className="flex gap-2 mb-10 overflow-x-auto pb-4 no-scrollbar">
              {categories.map(c => (
                <button key={c} onClick={() => setSelectedCategory(c)} className={`px-8 py-2.5 rounded-full whitespace-nowrap font-black text-[10px] tracking-widest uppercase transition-all border ${selectedCategory === c ? 'bg-blue-700 text-white border-blue-700' : 'bg-white text-gray-400'}`}>{c}</button>
              ))}
            </div>

            {/* SEARCH BAR FIX - PENGGUNAAN FLEX DAN ALIGN ITEMS CENTER */}
            <div className="relative mb-12 flex items-center">
              <div className="absolute left-5 flex items-center pointer-events-none">
                <Search className="text-gray-300" size={24} />
              </div>
              <input 
                placeholder="Cari materi atau data operasional..." 
                className="w-full pl-14 pr-6 py-5 rounded-[1.5rem] border-none outline-none focus:ring-2 focus:ring-blue-600 bg-white shadow-xl shadow-gray-200/50 text-lg font-medium placeholder:text-gray-300" 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {filteredDocs.map(doc => (
                <div key={doc.id} className="group bg-white rounded-[2.5rem] shadow-sm border border-gray-50 overflow-hidden hover:shadow-2xl transition-all duration-500">
                  <div className="h-56 bg-gray-100 relative">
                    <img src={doc.thumbnail || 'https://via.placeholder.com/600x400'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="doc" />
                    <div className={`absolute top-5 right-5 p-3 rounded-2xl shadow-xl backdrop-blur-xl ${getFileColor(doc.type)}`}>{getFileIcon(doc.type)}</div>
                  </div>
                  <div className="p-8">
                    <div className="flex items-center gap-3 mb-4">
                       <span className="text-[9px] font-black uppercase tracking-widest text-blue-700 bg-blue-50 px-3 py-1 rounded-lg border border-blue-100">{doc.category}</span>
                    </div>
                    <h3 className="font-black text-xl text-gray-800 mb-2 line-clamp-1 group-hover:text-blue-700 transition-colors">{doc.title}</h3>
                    <p className="text-gray-400 text-sm mb-8 line-clamp-2 leading-relaxed">{doc.description}</p>
                    <button onClick={() => window.open(doc.download_url, '_blank')} className="w-full flex items-center justify-center gap-3 bg-gray-900 text-white py-4 rounded-[1.25rem] font-black text-[10px] tracking-widest uppercase hover:bg-blue-700 transition-all shadow-xl active:scale-95">
                      <Download size={18} /> Unduh Materi
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
      
      <footer className="text-center py-16 opacity-30">
         <p className="text-[9px] font-black tracking-[0.5em] uppercase text-gray-500">Official Hub — &copy; 2026 MBG Program — Bank BTN</p>
      </footer>
    </div>
  );
};

export default DocumentHub;