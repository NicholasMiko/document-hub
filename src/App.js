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
      case 'ppt': return <Presentation size={20} />;
      case 'excel': return <FileSpreadsheet size={20} />;
      default: return <FileText size={20} />;
    }
  };

  const getFileColor = (type) => {
    switch(type) {
      case 'ppt': return 'bg-orange-50 text-orange-600';
      case 'excel': return 'bg-green-50 text-green-600';
      default: return 'bg-red-50 text-red-600';
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

    const MAX_IMG_SIZE = 10 * 1024 * 1024;
    const MAX_DOC_SIZE = 40 * 1024 * 1024;

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
      toast.success('Berhasil disimpan!');
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
    <div className="min-h-screen bg-white text-slate-900" style={{ fontFamily: '"Inter", "Segoe UI", Tahoma, sans-serif' }}>
      <Toaster position="top-right" />
      
      {/* HEADER: GAP DIKECILIN */}
      <header className="bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-blue-900 leading-tight">
              Resource and Archive Access for MBG Program
            </h1>
            <p className="text-sm font-semibold text-slate-400 tracking-wide uppercase">
              Bank BTN
            </p>
          </div>
          <div className="flex items-center gap-5">
            <button onClick={() => setShowAdminLogin(true)} className="p-2 text-slate-300 hover:text-blue-600 transition-all">
              <Settings size={24}/>
            </button>
            <img src="/images/bgn.png" alt="BGN" className="h-10 w-auto object-contain" />
            <img src="/images/danantara.png" alt="Danantara" className="h-10 w-auto object-contain" />
            <img src="/images/BTN_2024.svg (1).png" alt="BTN" className="h-10 w-auto object-contain" />
          </div>
        </div>
      </header>

      {isAdmin && (
        <div className="bg-amber-400 text-amber-900 py-2 text-center text-xs font-bold uppercase tracking-wider">
          ADMIN MODE — <button onClick={() => setShowAdminPanel(!showAdminPanel)} className="underline hover:text-black">Panel Kontrol</button>
        </div>
      )}

      {/* ADMIN PANEL */}
      {isAdmin && showAdminPanel && (
        <div className="max-w-7xl mx-auto p-6 bg-slate-50 border-b">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">Database Dokumen</h2>
            <button onClick={() => setShowDocForm(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 font-bold transition-all shadow-md">
              <Plus size={18} /> Tambah Data
            </button>
          </div>
          <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-2">
            {documents.map(doc => (
              <div key={doc.id} className="flex justify-between items-center p-3 bg-white rounded-lg border border-slate-200">
                <div className="flex flex-col">
                  <span className="font-bold text-sm text-slate-700">{doc.title}</span>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">{doc.menu} • {doc.category}</span>
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

      {/* MODAL FORM */}
      {showDocForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-start justify-center z-[60] p-4 overflow-y-auto">
          <div className="bg-white p-8 rounded-2xl max-w-2xl w-full my-8 shadow-2xl relative border border-slate-200">
            <div className="flex justify-between items-center mb-6 sticky top-0 bg-white/95 py-2 border-b z-10">
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">{editingDoc ? 'Update' : 'Upload'} Dokumen</h2>
              <button onClick={resetForm} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X /></button>
            </div>
            <form onSubmit={handleSaveDocument} className="space-y-5 pb-4">
              <input placeholder="Nama Dokumen" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-600" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
              <textarea placeholder="Keterangan Dokumen" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-600" rows="2" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                <select className="p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                  {categories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select className="p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                  <option value="pdf">PDF</option><option value="ppt">PPT</option><option value="excel">Excel</option>
                </select>
              </div>
              <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-blue-700" value={formData.menu} onChange={e => setFormData({...formData, menu: e.target.value})}>
                <option value="Internal">INTERNAL ACCESS</option><option value="Eksternal">PUBLIC ACCESS</option>
              </select>
              <div className="p-5 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                 <span className="text-[11px] font-bold text-slate-500 block mb-3 uppercase tracking-wider">Opsi A: Upload File (Max 40MB)</span>
                 <input type="file" className="text-sm w-full file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-slate-700 file:text-white hover:file:bg-black transition-all" onChange={e => setDocumentFile(e.target.files[0])} />
                 <div className="flex items-center gap-3 my-4"><div className="h-px bg-slate-200 flex-1"></div><span className="text-[10px] text-slate-400 font-bold">ATAU</span><div className="h-px bg-slate-200 flex-1"></div></div>
                 <span className="text-[11px] font-bold text-slate-500 block mb-3 uppercase tracking-wider">Opsi B: Link Google Drive</span>
                 <input placeholder="https://drive.google.com/..." className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm" value={formData.download_url} onChange={e => setFormData({...formData, download_url: e.target.value})} />
              </div>
              <button type="submit" disabled={uploadingFile} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold tracking-wide shadow-lg hover:bg-blue-700 active:scale-[0.98] transition-all">
                {uploadingFile ? 'MEMPROSES...' : 'PUBLIKASIKAN SEKARANG'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        
        {/* MENU & FILTER: GAP DIKECILIN */}
        <div className="flex flex-wrap items-center gap-4 mb-5 border-b border-slate-100 pb-5">
          {/* MENU INTERNAL/EKSTERNAL */}
          <div className="flex bg-slate-100 p-1.5 rounded-2xl">
            {menus.map(m => (
              <button 
                key={m} 
                onClick={() => { setSelectedMenu(m); if(m === 'Eksternal') setInternalAccessGranted(false); }} 
                className={`px-8 py-2.5 rounded-xl font-bold text-xs tracking-wider uppercase transition-all duration-200 ${
                  selectedMenu === m 
                  ? (m === 'Internal' ? 'bg-red-600 text-white shadow-md scale-[1.02]' : 'bg-blue-700 text-white shadow-md scale-[1.02]')
                  : (m === 'Internal' ? 'text-slate-500 hover:text-red-600 hover:bg-white' : 'text-slate-500 hover:text-blue-700 hover:bg-white')
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <div className="hidden md:block h-8 w-px bg-slate-200 mx-1"></div>

          {/* KATEGORI FILTERS */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
            {categories.map(c => (
              <button 
                key={c} 
                onClick={() => setSelectedCategory(c)} 
                className={`px-7 py-2.5 rounded-xl whitespace-nowrap font-bold text-[11px] tracking-wider uppercase transition-all duration-200 border-2 ${
                  selectedCategory === c 
                  ? 'bg-slate-800 text-white border-slate-800 shadow-md scale-[1.02]' 
                  : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300 hover:text-slate-700'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {selectedMenu === 'Internal' && !internalAccessGranted ? (
          <div className="max-w-md mx-auto bg-white p-10 rounded-3xl shadow-xl border border-slate-100 text-center mt-4">
            <h2 className="text-2xl font-bold text-slate-800 mb-2 tracking-tight">Restricted Area</h2>
            <p className="text-slate-400 mb-8 text-sm">Akses khusus karyawan Internal Bank BTN.</p>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <input type="password" placeholder="Kode Akses" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center font-bold" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} />
              {passwordError && <p className="text-red-600 text-xs font-bold uppercase">{passwordError}</p>}
              <button className="w-full bg-red-600 text-white py-4 rounded-2xl font-bold shadow-lg hover:bg-red-700 transition-all">BUKA AKSES</button>
            </form>
          </div>
        ) : (
          <>
            {/* SEARCH BAR: GAP ANTAR INTERAKSI DIRAPATKAN */}
 <div className="relative mb-8 flex items-center">
  {/* Ikon Kaca Pembesar - Ukurannya juga ditambah (size={28}) */}
  <div className="absolute left-6 flex items-center pointer-events-none">
    <Search className="text-slate-300" size={28} />
  </div>
  
  <input 
    placeholder="Cari materi atau data operasional..." 
    className="w-full pl-16 pr-8 py-6 rounded-[2rem] border border-slate-200 outline-none focus:ring-2 focus:ring-blue-600 bg-white shadow-2xl shadow-slate-200/50 text-2xl font-semibold placeholder:text-slate-300 transition-all" 
    value={searchTerm} 
    onChange={e => setSearchTerm(e.target.value)} 
  />
</div>
            {/* DOCUMENT GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredDocs.map(doc => (
                <div key={doc.id} className="group bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-2xl transition-all duration-300">
                  <div className="h-52 bg-slate-100 relative overflow-hidden">
                    <img src={doc.thumbnail || 'https://via.placeholder.com/600x400'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="doc" />
                    <div className={`absolute top-4 right-4 p-2.5 rounded-xl shadow-lg backdrop-blur-md border border-white/20 ${getFileColor(doc.type)}`}>
                      {getFileIcon(doc.type)}
                    </div>
                  </div>
                  <div className="p-7">
                    <div className="flex items-center gap-2 mb-3">
                       <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-3 py-1 rounded-lg border border-blue-100">{doc.category}</span>
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{doc.type}</span>
                    </div>
                    <h3 className="font-bold text-xl text-slate-800 mb-2 line-clamp-1 group-hover:text-blue-700 transition-colors tracking-tight">{doc.title}</h3>
                    <p className="text-slate-500 text-sm mb-6 line-clamp-2 leading-relaxed">{doc.description}</p>
                    <button onClick={() => window.open(doc.download_url, '_blank')} className="w-full flex items-center justify-center gap-3 bg-slate-800 text-white py-4 rounded-2xl font-bold text-xs tracking-widest uppercase hover:bg-blue-700 transition-all shadow-lg active:scale-95">
                      <Download size={18} /> Unduh Materi
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
      
      <footer className="text-center py-12 border-t border-slate-50 mt-10">
         <p className="text-[10px] font-bold tracking-[0.4em] uppercase text-slate-300">&copy; 2026 MBG Program — pt. bank tabungan negara (persero) tbk</p>
      </footer>
    </div>
  );
};

export default DocumentHub;