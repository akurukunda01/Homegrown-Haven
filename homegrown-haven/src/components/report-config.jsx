import { FileText, X, RotateCcw, Download } from 'lucide-react';
import {
  FIELD_DEFS,
  GROUP_ORDER,
  DEFAULT_REPORT_CONFIG,
  SCOPES,
  SORT_FIELDS,
  FORMATS,
} from './report-fields';

export default function ReportConfig({ isOpen, onClose, config, onConfigChange, onGenerate, counts = {} }) {
  const update = (patch) => onConfigChange({ ...config, ...patch });

  const toggleColumn = (key) => {
    const columns = { ...config.columns, [key]: !config.columns[key] };
    update({ columns });
  };

  const selectedCount = FIELD_DEFS.filter((f) => config.columns[f.key]).length;
  const rowCount = counts[config.scope] ?? 0;

  return (
    <div
      className={`fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-50 border-l border-gray-200 transition-transform duration-300 ease-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-green-700" />
            <h2 className="text-xl font-bold text-gray-800">Customize Report</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close report options"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Columns */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-gray-700">Columns</label>
              <span className="text-xs text-gray-500">{selectedCount} selected</span>
            </div>
            <div className="space-y-3">
              {GROUP_ORDER.map((group) => (
                <div key={group}>
                  <span className="text-xs font-medium uppercase tracking-wide text-gray-400">{group}</span>
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    {FIELD_DEFS.filter((f) => f.group === group).map((f) => (
                      <button
                        key={f.key}
                        onClick={() => toggleColumn(f.key)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all shadow-sm ${
                          config.columns[f.key]
                            ? 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:scale-105'
                            : 'bg-white border-2 border-gray-300 text-gray-700 hover:scale-105'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Data scope */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Data Scope</label>
            <div className="grid grid-cols-2 gap-2">
              {SCOPES.map((s) => (
                <button
                  key={s.key}
                  onClick={() => update({ scope: s.key })}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all shadow-sm ${
                    config.scope === s.key
                      ? 'bg-gradient-to-r from-green-600 to-green-700 text-white'
                      : 'bg-white border-2 border-gray-300 text-gray-700 hover:scale-105'
                  }`}
                >
                  {s.label}
                  <span className="block text-xs opacity-80">{counts[s.key] ?? 0} rows</span>
                </button>
              ))}
            </div>
          </div>

          {/* Sort */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Sort By</label>
            <div className="flex gap-2">
              <select
                value={config.sortBy}
                onChange={(e) => update({ sortBy: e.target.value })}
                className="flex-1 px-3 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-green-700 focus:border-transparent bg-white shadow-sm"
              >
                {SORT_FIELDS.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
              <select
                value={config.sortOrder}
                onChange={(e) => update({ sortOrder: e.target.value })}
                className="px-3 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-green-700 focus:border-transparent bg-white shadow-sm"
              >
                <option value="desc">Desc</option>
                <option value="asc">Asc</option>
              </select>
            </div>
          </div>

          {/* Format */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Format</label>
            <div className="grid grid-cols-3 gap-2">
              {FORMATS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => update({ format: f.key })}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all shadow-sm ${
                    config.format === f.key
                      ? 'bg-gradient-to-r from-green-600 to-green-700 text-white'
                      : 'bg-white border-2 border-gray-300 text-gray-700 hover:scale-105'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 space-y-3">
          <button
            onClick={() => onConfigChange(DEFAULT_REPORT_CONFIG)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:shadow-green-500/50 hover:scale-105 hover:bg-gray-100 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            Reset to Default
          </button>
          <button
            onClick={onGenerate}
            disabled={selectedCount === 0 || rowCount === 0}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 shadow-2xl hover:shadow-green-500/50 hover:scale-105 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Generate ({rowCount})
          </button>
        </div>
      </div>
    </div>
  );
}
