// src/components/modals/ProjectManager.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, FolderOpen, Clock } from 'lucide-react';
import useNetworkStore from '../../stores/networkStore.js';
import useUIStore      from '../../stores/uiStore.js';

const LS_KEY = 'agroflow-projects';

function loadProjects() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch { return []; }
}
function saveProjects(arr) {
  localStorage.setItem(LS_KEY, JSON.stringify(arr));
}

export default function ProjectManager() {
  const { projectManagerOpen: open, setProjectManagerOpen, addLog } = useUIStore();
  const { nodes, edges, loadSnapshot, projectName, setProject, markSaved, isDirty, lastSaved } = useNetworkStore();

  const [projects, setProjects] = useState([]);
  const [newName, setNewName]   = useState('');
  const [newDesc, setNewDesc]   = useState('');

  useEffect(() => { if (open) setProjects(loadProjects()); }, [open]);

  const handleSaveCurrent = () => {
    const id   = Date.now().toString();
    const proj = { id, name: projectName, description: '', nodes, edges, savedAt: new Date().toISOString() };
    const arr  = [proj, ...projects.filter(p => p.name !== projectName)].slice(0, 20);
    saveProjects(arr);
    setProjects(arr);
    markSaved();
    addLog(`Project "${projectName}" saved to local storage.`, 'success');
  };

  const handleCreate = () => {
    if (!newName.trim()) return;
    const id   = Date.now().toString();
    const proj = { id, name: newName.trim(), description: newDesc, nodes: [], edges: [], savedAt: new Date().toISOString() };
    const arr  = [proj, ...projects];
    saveProjects(arr);
    setProjects(arr);
    setProject(id, newName.trim());
    setNewName(''); setNewDesc('');
    addLog(`Created new project: ${newName.trim()}`, 'success');
  };

  const handleLoad = (proj) => {
    loadSnapshot(proj.nodes, proj.edges);
    setProject(proj.id, proj.name);
    addLog(`Loaded project: ${proj.name}`, 'success');
    setProjectManagerOpen(false);
  };

  const handleDelete = (id) => {
    const arr = projects.filter(p => p.id !== id);
    saveProjects(arr);
    setProjects(arr);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setProjectManagerOpen(false)} />
          <motion.div
            className="relative glass-card rounded-3xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden border border-white/8 shadow-2xl"
            initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 20 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
              <div>
                <h2 className="text-base font-black text-white">Project Manager</h2>
                <p className="text-[9px] text-zinc-500 font-mono mt-0.5">
                  {isDirty ? '⚠ Unsaved changes' : lastSaved ? `✓ Saved ${new Date(lastSaved).toLocaleTimeString()}` : 'No unsaved changes'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleSaveCurrent} className="px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-cyan-500/15 transition-all">
                  Save Current
                </button>
                <button onClick={() => setProjectManagerOpen(false)} className="p-2 text-zinc-500 hover:text-white transition-colors">
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
              {/* Project list */}
              <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-2">
                <h3 className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-3">Saved Projects</h3>
                {projects.length === 0 ? (
                  <div className="text-center py-8 text-zinc-600 text-xs italic">No saved projects yet.</div>
                ) : projects.map(p => (
                  <div key={p.id} className="flex items-center gap-3 p-3 bg-white/2 border border-white/5 rounded-xl hover:border-white/10 transition-all">
                    <FolderOpen size={16} className="text-purple-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-bold text-white truncate">{p.name}</div>
                      <div className="flex items-center gap-1 text-[9px] text-zinc-600 mt-0.5">
                        <Clock size={9} />
                        {new Date(p.savedAt).toLocaleDateString()} · {p.nodes.length} nodes · {p.edges.length} pipes
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={() => handleLoad(p)} className="px-2 py-1 bg-cyan-500/10 text-cyan-400 rounded-lg text-[9px] font-black hover:bg-cyan-500/20 transition-all">Load</button>
                      <button onClick={() => handleDelete(p.id)} className="p-1.5 text-zinc-600 hover:text-rose-400 transition-colors"><Trash2 size={12} /></button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Create new */}
              <div className="w-56 border-l border-white/5 p-4 space-y-3">
                <h3 className="text-[9px] font-black uppercase tracking-widest text-zinc-500">New Project</h3>
                <input type="text" placeholder="Project name" value={newName} onChange={e => setNewName(e.target.value)}
                  className="w-full bg-black/50 border border-white/8 rounded-lg px-3 py-2 text-[11px] text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-cyan-500/30" />
                <textarea placeholder="Description (optional)" value={newDesc} onChange={e => setNewDesc(e.target.value)}
                  className="w-full bg-black/50 border border-white/8 rounded-lg px-3 py-2 text-[11px] text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-cyan-500/30 resize-none"
                  rows={3} />
                <button onClick={handleCreate} disabled={!newName.trim()}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-emerald-500 text-black rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-emerald-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                  <Plus size={13} /> Create Project
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
