import React, { useState } from 'react';
import { ArrowLeftRight, Download, Upload, Copy, Check, AlertCircle } from 'lucide-react';
import { t } from '../i18n';
import { useLang } from '../App';

export default function UniversalConverter() {
  const { lang } = useLang();
  const [sourceFormat, setSourceFormat] = useState('json');
  const [targetFormat, setTargetFormat] = useState('csv');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);

  // File Upload Helper
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Auto-detect format from extension
    const ext = file.name.split('.').pop().toLowerCase();
    if (['json', 'csv', 'xml'].includes(ext)) {
      setSourceFormat(ext);
      // Auto-set logical target format
      if (ext === 'json') setTargetFormat('csv');
      else setTargetFormat('json');
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      setInput(evt.target.result);
      setOutput('');
      setError(null);
    };
    reader.readAsText(file);
  };

  // Convert CSV string to JSON Array
  const csvToJson = (csv) => {
    const lines = csv.trim().split('\n');
    if (lines.length < 2) return [];
    
    // Parse headers (handle potential commas in quotes)
    const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
    const result = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      // Simple quote-safe comma split
      const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(',');
      const obj = {};
      headers.forEach((header, index) => {
        let val = matches[index] || '';
        val = val.trim().replace(/^["']|["']$/g, '').replace(/""/g, '"');
        obj[header] = isNaN(Number(val)) || val === '' ? val : Number(val);
      });
      result.push(obj);
    }
    return result;
  };

  // Convert JSON Array to CSV string
  const jsonToCsv = (jsonObj) => {
    const arr = Array.isArray(jsonObj) ? jsonObj : [jsonObj];
    if (arr.length === 0) return '';
    const headers = Object.keys(arr[0]);
    const headerLine = headers.join(',');
    const rows = arr.map(row => {
      return headers.map(h => {
        let cell = row[h] === null || row[h] === undefined ? '' : String(row[h]);
        if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
          cell = `"${cell.replace(/"/g, '""')}"`;
        }
        return cell;
      }).join(',');
    });
    return [headerLine, ...rows].join('\n');
  };

  // Convert JSON Object to XML string
  const jsonToXml = (jsonObj) => {
    const parse = (obj, name = 'root') => {
      let xml = `<${name}>`;
      if (Array.isArray(obj)) {
        obj.forEach(item => {
          xml += parse(item, 'item');
        });
      } else if (typeof obj === 'object' && obj !== null) {
        Object.entries(obj).forEach(([key, val]) => {
          const cleanKey = key.replace(/[^a-zA-Z0-9_\-]/g, '_'); // sanitize tags
          xml += parse(val, cleanKey);
        });
      } else {
        xml += obj === null || obj === undefined ? '' : String(obj).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      }
      xml += `</${name}>`;
      return xml;
    };
    return '<?xml version="1.0" encoding="UTF-8"?>\n' + parse(jsonObj);
  };

  // Convert XML string to JSON Object (simple parse)
  const xmlToJson = (xmlStr) => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlStr, 'text/xml');
    
    // Check for parse error
    const parseError = xmlDoc.getElementsByTagName('parsererror');
    if (parseError.length > 0) {
      throw new Error('Geçersiz XML dosyası.');
    }

    const parseNode = (node) => {
      if (node.nodeType === 3) return node.nodeValue.trim(); // text node
      
      const children = node.childNodes;
      if (children.length === 0) return '';
      if (children.length === 1 && children[0].nodeType === 3) return children[0].nodeValue.trim();

      const obj = {};
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (child.nodeType !== 1) continue; // skip text/whitespace nodes
        
        const childVal = parseNode(child);
        const name = child.nodeName;

        if (obj[name]) {
          if (!Array.isArray(obj[name])) {
            obj[name] = [obj[name]];
          }
          obj[name].push(childVal);
        } else {
          obj[name] = childVal;
        }
      }
      return obj;
    };

    return parseNode(xmlDoc.documentElement);
  };

  // Main Conversion Handler
  const handleConvert = () => {
    setError(null);
    setOutput('');
    
    if (!input.trim()) return;

    try {
      let intermediateObj = null;

      // 1. Parse source format to JS object
      if (sourceFormat === 'json') {
        intermediateObj = JSON.parse(input);
      } else if (sourceFormat === 'csv') {
        intermediateObj = csvToJson(input);
      } else if (sourceFormat === 'xml') {
        intermediateObj = xmlToJson(input);
      }

      // 2. Generate target format
      let finalResult = '';
      if (targetFormat === 'json') {
        finalResult = JSON.stringify(intermediateObj, null, 2);
      } else if (targetFormat === 'csv') {
        finalResult = jsonToCsv(intermediateObj);
      } else if (targetFormat === 'xml') {
        finalResult = jsonToXml(intermediateObj);
      }

      setOutput(finalResult);
    } catch (err) {
      setError('Dönüştürme hatası: ' + err.message);
    }
  };

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!output) return;
    const extensions = { json: 'json', csv: 'csv', xml: 'xml' };
    const blob = new Blob([output], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `converted_data_${Date.now()}.${extensions[targetFormat]}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
          🔀
        </div>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Evrensel Dosya Dönüştürücü
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            JSON, CSV ve XML dosyalarını veya ham metinleri birbirine dönüştürün.
          </p>
        </div>
      </div>

      {/* Select Formats Panel */}
      <div className="chart-card" style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '14px', fontWeight: 600 }}>Kaynak Format:</span>
          <select value={sourceFormat} onChange={(e) => setSourceFormat(e.target.value)} className="select-filter" style={{ width: '110px' }}>
            <option value="json">JSON</option>
            <option value="csv">CSV</option>
            <option value="xml">XML</option>
          </select>
        </div>

        <ArrowLeftRight size={20} style={{ color: 'var(--text-muted)' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '14px', fontWeight: 600 }}>Hedef Format:</span>
          <select value={targetFormat} onChange={(e) => setTargetFormat(e.target.value)} className="select-filter" style={{ width: '110px' }}>
            <option value="json">JSON</option>
            <option value="csv">CSV</option>
            <option value="xml">XML</option>
          </select>
        </div>
        
        <label className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', margin: 0 }}>
          <Upload size={14} /> Dosya Yükle
          <input type="file" accept=".json,.csv,.xml" onChange={handleFileUpload} style={{ display: 'none' }} />
        </label>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Input Text Area */}
        <div className="chart-card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h3 style={{ fontSize: '14px', color: 'var(--text-primary)', textTransform: 'uppercase' }}>Giriş ({sourceFormat.toUpperCase()})</h3>
          <textarea
            value={input}
            onChange={(e) => { setInput(e.target.value); setError(null); }}
            style={{
              width: '100%', height: '260px', background: 'var(--bg-base)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', padding: '12px', fontSize: '13px',
              fontFamily: 'var(--mono)', outline: 'none', resize: 'vertical'
            }}
            placeholder={`${sourceFormat.toUpperCase()} formatındaki veriyi yapıştırın...`}
          />
        </div>

        {/* Output Text Area */}
        <div className="chart-card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '14px', color: 'var(--text-primary)', textTransform: 'uppercase' }}>Çıkış ({targetFormat.toUpperCase()})</h3>
            {output && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '4px' }} onClick={handleCopy}>
                  {copied ? <Check size={12} style={{ color: 'var(--accent2)' }} /> : <Copy size={12} />}
                  {copied ? 'Kopyalandı' : 'Kopyala'}
                </button>
                <button className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '4px' }} onClick={handleDownload}>
                  <Download size={12} /> İndir
                </button>
              </div>
            )}
          </div>
          <textarea
            readOnly
            value={output}
            style={{
              width: '100%', height: '260px', background: 'var(--bg-base)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', padding: '12px', fontSize: '13px',
              fontFamily: 'var(--mono)', outline: 'none', resize: 'vertical'
            }}
            placeholder="Dönüştürülen veri burada görüntülenecektir..."
          />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <button 
          className="btn btn-primary" 
          onClick={handleConvert}
          disabled={!input.trim() || sourceFormat === targetFormat}
          style={{ padding: '10px 28px', fontSize: '14px' }}
        >
          Dönüştür
        </button>
      </div>

      {error && (
        <div className="error-state" style={{ padding: '12px 16px', background: 'rgba(255, 107, 107, 0.1)', borderRadius: 'var(--radius-md)', color: 'var(--accent3)', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}
    </div>
  );
}
