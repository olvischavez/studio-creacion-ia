import React, { useState } from 'react';
import { 
  Bookmark, 
  Trash2, 
  Copy, 
  Check, 
  FileText, 
  Film, 
  Eye, 
  Download,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Clock,
  Layers,
  ArrowRight
} from 'lucide-react';

interface SavedItem {
  id: string;
  type: 'strategy' | 'flow_doc' | 'pov_short';
  title: string;
  timestamp: string;
  data: any;
}

interface SavedProjectsTabProps {
  savedItems: SavedItem[];
  onRemove: (id: string) => void;
  onClearAll: () => void;
  onLoadItem: (item: SavedItem) => void;
}

export const SavedProjectsTab: React.FC<SavedProjectsTabProps> = ({
  savedItems,
  onRemove,
  onClearAll,
  onLoadItem
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleCopyItem = (item: SavedItem) => {
    navigator.clipboard.writeText(JSON.stringify(item.data, null, 2));
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadItem = (item: SavedItem) => {
    const blob = new Blob([JSON.stringify(item.data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `OlvisBolt_${item.type}_${item.title.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-red-500" /> Proyectos & Temáticas Guardadas ({savedItems.length})
          </h2>
          <p className="text-xs text-zinc-400">
            Guarda tus ideas favoritas y cárgalas en 1 clic para verlas completas o copiarlas mientras grabas
          </p>
        </div>

        {savedItems.length > 0 && (
          <button
            onClick={onClearAll}
            className="self-start sm:self-center px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 hover:bg-red-950/60 text-zinc-400 hover:text-red-300 border border-zinc-800 hover:border-red-800/40 transition-all flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Eliminar Todos los Guardados</span>
          </button>
        )}
      </div>

      {/* Empty State */}
      {savedItems.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 space-y-3">
          <Bookmark className="w-12 h-12 text-zinc-600 mx-auto" />
          <h3 className="text-base font-semibold text-zinc-300">
            Aún no has guardado temáticas
          </h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto leading-relaxed">
            Cuando te guste un tema lo puedes guardar y consevar aquí.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {savedItems.map((item) => {
            const isExpanded = expandedId === item.id;
            return (
              <div
                key={item.id}
                className="rounded-2xl bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 shadow-xl overflow-hidden transition-all"
              >
                {/* Main Card Header */}
                <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-md font-semibold flex items-center gap-1 text-[11px] ${
                        item.type === 'strategy' 
                          ? 'bg-red-950/60 text-red-400 border border-red-800/30'
                          : item.type === 'flow_doc'
                          ? 'bg-amber-950/60 text-amber-300 border border-amber-800/30'
                          : 'bg-purple-950/60 text-purple-300 border border-purple-800/30'
                      }`}>
                        {item.type === 'strategy' && <FileText className="w-3 h-3" />}
                        {item.type === 'flow_doc' && <Film className="w-3 h-3" />}
                        {item.type === 'pov_short' && <Eye className="w-3 h-3" />}
                        <span>
                          {item.type === 'strategy' ? 'Estrategia de Contenido' : item.type === 'flow_doc' ? 'Historias y Documentales' : 'Historias Cortas (Shorts)'}
                        </span>
                      </span>

                      <span className="text-[10px] text-zinc-500 font-mono">
                        Guardado: {item.timestamp}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white leading-snug">
                      {item.title}
                    </h3>

                    <p className="text-xs text-zinc-400 line-clamp-2">
                      {item.type === 'strategy' && `Gancho: "${item.data.hook}"`}
                      {item.type === 'flow_doc' && `Guion: "${item.data.fullScriptCastilian?.slice(0, 160)}..."`}
                      {item.type === 'pov_short' && `Giro final: "${item.data.twistEnding}"`}
                    </p>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center gap-2 self-start md:self-center flex-wrap">
                    {/* LOAD PROJECT BUTTON: Loads back to main screen */}
                    <button
                      onClick={() => onLoadItem(item)}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-red-950/50"
                    >
                      <ArrowRight className="w-4 h-4" />
                      <span>Cargar y Ver Todo Completo</span>
                    </button>

                    <button
                      onClick={() => toggleExpand(item.id)}
                      className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium flex items-center gap-1"
                      title={isExpanded ? 'Ocultar detalles' : 'Ver detalles rápidos'}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      <span className="text-xs">{isExpanded ? 'Ocultar' : 'Ver'}</span>
                    </button>

                    <button
                      onClick={() => handleCopyItem(item)}
                      className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white"
                      title="Copiar JSON"
                    >
                      {copiedId === item.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={() => handleDownloadItem(item)}
                      className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white"
                      title="Descargar archivo JSON"
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onRemove(item.id)}
                      className="p-2 rounded-xl text-zinc-500 hover:text-red-400 hover:bg-red-950/30"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded Details Section */}
                {isExpanded && (
                  <div className="border-t border-zinc-800 bg-zinc-950/70 p-5 space-y-4 text-xs">
                    {/* Strategy View */}
                    {item.type === 'strategy' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
                          <strong className="text-red-400 block uppercase text-[10px]">El Hueco de Contenido:</strong>
                          <p className="text-zinc-300">{item.data.theMissingGap?.whatNobodyHasUploaded}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
                          <strong className="text-cyan-400 block uppercase text-[10px]">Producción con Super Tablet:</strong>
                          <p className="text-zinc-300">{item.data.zeroBudgetProduction?.tabletRole}</p>
                        </div>
                      </div>
                    )}

                    {/* Flow Doc View */}
                    {item.type === 'flow_doc' && (
                      <div className="space-y-3">
                        <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                          <strong className="text-amber-400 block uppercase text-[10px] mb-1">Guion Maestro:</strong>
                          <p className="text-zinc-300 italic font-serif leading-relaxed">"{item.data.fullScriptCastilian}"</p>
                        </div>
                        {item.data.chapters && (
                          <div className="text-[11px] text-zinc-400">
                            <strong>{item.data.chapters.length} Capítulos</strong> preparados para Google Flow. Haz clic en "Cargar & Ver Completo" para ver los clips de 10s uno por uno.
                          </div>
                        )}
                      </div>
                    )}

                    {/* POV Short View */}
                    {item.type === 'pov_short' && (
                      <div className="space-y-3">
                        <div className="p-3 rounded-xl bg-red-950/30 border border-red-900/40">
                          <strong className="text-red-400 block uppercase text-[10px] mb-1">Giro Final en la Escena 4:</strong>
                          <p className="text-white font-bold leading-relaxed">"{item.data.twistEnding}"</p>
                        </div>
                        <div className="text-[11px] text-zinc-400">
                          Duración: <strong>{item.data.durationSeconds || 26} segundos</strong> • <strong>4 Escenas completas</strong>.
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
