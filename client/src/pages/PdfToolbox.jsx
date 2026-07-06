import React, { useState, useEffect } from 'react';
import { FileText, FilePlus, Download, ArrowUp, ArrowDown, Trash2, AlertCircle, Loader, RefreshCw, Layers, Sliders } from 'lucide-react';
import { t } from '../i18n';
import { useLang } from '../App';

export default function PdfToolbox() {
  const { lang } = useLang();
  
  // Library load state
  const [libLoaded, setLibLoaded] = useState(false);
  const [libError, setLibError] = useState(false);
  
  // Active Tab: 'merge' or 'extract'
  const [activeTab, setActiveTab] = useState('merge');
  
  // Merge state
  const [mergeFiles, setMergeFiles] = useState([]);
  const [merging, setMerging] = useState(false);
  const [mergeResult, setMergeResult] = useState(null); // Blob URL
  
  // Extract state
  const [extractFile, setExtractFile] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [selectedPages, setSelectedPages] = useState([]); // 0-indexed indices
  const [rangeInput, setRangeInput] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [extractResult, setExtractResult] = useState(null); // Blob URL
  
  // Load pdf-lib CDN
  useEffect(() => {
    if (window.PDFLib) {
      setLibLoaded(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js';
    script.async = true;
    script.onload = () => setLibLoaded(true);
    script.onerror = () => setLibError(true);
    document.body.appendChild(script);
  }, []);

  // Update page range input based on selected checkboxes
  const handlePageCheckboxChange = (index, checked) => {
    let newSelected = [...selectedPages];
    if (checked) {
      if (!newSelected.includes(index)) {
        newSelected.push(index);
      }
    } else {
      newSelected = newSelected.filter(i => i !== index);
    }
    newSelected.sort((a, b) => a - b);
    setSelectedPages(newSelected);
    
    // Generate range string (e.g. "1-3, 5")
    if (newSelected.length === 0) {
      setRangeInput('');
      return;
    }
    
    const ranges = [];
    let start = newSelected[0];
    let prev = start;
    
    for (let i = 1; i <= newSelected.length; i++) {
      const current = newSelected[i];
      if (current === prev + 1) {
        prev = current;
      } else {
        if (start === prev) {
          ranges.push(`${start + 1}`);
        } else {
          ranges.push(`${start + 1}-${prev + 1}`);
        }
        start = current;
        prev = current;
      }
    }
    setRangeInput(ranges.join(', '));
  };

  // Update selected checkboxes based on range input
  const handleRangeInputChange = (val) => {
    setRangeInput(val);
    if (!extractFile || pageCount === 0) return;
    
    if (!val.trim()) {
      setSelectedPages([]);
      return;
    }
    
    const pages = new Set();
    const parts = val.split(',');
    for (let part of parts) {
      part = part.trim();
      if (!part) continue;
      if (part.includes('-')) {
        const [startStr, endStr] = part.split('-');
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);
        if (!isNaN(start) && !isNaN(end)) {
          const from = Math.min(start, end);
          const to = Math.max(start, end);
          for (let i = from; i <= to; i++) {
            if (i >= 1 && i <= pageCount) {
              pages.add(i - 1);
            }
          }
        }
      } else {
        const pageNum = parseInt(part, 10);
        if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= pageCount) {
          pages.add(pageNum - 1);
        }
      }
    }
    setSelectedPages(Array.from(pages).sort((a, b) => a - b));
  };

  // Add files for merging
  const handleMergeFilesAdded = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    
    const loadedFiles = [];
    for (const file of files) {
      if (file.type !== 'application/pdf') continue;
      
      let pages = 0;
      if (window.PDFLib) {
        try {
          const fileBytes = await file.arrayBuffer();
          const pdfDoc = await window.PDFLib.PDFDocument.load(fileBytes);
          pages = pdfDoc.getPageCount();
        } catch (err) {
          console.error('Error reading PDF pages:', err);
        }
      }
      
      loadedFiles.push({
        id: Math.random().toString(36).substr(2, 9),
        file,
        name: file.name,
        size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
        pages
      });
    }
    
    setMergeFiles(prev => [...prev, ...loadedFiles]);
    // reset result
    if (mergeResult) {
      URL.revokeObjectURL(mergeResult);
      setMergeResult(null);
    }
  };

  // Remove file from merge list
  const removeMergeFile = (id) => {
    setMergeFiles(prev => prev.filter(f => f.id !== id));
    if (mergeResult) {
      URL.revokeObjectURL(mergeResult);
      setMergeResult(null);
    }
  };

  // Reorder files in merge list
  const moveMergeFile = (index, direction) => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === mergeFiles.length - 1) return;
    
    const newFiles = [...mergeFiles];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const temp = newFiles[index];
    newFiles[index] = newFiles[targetIndex];
    newFiles[targetIndex] = temp;
    
    setMergeFiles(newFiles);
    if (mergeResult) {
      URL.revokeObjectURL(mergeResult);
      setMergeResult(null);
    }
  };

  // Execute PDF Merge
  const executeMerge = async () => {
    if (!mergeFiles.length || !window.PDFLib) return;
    
    setMerging(true);
    try {
      const { PDFDocument } = window.PDFLib;
      const mergedPdf = await PDFDocument.create();
      
      for (const item of mergeFiles) {
        const fileBytes = await item.file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(fileBytes);
        const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }
      
      const mergedPdfBytes = await mergedPdf.save();
      const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setMergeResult(url);
    } catch (err) {
      console.error('PDF Merge Error:', err);
      alert('PDF birleştirilirken bir hata oluştu.');
    } finally {
      setMerging(false);
    }
  };

  // Load single PDF for extraction
  const handleExtractFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file || file.type !== 'application/pdf') return;
    
    setExtractFile(file);
    setPageCount(0);
    setSelectedPages([]);
    setRangeInput('');
    if (extractResult) {
      URL.revokeObjectURL(extractResult);
      setExtractResult(null);
    }
    
    if (window.PDFLib) {
      try {
        const fileBytes = await file.arrayBuffer();
        const pdfDoc = await window.PDFLib.PDFDocument.load(fileBytes);
        setPageCount(pdfDoc.getPageCount());
      } catch (err) {
        console.error('Error reading PDF pages:', err);
        alert('PDF dosyası okunurken hata oluştu.');
      }
    }
  };

  // Execute PDF Extraction
  const executeExtraction = async () => {
    if (!extractFile || !selectedPages.length || !window.PDFLib) return;
    
    setExtracting(true);
    try {
      const { PDFDocument } = window.PDFLib;
      const fileBytes = await extractFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(fileBytes);
      const newPdf = await PDFDocument.create();
      
      const copiedPages = await newPdf.copyPages(pdfDoc, selectedPages);
      copiedPages.forEach((page) => newPdf.addPage(page));
      
      const newPdfBytes = await newPdf.save();
      const blob = new Blob([newPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setExtractResult(url);
    } catch (err) {
      console.error('PDF Extraction Error:', err);
      alert('PDF sayfaları ayıklanırken bir hata oluştu.');
    } finally {
      setExtracting(false);
    }
  };

  // Clean URLs on unmount
  useEffect(() => {
    return () => {
      if (mergeResult) URL.revokeObjectURL(mergeResult);
      if (extractResult) URL.revokeObjectURL(extractResult);
    };
  }, [mergeResult, extractResult]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'flex-start' }}>
        <div className="sidebar-logo-icon" style={{ 
          width: '36px', 
          height: '36px', 
          background: 'linear-gradient(135deg, var(--accent), var(--accent2))', 
          borderRadius: 'var(--radius-md)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          fontSize: '18px' 
        }}>
          📄
        </div>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)' }}>
            PDF Araç Kutusu (PDF Toolbox)
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Dosyaları birleştirin veya sayfa bazlı yeni PDF'ler oluşturun. Tüm işlemler tamamen tarayıcınızda, güvenle yapılır.
          </p>
        </div>
      </div>

      {/* Library loading overlay */}
      {!libLoaded && !libError && (
        <div className="chart-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '200px', gap: '12px' }}>
          <RefreshCw className="animate-spin text-muted" size={32} style={{ animation: 'spin 2s linear infinite' }} />
          <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>PDF kitaplığı yükleniyor (pdf-lib)...</span>
        </div>
      )}

      {libError && (
        <div className="chart-card" style={{ display: 'flex', alignItems: 'center', gap: '12px', borderColor: 'var(--danger-glow)', background: 'rgba(239, 68, 68, 0.05)' }}>
          <AlertCircle size={20} style={{ color: 'var(--danger)' }} />
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Kitaplık Yükleme Hatası</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>CDN bağlantısı kurulamadı. İnternet bağlantınızı kontrol edin.</div>
          </div>
        </div>
      )}

      {libLoaded && (
        <>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
            <button 
              className={`btn ${activeTab === 'merge' ? 'btn-primary' : 'btn-ghost'}`} 
              onClick={() => setActiveTab('merge')}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Layers size={16} /> PDF Birleştir (Merge)
            </button>
            <button 
              className={`btn ${activeTab === 'extract' ? 'btn-primary' : 'btn-ghost'}`} 
              onClick={() => setActiveTab('extract')}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Sliders size={16} /> Sayfa Ayıkla (Extract)
            </button>
          </div>

          {/* TAB 1: PDF MERGE */}
          {activeTab === 'merge' && (
            <div className="tool-panel-grid">
              
              {/* Left Area: Files List & Operations */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="chart-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h3 style={{ fontSize: '14px', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dosya Listesi</h3>
                  
                  {mergeFiles.length === 0 ? (
                    <label htmlFor="merge-files-upload" className="tool-upload-zone">
                      <FilePlus size={36} className="text-muted" />
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '14px' }}>Birleştirilecek PDF Dosyalarını Seçin</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>Çoklu seçim yapabilirsiniz. İsterseniz buraya sürükleyip bırakabilirsiniz.</div>
                      </div>
                      <input 
                        type="file" 
                        multiple 
                        accept="application/pdf" 
                        onChange={handleMergeFilesAdded} 
                        style={{ display: 'none' }} 
                        id="merge-files-upload"
                      />
                      <div className="btn btn-ghost" style={{ marginTop: '4px' }}>Dosya Seç</div>
                    </label>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {mergeFiles.map((item, index) => (
                        <div key={item.id} style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between',
                          background: 'var(--bg-base)', 
                          border: '1px solid var(--border)', 
                          borderRadius: 'var(--radius-md)', 
                          padding: '10px 14px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <FileText size={20} style={{ color: 'var(--accent)' }} />
                            <div>
                              <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {item.name}
                              </div>
                              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                {item.size} • {item.pages} Sayfa
                              </div>
                            </div>
                          </div>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <button 
                              className="btn btn-ghost btn-sm" 
                              onClick={() => moveMergeFile(index, 'up')}
                              disabled={index === 0}
                              style={{ padding: '4px' }}
                            >
                              <ArrowUp size={14} />
                            </button>
                            <button 
                              className="btn btn-ghost btn-sm" 
                              onClick={() => moveMergeFile(index, 'down')}
                              disabled={index === mergeFiles.length - 1}
                              style={{ padding: '4px' }}
                            >
                              <ArrowDown size={14} />
                            </button>
                            <button 
                              className="btn btn-ghost btn-sm" 
                              onClick={() => removeMergeFile(item.id)}
                              style={{ padding: '4px', color: 'var(--danger)' }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* Add more files row */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                        <input 
                          type="file" 
                          multiple 
                          accept="application/pdf" 
                          onChange={handleMergeFilesAdded} 
                          style={{ display: 'none' }} 
                          id="merge-files-add-more"
                        />
                        <label htmlFor="merge-files-add-more" className="btn btn-ghost btn-sm" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <FilePlus size={12} /> Daha Fazla Ekle
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Area: Actions / Summary */}
              <div className="chart-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ fontSize: '14px', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Birleştirme Paneli</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Toplam Belge:</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{mergeFiles.length}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Toplam Sayfa:</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {mergeFiles.reduce((acc, curr) => acc + curr.pages, 0)}
                    </span>
                  </div>
                </div>

                <button 
                  className="btn btn-primary"
                  onClick={executeMerge}
                  disabled={mergeFiles.length < 2 || merging}
                  style={{ width: '100%', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  {merging ? (
                    <>
                      <Loader className="animate-spin" size={16} /> Birleştiriliyor...
                    </>
                  ) : 'PDF Dosyalarını Birleştir'}
                </button>

                {mergeResult && (
                  <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent2)', fontSize: '12px', fontWeight: 500 }}>
                      ✓ Birleştirme tamamlandı!
                    </div>
                    <a 
                      href={mergeResult} 
                      download={`aatools_merged_${Date.now()}.pdf`}
                      className="btn btn-ghost"
                      style={{ width: '100%', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'var(--accent-glow)', color: 'var(--accent)' }}
                    >
                      <Download size={16} /> Birleştirilmiş PDF'i İndir
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: PDF EXTRACT PAGES */}
          {activeTab === 'extract' && (
            <div className="tool-panel-grid">
              
              {/* Left Area: Upload & Page Selector */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="chart-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h3 style={{ fontSize: '14px', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Kaynak Belge</h3>
                  
                  {!extractFile ? (
                    <label htmlFor="extract-file-upload" className="tool-upload-zone">
                      <FilePlus size={36} className="text-muted" />
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '14px' }}>Sayfaları Ayıklanacak PDF Dosyasını Seçin</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>Tek bir PDF belgesi yükleyin veya sürükleyip bırakın.</div>
                      </div>
                      <input 
                        type="file" 
                        accept="application/pdf" 
                        onChange={handleExtractFileChange} 
                        style={{ display: 'none' }} 
                        id="extract-file-upload"
                      />
                      <div className="btn btn-ghost" style={{ marginTop: '4px' }}>Dosya Seç</div>
                    </label>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        background: 'var(--bg-base)', 
                        border: '1px solid var(--border)', 
                        borderRadius: 'var(--radius-md)', 
                        padding: '12px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <FileText size={24} style={{ color: 'var(--accent)' }} />
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {extractFile.name}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                              {(extractFile.size / 1024 / 1024).toFixed(2)} MB • {pageCount} Sayfa
                            </div>
                          </div>
                        </div>
                        <button 
                          className="btn btn-ghost btn-sm" 
                          onClick={() => {
                            setExtractFile(null);
                            setPageCount(0);
                            setSelectedPages([]);
                            setRangeInput('');
                            if (extractResult) {
                              URL.revokeObjectURL(extractResult);
                              setExtractResult(null);
                            }
                          }}
                          style={{ padding: '6px', color: 'var(--danger)' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      {/* Interactive Page Checklist */}
                      {pageCount > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h4 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                              Sayfa Seçimi
                            </h4>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button 
                                className="btn btn-ghost btn-sm" 
                                style={{ fontSize: '11px', padding: '2px 8px' }}
                                onClick={() => {
                                  const all = Array.from({ length: pageCount }, (_, i) => i);
                                  setSelectedPages(all);
                                  setRangeInput(`1-${pageCount}`);
                                }}
                              >
                                Tümünü Seç
                              </button>
                              <button 
                                className="btn btn-ghost btn-sm" 
                                style={{ fontSize: '11px', padding: '2px 8px' }}
                                onClick={() => {
                                  setSelectedPages([]);
                                  setRangeInput('');
                                }}
                              >
                                Temizle
                              </button>
                            </div>
                          </div>

                          <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', 
                            gap: '8px', 
                            maxHeight: '260px', 
                            overflowY: 'auto',
                            padding: '4px',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-md)',
                            background: 'rgba(0, 0, 0, 0.1)'
                          }}>
                            {Array.from({ length: pageCount }).map((_, i) => {
                              const isChecked = selectedPages.includes(i);
                              return (
                                <label 
                                  key={i} 
                                  style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center', 
                                    gap: '6px', 
                                    padding: '8px 4px', 
                                    borderRadius: 'var(--radius-sm)', 
                                    background: isChecked ? 'var(--accent-glow)' : 'var(--bg-base)', 
                                    border: isChecked ? '1px solid var(--accent)' : '1px solid var(--border)', 
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    fontWeight: isChecked ? 600 : 400,
                                    color: isChecked ? 'var(--accent)' : 'var(--text-primary)',
                                    userSelect: 'none'
                                  }}
                                >
                                  <input 
                                    type="checkbox" 
                                    checked={isChecked} 
                                    onChange={(e) => handlePageCheckboxChange(i, e.target.checked)}
                                    style={{ display: 'none' }}
                                  />
                                  {i + 1}
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Area: Range Input & Action */}
              <div className="chart-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ fontSize: '14px', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ayıklama Paneli</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Sayfa Aralıkları:</label>
                  <input 
                    type="text"
                    value={rangeInput}
                    onChange={(e) => handleRangeInputChange(e.target.value)}
                    className="select-filter"
                    placeholder="Örnek: 1-3, 5, 8-10"
                    disabled={!extractFile}
                    style={{ width: '100%', height: '36px', padding: '0 10px', fontSize: '13px' }}
                  />
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    Virgülle ayırarak tekil veya tire (-) ile aralık girebilirsiniz.
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px', borderTop: '1px solid var(--border)', paddingTop: '12px', marginTop: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Seçilen Sayfa:</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedPages.length} / {pageCount}</span>
                  </div>
                </div>

                <button 
                  className="btn btn-primary"
                  onClick={executeExtraction}
                  disabled={!extractFile || selectedPages.length === 0 || extracting}
                  style={{ width: '100%', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  {extracting ? (
                    <>
                      <Loader className="animate-spin" size={16} /> Ayıklanıyor...
                    </>
                  ) : 'Sayfaları Ayıkla'}
                </button>

                {extractResult && (
                  <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent2)', fontSize: '12px', fontWeight: 500 }}>
                      ✓ Ayıklama tamamlandı!
                    </div>
                    <a 
                      href={extractResult} 
                      download={`aatools_extracted_${Date.now()}.pdf`}
                      className="btn btn-ghost"
                      style={{ width: '100%', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'var(--accent-glow)', color: 'var(--accent)' }}
                    >
                      <Download size={16} /> Yeni PDF'i İndir
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
