'use client';

import {
  Check,
  Copy,
  Download,
  FileCode2,
  GitBranch,
  Network,
  RotateCcw,
  ShieldCheck,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type {
  BundleArtifactKey,
  ProjectTopologyRecord,
  TopologyNode,
  TopologyNodeType,
} from '@/core/types';
import { projectPetitions } from '@/services/client/petitions';

interface TopologyGraphTabProps {
  codigoProyecto: string;
  topology: ProjectTopologyRecord | null;
  isLoading: boolean;
  errorMessage: string | null;
  onRetry: () => void;
}

type NodeFilter = 'all' | 'route' | 'view' | 'partials' | 'endpoint';
type ArtifactViewMode = 'graph' | 'topology_md' | 'project_map_json' | 'llms_txt';

interface PositionedNode extends TopologyNode {
  x: number;
  y: number;
}

const NODE_TYPE_META: Record<
  TopologyNodeType,
  { label: string; stroke: string; fill: string; badgeClass: string; col: number }
> = {
  route: {
    label: 'Ruta Web',
    stroke: '#22D3EE',
    fill: 'rgba(34, 211, 238, 0.14)',
    badgeClass: 'bg-docuflow-cyan/20 text-docuflow-cyan',
    col: 0,
  },
  view: {
    label: 'Vista Blade',
    stroke: '#3B82F6',
    fill: 'rgba(59, 130, 246, 0.16)',
    badgeClass: 'bg-docuflow-primary/15 text-docuflow-primary',
    col: 1,
  },
  layout: {
    label: 'Layout',
    stroke: '#8B5CF6',
    fill: 'rgba(139, 92, 246, 0.16)',
    badgeClass: 'bg-docuflow-violet/15 text-docuflow-violet',
    col: 2,
  },
  partial: {
    label: 'Parcial',
    stroke: '#A78BFA',
    fill: 'rgba(167, 139, 250, 0.16)',
    badgeClass: 'bg-docuflow-violet/15 text-docuflow-violet',
    col: 2,
  },
  component: {
    label: 'Componente',
    stroke: '#60A5FA',
    fill: 'rgba(96, 165, 250, 0.16)',
    badgeClass: 'bg-docuflow-action/15 text-docuflow-action',
    col: 2,
  },
  endpoint: {
    label: 'Form / Endpoint',
    stroke: '#F97316',
    fill: 'rgba(249, 115, 22, 0.16)',
    badgeClass: 'bg-docuflow-orange/15 text-docuflow-orange',
    col: 3,
  },
};

export function TopologyGraphTab({
  codigoProyecto,
  topology,
  isLoading,
  errorMessage,
  onRetry,
}: TopologyGraphTabProps) {
  const [nodeFilter, setNodeFilter] = useState<NodeFilter>('all');
  const [viewMode, setViewMode] = useState<ArtifactViewMode>('graph');
  const [zoom, setZoom] = useState(1);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [downloadingArtifact, setDownloadingArtifact] =
    useState<BundleArtifactKey | null>(null);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && selectedNodeId) {
        setSelectedNodeId(null);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeId]);

  const filteredNodes = useMemo(() => {
    if (!topology) return [];
    if (nodeFilter === 'all') return topology.nodes;
    return topology.nodes.filter((node) => {
      if (nodeFilter === 'route') return node.type === 'route';
      if (nodeFilter === 'view') return node.type === 'view';
      if (nodeFilter === 'partials') {
        return ['layout', 'partial', 'component'].includes(node.type);
      }
      return node.type === 'endpoint';
    });
  }, [nodeFilter, topology]);

  const layout = useMemo(() => {
    const columns: Record<number, TopologyNode[]> = { 0: [], 1: [], 2: [], 3: [] };
    for (const node of filteredNodes) {
      const col = NODE_TYPE_META[node.type].col;
      columns[col].push(node);
    }

    const activeCols = ([0, 1, 2, 3] as const).filter(
      (c) => columns[c].length > 0,
    );
    const colPositions = new Map<number, number>();
    const baseWidth = Math.max(820, activeCols.length * 240);
    activeCols.forEach((colIdx, index) => {
      const x =
        activeCols.length === 1
          ? baseWidth / 2
          : 120 + index * ((baseWidth - 240) / (activeCols.length - 1));
      colPositions.set(colIdx, x);
    });

    const maxRows = Math.max(
      1,
      ...Object.values(columns).map((list) => list.length),
    );
    const canvasHeight = Math.max(360, maxRows * 92 + 90);

    const positioned: PositionedNode[] = [];
    const posById = new Map<string, PositionedNode>();

    for (const colIdx of activeCols) {
      const list = columns[colIdx];
      const stepY = canvasHeight / (list.length + 1);
      const x = colPositions.get(colIdx) ?? 150;
      list.forEach((node, idx) => {
        const y = (idx + 1) * stepY;
        const pNode: PositionedNode = { ...node, x, y };
        positioned.push(pNode);
        posById.set(node.id, pNode);
      });
    }

    const visibleEdges = (topology?.edges ?? []).filter(
      (edge) => posById.has(edge.source) && posById.has(edge.target),
    );

    return {
      width: baseWidth,
      height: canvasHeight,
      positioned,
      posById,
      edges: visibleEdges,
    };
  }, [filteredNodes, topology]);

  const activeNode = useMemo(() => {
    if (!topology || !selectedNodeId) return null;
    return topology.nodes.find((n) => n.id === selectedNodeId) ?? null;
  }, [selectedNodeId, topology]);

  const connectedEdges = useMemo(() => {
    if (!topology || !selectedNodeId) return { incoming: [], outgoing: [] };
    return {
      incoming: topology.edges.filter((e) => e.target === selectedNodeId),
      outgoing: topology.edges.filter((e) => e.source === selectedNodeId),
    };
  }, [selectedNodeId, topology]);

  async function handleCopyText(key: string, content: string) {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey(null), 2200);
    } catch {
      // Ignore clipboard permission denial
    }
  }

  async function handleDownloadArtifact(
    artifact: BundleArtifactKey,
    filename: string,
  ) {
    setDownloadingArtifact(artifact);
    try {
      await projectPetitions.downloadArtifact(codigoProyecto, artifact, filename);
    } finally {
      setDownloadingArtifact(null);
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-docuflow-border bg-docuflow-surface p-8 text-center text-sm text-docuflow-slate">
        Construyendo grafo arquitectónico de {codigoProyecto}...
      </div>
    );
  }

  if (errorMessage || !topology) {
    return (
      <div className="rounded-2xl border border-docuflow-orange/40 bg-docuflow-surface p-8 text-center">
        <p className="text-sm font-semibold text-docuflow-orange">
          {errorMessage ?? 'No se pudo cargar la topología del proyecto.'}
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-xl bg-docuflow-primary px-4 py-2 text-xs font-semibold text-white hover:bg-docuflow-action"
        >
          Reintentar análisis
        </button>
      </div>
    );
  }

  const activeArtifactContent =
    viewMode === 'topology_md'
      ? topology.topology_markdown
      : viewMode === 'project_map_json'
        ? topology.project_map_json
        : topology.llms_txt;

  return (
    <div className="space-y-5">
      {/* Top Bar: Metrics & AI Artifact Exports */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-docuflow-border bg-docuflow-surface p-4 shadow-sm xl:flex-row xl:items-center">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-docuflow-elevated px-3 py-1.5 font-semibold text-docuflow-navy">
            <Network className="h-3.5 w-3.5 text-docuflow-cyan" />
            <span>{topology.metrics.total_nodes} nodos</span>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-docuflow-elevated px-3 py-1.5 font-semibold text-docuflow-navy">
            <GitBranch className="h-3.5 w-3.5 text-docuflow-primary" />
            <span>{topology.metrics.total_edges} relaciones</span>
          </span>
          <span className="rounded-xl bg-docuflow-input px-3 py-1.5 font-medium text-docuflow-slate">
            Rutas: {topology.metrics.routes_count} | Vistas: {topology.metrics.views_count} | Endpoints: {topology.metrics.endpoints_count}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={downloadingArtifact !== null}
            onClick={() =>
              void handleDownloadArtifact(
                'topology_md',
                `${codigoProyecto}_TOPOLOGY.md`,
              )
            }
            className="inline-flex items-center gap-1.5 rounded-xl border border-docuflow-border bg-docuflow-elevated px-3 py-1.5 text-xs font-semibold text-docuflow-navy hover:border-docuflow-cyan"
          >
            <Download className="h-3.5 w-3.5 text-docuflow-cyan" />
            <span>TOPOLOGY.md</span>
          </button>
          <button
            type="button"
            disabled={downloadingArtifact !== null}
            onClick={() =>
              void handleDownloadArtifact(
                'project_map_json',
                `${codigoProyecto}_project-map.json`,
              )
            }
            className="inline-flex items-center gap-1.5 rounded-xl border border-docuflow-border bg-docuflow-elevated px-3 py-1.5 text-xs font-semibold text-docuflow-navy hover:border-docuflow-primary"
          >
            <Download className="h-3.5 w-3.5 text-docuflow-primary" />
            <span>project-map.json</span>
          </button>
          <button
            type="button"
            disabled={downloadingArtifact !== null}
            onClick={() =>
              void handleDownloadArtifact(
                'llms_txt',
                `${codigoProyecto}_llms.txt`,
              )
            }
            className="inline-flex items-center gap-1.5 rounded-xl border border-docuflow-border bg-docuflow-elevated px-3 py-1.5 text-xs font-semibold text-docuflow-navy hover:border-docuflow-violet"
          >
            <Download className="h-3.5 w-3.5 text-docuflow-violet" />
            <span>llms.txt</span>
          </button>
        </div>
      </div>

      {/* Mode Switcher & Graph Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-docuflow-border bg-docuflow-surface p-1">
          {(
            [
              { id: 'graph', label: 'Grafo Interactivo (SVG)' },
              { id: 'topology_md', label: 'TOPOLOGY.md' },
              { id: 'project_map_json', label: 'project-map.json' },
              { id: 'llms_txt', label: 'llms.txt' },
            ] as const
          ).map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => setViewMode(mode.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                viewMode === mode.id
                  ? 'bg-docuflow-primary text-white'
                  : 'text-docuflow-slate hover:text-docuflow-navy'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>

        {viewMode === 'graph' ? (
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap gap-1">
              {(
                [
                  { id: 'all', label: 'Todos' },
                  { id: 'route', label: 'Rutas' },
                  { id: 'view', label: 'Vistas' },
                  { id: 'partials', label: 'Layouts' },
                  { id: 'endpoint', label: 'Endpoints' },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => {
                    setNodeFilter(f.id);
                    setSelectedNodeId(null);
                  }}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold ${
                    nodeFilter === f.id
                      ? 'bg-docuflow-cyan text-slate-950'
                      : 'border border-docuflow-border bg-docuflow-surface text-docuflow-slate hover:text-docuflow-navy'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 rounded-xl border border-docuflow-border bg-docuflow-surface p-1">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(0.7, Number((z - 0.15).toFixed(2))))}
                aria-label="Alejar grafo"
                className="rounded-lg p-1.5 text-docuflow-slate hover:bg-docuflow-input hover:text-docuflow-navy"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <span className="px-1.5 font-mono text-[11px] font-semibold text-docuflow-navy">
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(1.6, Number((z + 0.15).toFixed(2))))}
                aria-label="Acercar grafo"
                className="rounded-lg p-1.5 text-docuflow-slate hover:bg-docuflow-input hover:text-docuflow-navy"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setZoom(1);
                  setNodeFilter('all');
                  setSelectedNodeId(null);
                }}
                aria-label="Restablecer vista"
                title="Restablecer zoom y filtros"
                className="rounded-lg p-1.5 text-docuflow-slate hover:bg-docuflow-input hover:text-docuflow-navy"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => void handleCopyText(viewMode, activeArtifactContent)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-docuflow-border bg-docuflow-surface px-3.5 py-2 text-xs font-semibold text-docuflow-navy hover:border-docuflow-cyan"
          >
            {copiedKey === viewMode ? (
              <>
                <Check className="h-3.5 w-3.5 text-docuflow-cyan" />
                <span>Copiado al portapapeles</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copiar contenido</span>
              </>
            )}
          </button>
        )}
      </div>

      {viewMode === 'graph' ? (
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Interactive SVG Constellation Canvas */}
          <div className="overflow-hidden rounded-2xl border border-docuflow-border bg-docuflow-surface shadow-sm lg:col-span-8">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-docuflow-border bg-docuflow-elevated/60 px-4 py-2.5 text-[11px] text-docuflow-slate">
              <span>
                Haz clic en un nodo para inspeccionar sus rutas, archivos Blade y relaciones.
              </span>
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-[#22D3EE]" /> Ruta
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-[#3B82F6]" /> Vista
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-[#8B5CF6]" /> Layout/Parcial
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-[#F97316]" /> Endpoint
                </span>
              </div>
            </div>

            <div className="overflow-auto bg-docuflow-bg/70 p-3">
              {layout.positioned.length === 0 ? (
                <div className="flex h-72 items-center justify-center text-xs text-docuflow-slate">
                  No hay nodos visibles para este filtro.
                </div>
              ) : (
                <svg
                  viewBox={`0 0 ${layout.width} ${layout.height}`}
                  style={{
                    width: `${Math.round(zoom * 100)}%`,
                    minWidth: '640px',
                    height: `${Math.round(layout.height * zoom)}px`,
                  }}
                  className="mx-auto block select-none"
                  role="img"
                  aria-label={`Grafo de topología de ${codigoProyecto}`}
                >
                  <defs>
                    <pattern
                      id="constellation-grid"
                      width="32"
                      height="32"
                      patternUnits="userSpaceOnUse"
                    >
                      <circle cx="1" cy="1" r="1" fill="rgba(148, 163, 184, 0.22)" />
                    </pattern>
                    <marker
                      id="arrow-muted"
                      viewBox="0 0 10 10"
                      refX="8"
                      refY="5"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="rgba(148, 163, 184, 0.7)" />
                    </marker>
                    <marker
                      id="arrow-active"
                      viewBox="0 0 10 10"
                      refX="8"
                      refY="5"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="#22D3EE" />
                    </marker>
                  </defs>

                  <rect
                    width={layout.width}
                    height={layout.height}
                    fill="url(#constellation-grid)"
                  />

                  {/* Edges */}
                  {layout.edges.map((edge) => {
                    const src = layout.posById.get(edge.source);
                    const tgt = layout.posById.get(edge.target);
                    if (!src || !tgt) return null;

                    const isHighlighted =
                      selectedNodeId !== null &&
                      (edge.source === selectedNodeId ||
                        edge.target === selectedNodeId);
                    const isDimmed =
                      selectedNodeId !== null && !isHighlighted;

                    const x1 = src.x + 76;
                    const y1 = src.y;
                    const x2 = tgt.x - 76;
                    const y2 = tgt.y;
                    const cx1 = x1 + (x2 - x1) * 0.45;
                    const cx2 = x2 - (x2 - x1) * 0.45;
                    const midX = (x1 + x2) / 2;
                    const midY = (y1 + y2) / 2 - 6;

                    return (
                      <g
                        key={edge.id}
                        style={{ opacity: isDimmed ? 0.22 : 1 }}
                      >
                        <path
                          d={`M ${x1} ${y1} C ${cx1} ${y1}, ${cx2} ${y2}, ${x2} ${y2}`}
                          fill="none"
                          stroke={
                            isHighlighted
                              ? '#22D3EE'
                              : 'rgba(148, 163, 184, 0.55)'
                          }
                          strokeWidth={isHighlighted ? 2.2 : 1.4}
                          markerEnd={
                            isHighlighted
                              ? 'url(#arrow-active)'
                              : 'url(#arrow-muted)'
                          }
                        />
                        <text
                          x={midX}
                          y={midY}
                          textAnchor="middle"
                          fontSize="9"
                          className="fill-docuflow-slate font-mono"
                        >
                          {edge.label}
                        </text>
                      </g>
                    );
                  })}

                  {/* Nodes */}
                  {layout.positioned.map((node) => {
                    const meta = NODE_TYPE_META[node.type];
                    const isSelected = node.id === selectedNodeId;
                    const isConnected =
                      selectedNodeId !== null &&
                      (isSelected ||
                        layout.edges.some(
                          (e) =>
                            (e.source === selectedNodeId && e.target === node.id) ||
                            (e.target === selectedNodeId && e.source === node.id),
                        ));
                    const isDimmed = selectedNodeId !== null && !isConnected;
                    const displayLabel =
                      node.label.length > 20
                        ? `${node.label.slice(0, 18)}..`
                        : node.label;

                    return (
                      <g
                        key={node.id}
                        transform={`translate(${node.x - 76}, ${node.y - 25})`}
                        onClick={() =>
                          setSelectedNodeId((prev) =>
                            prev === node.id ? null : node.id,
                          )
                        }
                        style={{
                          cursor: 'pointer',
                          opacity: isDimmed ? 0.3 : 1,
                        }}
                      >
                        <rect
                          width="152"
                          height="50"
                          rx="12"
                          fill={meta.fill}
                          stroke={isSelected ? '#22D3EE' : meta.stroke}
                          strokeWidth={isSelected ? 2.5 : 1.5}
                          className="transition-all"
                        />
                        <text
                          x="12"
                          y="18"
                          fontSize="9"
                          fontWeight="700"
                          fill={meta.stroke}
                        >
                          {meta.label.toUpperCase()}
                        </text>
                        <text
                          x="12"
                          y="36"
                          fontSize="11"
                          fontWeight="600"
                          className="fill-docuflow-navy font-mono"
                        >
                          {displayLabel}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              )}
            </div>
          </div>

          {/* Lateral Node Inspector */}
          <aside className="rounded-2xl border border-docuflow-border bg-docuflow-surface p-5 shadow-sm lg:col-span-4">
            <div className="flex items-center justify-between border-b border-docuflow-border pb-3">
              <h3 className="flex items-center gap-1.5 text-sm font-bold text-docuflow-navy">
                <FileCode2 className="h-4 w-4 text-docuflow-cyan" />
                <span>Inspector de Nodo</span>
              </h3>
              {activeNode ? (
                <button
                  type="button"
                  onClick={() => setSelectedNodeId(null)}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-docuflow-slate hover:bg-docuflow-input hover:text-docuflow-navy"
                >
                  <X className="h-3 w-3" />
                  <span>Limpiar</span>
                </button>
              ) : null}
            </div>

            {!activeNode ? (
              <div className="mt-4 space-y-3 text-xs text-docuflow-slate">
                <p>
                  Selecciona cualquier nodo en el mapa para ver su ruta exacta, plantilla Blade y conexiones entrantes o salientes.
                </p>
                <div className="rounded-xl border border-docuflow-border bg-docuflow-elevated/60 p-3.5 text-[11px]">
                  <p className="font-semibold text-docuflow-navy">
                    Origen del análisis
                  </p>
                  <p className="mt-1">
                    {topology.source_mode === 'zip'
                      ? 'Extracción AST/Directivas desde el paquete .zip real de Laravel.'
                      : 'Reconstrucción desde metadatos SVM registrados en MongoDB.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-4 space-y-4 text-xs">
                <div>
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                      NODE_TYPE_META[activeNode.type].badgeClass
                    }`}
                  >
                    {NODE_TYPE_META[activeNode.type].label}
                  </span>
                  <p className="mt-2 break-all font-mono text-sm font-bold text-docuflow-navy">
                    {activeNode.label}
                  </p>
                </div>

                <div className="space-y-1.5 rounded-xl border border-docuflow-border bg-docuflow-elevated/60 p-3 text-[11px]">
                  {activeNode.file_path ? (
                    <p className="break-all text-docuflow-slate">
                      Archivo:{' '}
                      <span className="font-mono font-semibold text-docuflow-navy">
                        {activeNode.file_path}
                      </span>
                    </p>
                  ) : null}
                  {activeNode.route_path ? (
                    <p className="text-docuflow-slate">
                      Ruta:{' '}
                      <span className="font-mono font-semibold text-docuflow-navy">
                        {activeNode.route_path}
                      </span>
                    </p>
                  ) : null}
                  {activeNode.http_method ? (
                    <p className="text-docuflow-slate">
                      Método HTTP:{' '}
                      <span className="font-mono font-bold text-docuflow-primary">
                        {activeNode.http_method}
                      </span>
                    </p>
                  ) : null}
                  {activeNode.svm_classification ? (
                    <p className="text-docuflow-slate">
                      Filtro SVM:{' '}
                      <span className="font-semibold text-docuflow-navy">
                        {activeNode.svm_classification}
                      </span>
                    </p>
                  ) : null}
                  {activeNode.csrf_protected !== undefined ? (
                    <p className="flex items-center gap-1 text-docuflow-slate">
                      <ShieldCheck className="h-3.5 w-3.5 text-docuflow-cyan" />
                      <span>
                        Protección @csrf:{' '}
                        <strong className="text-docuflow-navy">
                          {activeNode.csrf_protected ? 'Activa' : 'No detectada'}
                        </strong>
                      </span>
                    </p>
                  ) : null}
                </div>

                {activeNode.elements && activeNode.elements.length > 0 ? (
                  <div>
                    <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-docuflow-slate">
                      Elementos detectados
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {activeNode.elements.map((el) => (
                        <span
                          key={el}
                          className="rounded-md bg-docuflow-input px-2 py-0.5 font-mono text-[10px] text-docuflow-navy"
                        >
                          {el}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div>
                  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-docuflow-slate">
                    Conexiones ({connectedEdges.incoming.length + connectedEdges.outgoing.length})
                  </p>
                  <div className="space-y-1.5">
                    {connectedEdges.incoming.map((edge) => {
                      const src = topology.nodes.find((n) => n.id === edge.source);
                      if (!src) return null;
                      return (
                        <button
                          key={edge.id}
                          type="button"
                          onClick={() => setSelectedNodeId(src.id)}
                          className="flex w-full items-center justify-between rounded-lg border border-docuflow-border bg-docuflow-bg px-2.5 py-1.5 text-left text-[11px] hover:border-docuflow-cyan"
                        >
                          <span className="truncate font-mono text-docuflow-navy">
                            {src.label}
                          </span>
                          <span className="ml-2 shrink-0 text-[10px] text-docuflow-cyan">
                            entra ({edge.label})
                          </span>
                        </button>
                      );
                    })}
                    {connectedEdges.outgoing.map((edge) => {
                      const tgt = topology.nodes.find((n) => n.id === edge.target);
                      if (!tgt) return null;
                      return (
                        <button
                          key={edge.id}
                          type="button"
                          onClick={() => setSelectedNodeId(tgt.id)}
                          className="flex w-full items-center justify-between rounded-lg border border-docuflow-border bg-docuflow-bg px-2.5 py-1.5 text-left text-[11px] hover:border-docuflow-primary"
                        >
                          <span className="truncate font-mono text-docuflow-navy">
                            {tgt.label}
                          </span>
                          <span className="ml-2 shrink-0 text-[10px] text-docuflow-primary">
                            sale ({edge.label})
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </aside>
        </div>
      ) : (
        <div className="rounded-2xl border border-docuflow-border bg-docuflow-surface p-4 shadow-sm">
          <pre className="max-h-[540px] overflow-auto rounded-xl bg-docuflow-bg p-4 font-mono text-xs leading-relaxed text-docuflow-navy">
            {activeArtifactContent}
          </pre>
        </div>
      )}
    </div>
  );
}
