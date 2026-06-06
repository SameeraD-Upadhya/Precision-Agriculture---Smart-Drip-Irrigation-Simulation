// src/components/panels/TelemetryLog.jsx
import React, { useRef, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import useUIStore from '../../stores/uiStore.js';

const typeColor = {
  success: 'text-emerald-400',
  warning: 'text-amber-400',
  error:   'text-rose-400',
  info:    'text-zinc-400',
};

export default function TelemetryLog() {
  const { logs, clearLogs } = useUIStore();
  const scrollRef = useRef(null);

  return (
    <div className="glass-card rounded-2xl flex flex-col" style={{ height: 180 }}>
      <div className="flex justify-between items-center px-4 pt-3 pb-2 border-b border-white/5 shrink-0">
        <span className="text-[9px] font-black uppercase tracking-[0.25em] text-zinc-500">Telemetry Log</span>
        <button onClick={clearLogs} className="p-1 text-zinc-600 hover:text-rose-400 transition-colors" title="Clear logs">
          <Trash2 size={11} />
        </button>
      </div>
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto scrollbar-thin px-4 py-2 space-y-1"
        style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 9 }}
      >
        {logs.length === 0 ? (
          <span className="text-zinc-700 italic">Monitoring pipeline metrics...</span>
        ) : (
          logs.map(l => (
            <div key={l.id} className="flex gap-2 leading-tight">
              <span className="text-zinc-700 shrink-0">[{l.time}]</span>
              <span className={typeColor[l.type] || 'text-zinc-400'}>{l.msg}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
