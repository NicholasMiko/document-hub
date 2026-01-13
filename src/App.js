import React, { useState } from 'react';
import { Download, FileText, FileSpreadsheet, Presentation, Filter, Search } from 'lucide-react';

const DocumentHub = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Sample documents - ganti dengan data asli
  const [documents] = useState([
    {
      id: 1,
      title: 'Panduan Lengkap Marketing Digital',
      description: 'Strategi dan tips untuk memaksimalkan marketing digital',
      category: 'Tutorial',
      type: 'ppt',
      thumbnail: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=250&fit=crop',
      downloadUrl: '#'
    },
    {
      id: 2,
      title: 'Data Penjualan Q4 2025',
      description: 'Laporan dan analisis penjualan kuartal 4',
      category: 'Data',
      type: 'excel',
      thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=250&fit=crop',
      downloadUrl: '#'
    },
    {
      id: 3,
      title: 'Memo Kebijakan Baru',
      description: 'Kebijakan perusahaan terbaru untuk 2026',
      category: 'Memo',
      type: 'pdf',
      thumbnail: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400&h=250&fit=crop',
      downloadUrl: '#'
    },
    {
      id: 4,
      title: 'Infografis Tren Industri',
      description: 'Visualisasi tren industri tahun ini',
      category: 'Infografis',
      type: 'pdf',
      thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=250&fit=crop',
      downloadUrl: '#'
    },
    {
      id: 5,
      title: 'Tutorial Excel Advanced',
      description: 'Fungsi-fungsi advanced untuk produktivitas',
      category: 'Tutorial',
      type: 'ppt',
      thumbnail: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=400&h=250&fit=crop',
      downloadUrl: '#'
    },
    {
      id: 6,
      title: 'Budget Planning 2026',
      description: 'Template dan panduan perencanaan budget',
      category: 'Data',
      type: 'excel',
      thumbnail: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=250&fit=crop',
      downloadUrl: '#'
    }
  ]);

  const categories = ['All', 'Tutorial', 'Data', 'Memo', 'Infografis'];

  const getFileIcon = (type) => {
    switch(type) {
      case 'ppt':
        return <Presentation className="w-5 h-5" />;
      case 'excel':
        return <FileSpreadsheet className="w-5 h-5" />;
      case 'pdf':
        return <FileText className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const getFileColor = (type) => {
    switch(type) {
      case 'ppt':
        return 'bg-orange-100 text-orange-600';
      case 'excel':
        return 'bg-green-100 text-green-600';
      case 'pdf':
        return 'bg-red-100 text-red-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || doc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Document Hub</h1>
          <p className="mt-2 text-gray-600">Infografis, Panduan, dan Informasi Penting</p>
        </div>
      </header>

      {/* Search & Filter Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          {/* Search */}
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

          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
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
        </div>

        {/* Document Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocuments.map(doc => (
            <div key={doc.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-200">
              {/* Thumbnail */}
              <div className="relative h-48 bg-gray-200 overflow-hidden">
                <img 
                  src={doc.thumbnail} 
                  alt={doc.title}
                  className="w-full h-full object-cover"
                />
                <div className={`absolute top-3 right-3 p-2 rounded-lg ${getFileColor(doc.type)}`}>
                  {getFileIcon(doc.type)}
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded">
                    {doc.category}
                  </span>
                  <span className="text-xs text-gray-500 uppercase">
                    {doc.type}
                  </span>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {doc.title}
                </h3>
                
                <p className="text-gray-600 text-sm mb-4">
                  {doc.description}
                </p>

                {/* Download Button */}
                <button
                  onClick={() => window.open(doc.downloadUrl, '_blank')}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredDocuments.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Tidak ada dokumen ditemukan
            </h3>
            <p className="text-gray-600">
              Coba ubah kata kunci pencarian atau filter kategori
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentHub;