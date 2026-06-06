// src/hooks/useKeyboardShortcuts.js
import { useEffect } from 'react';
import useUIStore     from '../stores/uiStore.js';
import useNetworkStore from '../stores/networkStore.js';

export function useKeyboardShortcuts() {
  const {
    activeTool, setActiveTool, setPipeSourceId,
    selectedNodeId, selectedEdgeId,
    clearSelection,
  } = useUIStore();
  const { removeNode, removeEdge, undo, redo } = useNetworkStore();

  useEffect(() => {
    const down = (e) => {
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable) return;

      switch (e.key) {
        case 'Delete':
        case 'Backspace':
          if (selectedNodeId) { removeNode(selectedNodeId); clearSelection(); }
          else if (selectedEdgeId) { removeEdge(selectedEdgeId); clearSelection(); }
          break;
        case 'z':
        case 'Z':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            if (e.shiftKey) redo(); else undo();
          }
          break;
        case 'y':
        case 'Y':
          if (e.ctrlKey || e.metaKey) { e.preventDefault(); redo(); }
          break;
        case 'Escape':
          setPipeSourceId(null);
          setActiveTool('select');
          clearSelection();
          break;
        case 's':
        case 'S':
          if (!e.ctrlKey) setActiveTool('select');
          break;
        case 'p':
        case 'P':
          if (!e.ctrlKey) { setActiveTool('pipe'); }
          break;
        case 'j':
        case 'J':
          if (!e.ctrlKey) setActiveTool('junction');
          break;
        case 'r':
        case 'R':
          if (!e.ctrlKey) setActiveTool('pump');
          break;
        case 'c':
        case 'C':
          if (!e.ctrlKey) setActiveTool('crop');
          break;
        default: break;
      }
    };

    window.addEventListener('keydown', down);
    return () => window.removeEventListener('keydown', down);
  }, [activeTool, selectedNodeId, selectedEdgeId, removeNode, removeEdge, undo, redo, setActiveTool, setPipeSourceId, clearSelection]);
}
