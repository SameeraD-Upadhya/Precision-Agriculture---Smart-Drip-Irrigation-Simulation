// src/components/modals/ExportModal.jsx
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, FileJson, Image, FileText, Upload } from 'lucide-react';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import useNetworkStore from '../../stores/networkStore.js';
import useUIStore      from '../../stores/uiStore.js';

export default function ExportModal({ canvasRef }) {
  const { exportModalOpen: open, setExportModalOpen, addLog } = useUIStore();
  const { nodes, edges, loadSnapshot, projectName }           = useNetworkStore();

  const [pngLoading, setPngLoading] = useState(false);
  const importRef = useRef(null);

  const dateStr = new Date().toISOString().slice(0, 10);
  const safeName = (projectName || 'project').replace(/\s+/g, '-');

  // ── JSON Export ──────────────────────────────────────────
  const exportJSON = async () => {
    const data    = { name: projectName, exportedAt: new Date().toISOString(), nodes, edges };
    const json    = JSON.stringify(data, null, 2);
    const fname   = `agroflow-${safeName}-${dateStr}.json`;

    // Use File System Access API when available (Chromium) so the user can
    // navigate to backend/exports/ — the browser remembers the chosen folder.
    if (window.showSaveFilePicker) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: fname,
          types: [{ description: 'AgroFlow JSON', accept: { 'application/json': ['.json'] } }],
        });
        const writable = await handle.createWritable();
        await writable.write(json);
        await writable.close();
        addLog('JSON export saved.', 'success');
        return;
      } catch (err) {
        if (err.name === 'AbortError') return; // user cancelled — silent
        // fall through to anchor fallback
      }
    }

    // Fallback for Firefox / Safari
    const blob = new Blob([json], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = fname;
    a.click(); URL.revokeObjectURL(url);
    addLog('JSON export completed.', 'success');
  };

  // ── PNG Export ───────────────────────────────────────────
  const exportPNG = async () => {
    const el = document.getElementById('main-canvas-area');
    if (!el) { addLog('Canvas element not found for PNG export.', 'error'); return; }
    setPngLoading(true);
    try {
      const blob = await toPng(el, { quality: 1, pixelRatio: 2, backgroundColor: '#020202' });
      const a = document.createElement('a');
      a.href = blob; a.download = `agroflow-${safeName}.png`;
      a.click();
      addLog('PNG screenshot exported.', 'success');
    } catch (err) {
      addLog(`PNG export failed: ${err.message}`, 'error');
    } finally { setPngLoading(false); }
  };

  // ── PDF Export ───────────────────────────────────────────
  const exportPDF = () => {
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

    // Title page
    doc.setFillColor(2, 2, 2);
    doc.rect(0, 0, 210, 297, 'F');
    doc.setTextColor(34, 211, 238);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('AgroFlow Pro', 105, 30, { align: 'center' });
    doc.setFontSize(12);
    doc.setTextColor(180, 180, 180);
    doc.text(projectName || 'Untitled Project', 105, 40, { align: 'center' });
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 105, 48, { align: 'center' });

    // Stats summary
    const crops      = nodes.filter(n => n.type === 'crop');
    const totalDem   = crops.reduce((s, c) => s + c.flowDemand, 0);
    const totalDel   = crops.reduce((s, c) => s + (c.currentReceived || 0), 0);
    const eff        = totalDem > 0 ? ((totalDel / totalDem) * 100).toFixed(1) : '0.0';

    doc.setFontSize(10); doc.setTextColor(200, 200, 200); doc.setFont('helvetica', 'normal');
    doc.text([
      `Total Nodes: ${nodes.length}`,
      `Total Pipes: ${edges.length}`,
      `Demand: ${totalDem} GPM  |  Delivered: ${totalDel} GPM  |  Efficiency: ${eff}%`,
    ], 20, 60, { lineHeightFactor: 1.8 });

    // Nodes table
    doc.setFontSize(11); doc.setTextColor(34, 211, 238); doc.text('Network Nodes', 20, 85);
    autoTable(doc, {
      startY: 88,
      head: [['Node ID', 'Type', 'Name', 'Elevation', 'Status']],
      body: nodes.map(n => [
        n.id, n.type, n.name || '-', `${n.z}m`,
        n.type === 'pump' ? `${n.pressurePSI} PSI / ${n.maxFlow} GPM` :
        n.type === 'crop' ? `Hydration: ${(n.hydration||0).toFixed(0)}%` : 'Junction'
      ]),
      styles: { fontSize: 8, cellPadding: 2, textColor: [200,200,200], fillColor: [10,10,10], lineColor: [40,40,40] },
      headStyles: { fillColor: [20, 80, 90], textColor: [34, 211, 238], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [15, 15, 15] },
    });

    // Pipes table
    const y2 = doc.lastAutoTable.finalY + 8;
    doc.setFontSize(11); doc.setTextColor(168, 85, 247); doc.text('Pipeline Network', 20, y2);
    autoTable(doc, {
      startY: y2 + 3,
      head: [['Pipe ID', 'From', 'To', 'Type', 'Flow (GPM)', 'Loss (PSI)']],
      body: edges.map(e => {
        return [e.id, e.from, e.to, 'Standard Drip Line', '-', '-'];
      }),
      styles: { fontSize: 8, cellPadding: 2, textColor: [200,200,200], fillColor: [10,10,10], lineColor: [40,40,40] },
      headStyles: { fillColor: [60, 30, 80], textColor: [168, 85, 247], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [15, 15, 15] },
    });

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(7); doc.setTextColor(80, 80, 80);
      doc.text('Generated by AgroFlow Pro — Precision Irrigation Network Designer', 105, 292, { align: 'center' });
    }

    doc.save(`agroflow-report-${safeName}.pdf`);
    addLog('PDF report exported.', 'success');
  };

  // ── JSON Import ──────────────────────────────────────────
  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!Array.isArray(data.nodes) || !Array.isArray(data.edges)) throw new Error('Invalid structure');
        loadSnapshot(data.nodes, data.edges);
        addLog(`Imported project: ${data.name || file.name}`, 'success');
        setExportModalOpen(false);
      } catch (err) {
        addLog(`Import failed: ${err.message}`, 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const ExportBtn = ({ icon: Icon, label, sub, onClick, loading }) => (
    <button
      onClick={onClick}
      disabled={loading}
      className="w-full flex items-center gap-4 p-4 bg-white/2 border border-white/5 rounded-2xl hover:border-white/10 hover:bg-white/4 transition-all group"
    >
      <div className="p-3 rounded-xl bg-black/50 border border-white/5 group-hover:border-white/10 transition-all">
        <Icon size={18} className="text-cyan-400" />
      </div>
      <div className="text-left">
        <div className="text-[11px] font-black text-white">{loading ? 'Processing…' : label}</div>
        <div className="text-[9px] text-zinc-500 mt-0.5">{sub}</div>
      </div>
      <Download size={14} className="text-zinc-600 ml-auto" />
    </button>
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setExportModalOpen(false)} />
          <motion.div
            className="relative glass-card rounded-3xl w-full max-w-md border border-white/8 shadow-2xl overflow-hidden"
            initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 20 }}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
              <h2 className="text-base font-black text-white">Export / Import</h2>
              <button onClick={() => setExportModalOpen(false)} className="text-zinc-500 hover:text-white transition-colors"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-3">
              <ExportBtn icon={FileJson} label="Export JSON"  sub={`${nodes.length} nodes · ${edges.length} pipes — save to backend/exports/`} onClick={exportJSON} />
              <ExportBtn icon={Image}    label="Export PNG"   sub="Screenshot of canvas"  onClick={exportPNG}  loading={pngLoading} />
              <ExportBtn icon={FileText} label="Export PDF"   sub="Full project report"   onClick={exportPDF} />
              <div className="border-t border-white/5 pt-3">
                <input type="file" accept=".json" ref={importRef} onChange={handleImport} className="hidden" />
                <button
                  onClick={() => importRef.current?.click()}
                  className="w-full flex items-center gap-4 p-4 bg-purple-500/5 border border-purple-500/15 rounded-2xl hover:border-purple-500/25 transition-all"
                >
                  <div className="p-3 rounded-xl bg-purple-500/10"><Upload size={18} className="text-purple-400" /></div>
                  <div className="text-left">
                    <div className="text-[11px] font-black text-purple-300">Import JSON</div>
                    <div className="text-[9px] text-zinc-500">Load project from file</div>
                  </div>
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
