import {
  useRef, useState, useEffect, useCallback, useMemo, useLayoutEffect,
} from 'react'
import { useParams, useNavigate } from 'react-router'
import { nanoid } from 'nanoid'
import {
  Sparkles, Loader2, Trash2, Link2, X, Plus, ZoomIn, ZoomOut, Maximize2,
} from 'lucide-react'
import { useWorkspaceStore } from '@/store/workspaceStore'
import { useAutoSave } from '@/hooks/useAutoSave'
import { useAuthStore } from '@/store/authStore'
import Breadcrumb from '@/components/dashboard/Breadcrumb'
import NoteTitleInput from '@/components/dashboard/NoteTitleInput'
import { CloudAiService } from '@/lib/cloudAiService'
import type { BrainstormNode, BrainstormEdge, BrainstormData, NodeType } from '@/types/brainstorm'
import {
  NODE_TYPE_CONFIG, createDefaultBrainstormData, screenToWorld, worldToScreen,
} from '@/types/brainstorm'

// ─── Constants ────────────────────────────────────────────────────────────────

const NODE_W = 168
const NODE_H = 60
const ZOOM_MIN = 0.2
const ZOOM_MAX = 2.5
const ZOOM_STEP = 0.12

// ─── Bezier edge between two screen-space centers ─────────────────────────────
// Takes screen px coordinates so the SVG can live at container level (outside
// the CSS-transform div) and never be clipped by overflow:hidden.

function edgePathScreen(sx1: number, sy1: number, sx2: number, sy2: number, zoom: number): string {
  const dx = Math.abs(sx2 - sx1) * 0.55 + 40 * zoom
  return `M ${sx1} ${sy1} C ${sx1 + dx} ${sy1}, ${sx2 - dx} ${sy2}, ${sx2} ${sy2}`
}

// ─── NodeCard ─────────────────────────────────────────────────────────────────

function NodeCard({
  node, selected, connectingMode, isConnectSource,
  onMouseDown, onStartConnect, onCompleteConnect, onUpdate, onDelete,
}: {
  node: BrainstormNode
  selected: boolean
  connectingMode: boolean   // global "pick target" mode
  isConnectSource: boolean  // this node started the connection
  onMouseDown: (id: string, e: React.MouseEvent) => void
  onStartConnect: (id: string) => void
  onCompleteConnect: (id: string) => void
  onUpdate: (id: string, patch: Partial<BrainstormNode>) => void
  onDelete: (id: string) => void
}) {
  const cfg = NODE_TYPE_CONFIG[node.type]
  const [editMode, setEditMode] = useState(false)
  const [showTypePicker, setShowTypePicker] = useState(false)
  const titleRef = useRef<HTMLInputElement>(null)
  const contentRef = useRef<HTMLTextAreaElement>(null)

  // Auto-focus title when entering edit mode
  useEffect(() => {
    if (editMode) setTimeout(() => titleRef.current?.focus(), 30)
  }, [editMode])

  const expanded = editMode || !!node.content

  return (
    <div
      data-node={node.id}
      style={{
        position: 'absolute',
        left: -NODE_W / 2,
        top: expanded ? -80 : -NODE_H / 2,
        width: NODE_W,
        minHeight: expanded ? 140 : NODE_H,
        background: cfg.bg,
        border: `2px solid ${isConnectSource ? '#a855f7' : selected ? '#8b5cf6' : cfg.border}`,
        borderRadius: node.isRoot ? 14 : 10,
        boxShadow: selected
          ? `0 0 0 3px #8b5cf630, 0 6px 20px ${cfg.border}30`
          : `0 2px 8px rgba(0,0,0,0.10)`,
        cursor: connectingMode ? 'crosshair' : 'grab',
        userSelect: 'none',
        transition: 'min-height 0.15s, box-shadow 0.15s, border-color 0.15s',
      }}
      onMouseDown={(e) => {
        e.stopPropagation()
        // In connect-target mode, clicking any other node completes the connection
        if (connectingMode && !isConnectSource) { onCompleteConnect(node.id); return }
        if (e.detail === 2) { setEditMode(true); return }
        onMouseDown(node.id, e)
      }}
    >
      {/* Type badge (clickable) */}
      <button
        data-node={node.id}
        onMouseDown={(e) => { e.stopPropagation(); setShowTypePicker((v) => !v) }}
        className="absolute -top-3 left-3 flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold shadow"
        style={{ background: cfg.border, color: '#fff' }}
      >
        <span>{cfg.emoji}</span>
        <span>{cfg.label}</span>
      </button>

      {/* Type picker popover */}
      {showTypePicker && (
        <div
          className="absolute -top-11 left-0 flex gap-1 rounded-xl border border-border bg-background/95 backdrop-blur px-2 py-1.5 shadow-xl z-50"
          onMouseDown={(e) => e.stopPropagation()}
        >
          {(Object.keys(NODE_TYPE_CONFIG) as NodeType[]).map((t) => (
            <button
              key={t}
              title={NODE_TYPE_CONFIG[t].label}
              className={`h-7 w-7 rounded-lg border text-sm transition-colors ${
                node.type === t ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted'
              }`}
              onMouseDown={(e) => {
                e.stopPropagation()
                onUpdate(node.id, { type: t })
                setShowTypePicker(false)
              }}
            >
              {NODE_TYPE_CONFIG[t].emoji}
            </button>
          ))}
          <button
            className="h-7 w-7 rounded-lg border border-border hover:bg-muted text-muted-foreground flex items-center justify-center"
            onMouseDown={(e) => { e.stopPropagation(); setShowTypePicker(false) }}
          >
            <X size={11} />
          </button>
        </div>
      )}

      {/* Content area */}
      <div className="px-3 pt-3 pb-2 flex flex-col gap-1.5">
        {editMode ? (
          <>
            <input
              ref={titleRef}
              value={node.title}
              onChange={(e) => onUpdate(node.id, { title: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setEditMode(false)
                if (e.key === 'Enter') contentRef.current?.focus()
                e.stopPropagation()
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              placeholder="Title…"
              className="w-full bg-transparent text-sm font-semibold outline-none placeholder:opacity-40"
              style={{ color: cfg.color }}
            />
            <textarea
              ref={contentRef}
              value={node.content ?? ''}
              onChange={(e) => onUpdate(node.id, { content: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setEditMode(false)
                e.stopPropagation()
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              placeholder="Notes…"
              rows={3}
              className="w-full bg-transparent text-xs outline-none resize-none placeholder:opacity-40 leading-relaxed"
              style={{ color: cfg.color }}
            />
            <button
              onMouseDown={(e) => { e.stopPropagation(); setEditMode(false) }}
              className="self-end text-[10px] font-medium opacity-60 hover:opacity-100"
              style={{ color: cfg.color }}
            >
              Done
            </button>
          </>
        ) : (
          <>
            <span
              className="text-sm font-semibold leading-snug line-clamp-2 text-center"
              style={{ color: cfg.color }}
            >
              {node.title || <span className="opacity-30 italic">Double-click to edit</span>}
            </span>
            {node.content && (
              <span className="text-[11px] leading-relaxed line-clamp-3 opacity-70" style={{ color: cfg.color }}>
                {node.content}
              </span>
            )}
          </>
        )}
      </div>

      {/* Action buttons — shown when selected and not in connect mode */}
      {selected && !connectingMode && !editMode && (
        <>
          {/* Connect handle (right) */}
          <button
            data-node={node.id}
            onMouseDown={(e) => { e.stopPropagation(); onStartConnect(node.id) }}
            className="absolute -right-3.5 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-violet-500 text-white flex items-center justify-center shadow-lg hover:bg-violet-600 transition-colors z-10"
            title="Drag to connect"
          >
            <Link2 size={12} />
          </button>

          {/* Delete (top-right, non-root only) */}
          {!node.isRoot && (
            <button
              data-node={node.id}
              onMouseDown={(e) => { e.stopPropagation(); onDelete(node.id) }}
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center shadow hover:bg-red-600 transition-colors z-10"
              title="Delete node"
            >
              <X size={9} />
            </button>
          )}
        </>
      )}
    </div>
  )
}

// ─── AI Panel (floating) ──────────────────────────────────────────────────────

function AiPanel({
  selectedNode, isOnline, onExpand, onClose, loading,
}: {
  selectedNode: BrainstormNode | null
  isOnline: boolean
  onExpand: (nodeId: string) => void
  onClose: () => void
  loading: boolean
}) {
  return (
    <div className="absolute right-3 top-16 z-30 w-60 rounded-2xl border border-border bg-background/95 backdrop-blur shadow-xl overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border">
        <Sparkles size={13} className="text-violet-500" />
        <span className="flex-1 text-xs font-semibold text-foreground">AI Assistant</span>
        <button onClick={onClose} className="rounded p-0.5 hover:bg-accent text-muted-foreground">
          <X size={12} />
        </button>
      </div>
      <div className="p-3 space-y-3">
        {selectedNode ? (
          <div>
            <p className="text-[11px] text-muted-foreground mb-1.5">
              Selected: <span className="font-medium text-foreground">{selectedNode.title || 'Untitled'}</span>
            </p>
            <button
              onClick={() => onExpand(selectedNode.id)}
              disabled={!isOnline || loading}
              className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-violet-500 px-3 py-2 text-xs font-medium text-white hover:bg-violet-600 transition-colors disabled:opacity-50"
            >
              {loading
                ? <><Loader2 size={12} className="animate-spin" /> Expanding…</>
                : <><Sparkles size={12} /> Expand this idea</>}
            </button>
          </div>
        ) : (
          <p className="text-[11px] text-muted-foreground text-center py-2">
            Select a node to expand it with AI.
          </p>
        )}
        <div className="space-y-1 pt-1 border-t border-border">
          {[
            'Double-click canvas → new node',
            'Double-click node → edit title & notes',
            'Click badge → change type',
            'Click ⊕ → connect to another node',
            'Select + Delete → remove node',
          ].map((tip, i) => (
            <p key={i} className="text-[10px] text-muted-foreground leading-relaxed">· {tip}</p>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Main BrainstormEditor ────────────────────────────────────────────────────

export default function BrainstormEditor() {
  const { noteId } = useParams<{ noteId: string }>()
  const navigate = useNavigate()
  const { notes, setActiveNote, updateNote } = useWorkspaceStore()
  const { isAuthenticated, isGuest } = useAuthStore()
  const isOnline = isAuthenticated && !isGuest

  const note = useMemo(() => notes.find((n) => n.id === noteId), [notes, noteId])
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerSize, setContainerSize] = useState({ w: 800, h: 600 })

  const [data, setData] = useState<BrainstormData>(() => {
    if (note?.content && typeof note.content === 'object' && 'nodes' in note.content) {
      return note.content as BrainstormData
    }
    return createDefaultBrainstormData(note?.title || 'Central Idea')
  })

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null)
  const [newNodeType, setNewNodeType] = useState<NodeType>('idea')
  const [showAi, setShowAi] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)

  // Drag & pan refs (avoid re-render during motion)
  const dragging = useRef<{ nodeId: string; startWx: number; startWy: number; startMx: number; startMy: number } | null>(null)
  const panning  = useRef<{ startCamX: number; startCamY: number; startMx: number; startMy: number } | null>(null)

  const { save } = useAutoSave(noteId ?? '')

  useEffect(() => { if (noteId) setActiveNote(noteId) }, [noteId, setActiveNote])
  useEffect(() => {
    if (!note && noteId) navigate('/dashboard', { replace: true })
  }, [note, noteId, navigate])
  useEffect(() => {
    if (note?.content && typeof note.content === 'object' && 'nodes' in note.content) {
      setData(note.content as BrainstormData)
    }
  }, [note?.id])

  useLayoutEffect(() => {
    const el = containerRef.current; if (!el) return
    const ro = new ResizeObserver(([e]) =>
      setContainerSize({ w: e.contentRect.width, h: e.contentRect.height })
    )
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // ── Persist helpers ─────────────────────────────────────────────────────────

  const persist = useCallback((next: BrainstormData) => {
    setData(next)
    updateNote(noteId!, { content: next })
    save({ content: next })
  }, [noteId, updateNote, save])

  const persistNodes = useCallback((nodes: BrainstormNode[], extra?: Partial<BrainstormData>) => {
    persist({ ...data, nodes, ...extra })
  }, [data, persist])

  // ── Node actions ────────────────────────────────────────────────────────────

  const addNode = useCallback((wx: number, wy: number) => {
    const node: BrainstormNode = {
      id: nanoid(), title: '', type: newNodeType, x: wx, y: wy,
    }
    persist({ ...data, nodes: [...data.nodes, node] })
    setSelectedId(node.id)
  }, [data, persist, newNodeType])

  const updateNode = useCallback((id: string, patch: Partial<BrainstormNode>) => {
    const next = { ...data, nodes: data.nodes.map((n) => n.id === id ? { ...n, ...patch } : n) }
    persist(next)
  }, [data, persist])

  const deleteNode = useCallback((id: string) => {
    persist({
      ...data,
      nodes: data.nodes.filter((n) => n.id !== id),
      edges: data.edges.filter((e) => e.fromId !== id && e.toId !== id),
    })
    if (selectedId === id) setSelectedId(null)
  }, [data, persist, selectedId])

  const addEdge = useCallback((fromId: string, toId: string) => {
    if (fromId === toId) return
    if (data.edges.some((e) =>
      (e.fromId === fromId && e.toId === toId) || (e.fromId === toId && e.toId === fromId)
    )) return
    persist({ ...data, edges: [...data.edges, { id: nanoid(), fromId, toId }] })
  }, [data, persist])

  // ── Zoom ────────────────────────────────────────────────────────────────────

  const applyZoom = useCallback((newZoom: number, pivotSx: number, pivotSy: number) => {
    const clamped = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, newZoom))
    const { w, h } = containerSize
    // Keep world point under pivot fixed
    const wx = (pivotSx - data.camera.x - w / 2) / data.camera.zoom
    const wy = (pivotSy - data.camera.y - h / 2) / data.camera.zoom
    persist({
      ...data,
      camera: { zoom: clamped, x: pivotSx - wx * clamped - w / 2, y: pivotSy - wy * clamped - h / 2 },
    })
  }, [data, containerSize, persist])

  // ── Mouse handlers ──────────────────────────────────────────────────────────

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return
    const target = e.target as HTMLElement
    // Don't pan if clicking a node
    if (target.closest('[data-node]')) return
    if (connectingFrom) { setConnectingFrom(null); return }
    setSelectedId(null)
    panning.current = {
      startCamX: data.camera.x, startCamY: data.camera.y,
      startMx: e.clientX, startMy: e.clientY,
    }
  }, [data.camera, connectingFrom])

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (dragging.current) {
      const { nodeId, startWx, startWy, startMx, startMy } = dragging.current
      const dx = (e.clientX - startMx) / data.camera.zoom
      const dy = (e.clientY - startMy) / data.camera.zoom
      setData((prev) => ({
        ...prev,
        nodes: prev.nodes.map((n) => n.id === nodeId ? { ...n, x: startWx + dx, y: startWy + dy } : n),
      }))
    } else if (panning.current) {
      const { startCamX, startCamY, startMx, startMy } = panning.current
      setData((prev) => ({
        ...prev,
        camera: { ...prev.camera, x: startCamX + (e.clientX - startMx), y: startCamY + (e.clientY - startMy) },
      }))
    }
  }, [data.camera.zoom])

  const handleCanvasMouseUp = useCallback(() => {
    if (dragging.current || panning.current) {
      // Persist final state from current data ref
      setData((prev) => {
        updateNote(noteId!, { content: prev })
        save({ content: prev })
        return prev
      })
    }
    dragging.current = null
    panning.current = null
  }, [noteId, updateNote, save])

  const handleCanvasDoubleClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (target.closest('[data-node]')) return
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const { wx, wy } = screenToWorld(
      e.clientX - rect.left, e.clientY - rect.top,
      data.camera, containerSize.w, containerSize.h,
    )
    addNode(wx, wy)
  }, [data.camera, containerSize, addNode])

  // Non-passive wheel for zoom
  useEffect(() => {
    const el = containerRef.current; if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const rect = el.getBoundingClientRect()
      applyZoom(
        data.camera.zoom + (e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP),
        e.clientX - rect.left, e.clientY - rect.top,
      )
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [applyZoom, data.camera.zoom])

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA') return
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        const node = data.nodes.find((n) => n.id === selectedId)
        if (node && !node.isRoot) deleteNode(selectedId)
      }
      if (e.key === 'Escape') { setConnectingFrom(null); setSelectedId(null) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedId, data.nodes, deleteNode])

  // ── Node drag start ─────────────────────────────────────────────────────────

  const handleNodeMouseDown = useCallback((nodeId: string, e: React.MouseEvent) => {
    setSelectedId(nodeId)
    const node = data.nodes.find((n) => n.id === nodeId)
    if (!node) return
    dragging.current = { nodeId, startWx: node.x, startWy: node.y, startMx: e.clientX, startMy: e.clientY }
  }, [data.nodes])

  // ── Connect ─────────────────────────────────────────────────────────────────

  const handleCompleteConnect = useCallback((targetId: string) => {
    if (connectingFrom) addEdge(connectingFrom, targetId)
    setConnectingFrom(null)
  }, [connectingFrom, addEdge])

  // ── AI expand ───────────────────────────────────────────────────────────────

  const expandNode = useCallback(async (nodeId: string) => {
    if (!isOnline) return
    const node = data.nodes.find((n) => n.id === nodeId)
    if (!node) return
    setAiLoading(true)
    try {
      const result = await CloudAiService.expandBrainstormNode({
        node_title: node.title,
        node_type: node.type,
        canvas_context: data.nodes.map((n) => n.title).filter(Boolean).join(', '),
      })
      const count = result.ideas.length
      const radius = 230
      const newNodes: BrainstormNode[] = result.ideas.map((idea, i) => ({
        id: nanoid(),
        title: idea.title,
        type: idea.type as NodeType,
        x: node.x + Math.cos((2 * Math.PI * i) / count - Math.PI / 2) * radius,
        y: node.y + Math.sin((2 * Math.PI * i) / count - Math.PI / 2) * radius,
      }))
      const newEdges: BrainstormEdge[] = newNodes.map((n) => ({ id: nanoid(), fromId: nodeId, toId: n.id }))
      persist({ ...data, nodes: [...data.nodes, ...newNodes], edges: [...data.edges, ...newEdges] })
    } catch { /* silent */ }
    finally { setAiLoading(false) }
  }, [data, isOnline, persist])

  if (!note) return null

  const cam = data.camera
  const { w, h } = containerSize
  const selectedNode = selectedId ? data.nodes.find((n) => n.id === selectedId) ?? null : null

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      {/* Top bar */}
      <div className="shrink-0 border-b border-border px-6 py-2 flex items-center gap-3">
        <Breadcrumb note={note} />
        <div className="flex-1 max-w-xs">
          <NoteTitleInput note={note} placeholder="Brainstorm title…" />
        </div>
        {connectingFrom && (
          <div className="ml-auto flex items-center gap-2 rounded-lg bg-violet-500/10 border border-violet-500/30 px-3 py-1.5">
            <Link2 size={12} className="text-violet-500" />
            <span className="text-xs text-violet-600 dark:text-violet-400 font-medium">Click a node to connect</span>
            <button onClick={() => setConnectingFrom(null)} className="text-violet-400 hover:text-violet-600 ml-1">
              <X size={12} />
            </button>
          </div>
        )}
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="relative flex-1 overflow-hidden"
        style={{
          backgroundImage: 'radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          cursor: connectingFrom ? 'crosshair' : 'default',
        }}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseUp}
        onDoubleClick={handleCanvasDoubleClick}
      >
        {/* Floating toolbar */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-xl border border-border bg-background/90 backdrop-blur px-2 py-1.5 shadow-lg z-20">
          <button
            onClick={() => addNode(
              (Math.random() - 0.5) * 300,
              (Math.random() - 0.5) * 200,
            )}
            className="flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus size={12} /> Node
          </button>
          <div className="w-px h-4 bg-border mx-0.5" />
          {/* Node type picker */}
          {(Object.keys(NODE_TYPE_CONFIG) as NodeType[]).map((t) => (
            <button
              key={t}
              onClick={() => setNewNodeType(t)}
              title={NODE_TYPE_CONFIG[t].label}
              className={`h-6 w-6 rounded-md border text-xs transition-colors ${
                newNodeType === t ? 'border-primary bg-primary/10 scale-110' : 'border-border hover:bg-muted/60'
              }`}
            >
              {NODE_TYPE_CONFIG[t].emoji}
            </button>
          ))}
          <div className="w-px h-4 bg-border mx-0.5" />
          <button onClick={() => applyZoom(cam.zoom - ZOOM_STEP, w / 2, h / 2)} disabled={cam.zoom <= ZOOM_MIN}
            className="rounded-lg p-1 hover:bg-muted disabled:opacity-40 transition-colors">
            <ZoomOut size={13} className="text-foreground" />
          </button>
          <span className="text-[11px] text-muted-foreground w-9 text-center">{Math.round(cam.zoom * 100)}%</span>
          <button onClick={() => applyZoom(cam.zoom + ZOOM_STEP, w / 2, h / 2)} disabled={cam.zoom >= ZOOM_MAX}
            className="rounded-lg p-1 hover:bg-muted disabled:opacity-40 transition-colors">
            <ZoomIn size={13} className="text-foreground" />
          </button>
          <button onClick={() => persist({ ...data, camera: { x: 0, y: 0, zoom: 1 } })}
            className="rounded-lg p-1 hover:bg-muted transition-colors">
            <Maximize2 size={13} className="text-foreground" />
          </button>
          <div className="w-px h-4 bg-border mx-0.5" />
          <button
            onClick={() => setShowAi((v) => !v)}
            className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition-colors ${
              showAi ? 'bg-violet-500 text-white' : 'border border-border text-muted-foreground hover:bg-muted/40'
            }`}
          >
            <Sparkles size={12} /> AI
          </button>
        </div>

        {/* AI floating panel */}
        {showAi && (
          <AiPanel
            selectedNode={selectedNode}
            isOnline={isOnline}
            onExpand={expandNode}
            onClose={() => setShowAi(false)}
            loading={aiLoading}
          />
        )}

        {/* ── SVG edges ── lives at container level so overflow:hidden never clips it */}
        <svg
          style={{
            position: 'absolute',
            left: 0, top: 0,
            width: '100%', height: '100%',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        >
          <defs>
            <marker id="bs-arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
              <path d="M0,0 L0,6 L9,3 z" fill="#8b5cf6" />
            </marker>
          </defs>
          {data.edges.map((edge) => {
            const from = data.nodes.find((n) => n.id === edge.fromId)
            const to   = data.nodes.find((n) => n.id === edge.toId)
            if (!from || !to) return null
            const { sx: sx1, sy: sy1 } = worldToScreen(from.x, from.y, cam, w, h)
            const { sx: sx2, sy: sy2 } = worldToScreen(to.x, to.y, cam, w, h)
            return (
              <path
                key={edge.id}
                d={edgePathScreen(sx1, sy1, sx2, sy2, cam.zoom)}
                stroke="#8b5cf6"
                strokeWidth={2}
                strokeOpacity={0.7}
                fill="none"
                markerEnd="url(#bs-arrow)"
              />
            )
          })}
        </svg>

        {/* Transform group — world origin at center */}
        <div
          style={{
            position: 'absolute',
            left: 0, top: 0, width: 0, height: 0,
            transform: `translate(${cam.x + w / 2}px, ${cam.y + h / 2}px) scale(${cam.zoom})`,
            transformOrigin: '0 0',
            zIndex: 2,
          }}
        >
          {/* ── Nodes ── */}
          {data.nodes.map((node) => (
            <div
              key={node.id}
              style={{ position: 'absolute', left: node.x, top: node.y }}
            >
              <NodeCard
                node={node}
                selected={selectedId === node.id}
                connectingMode={!!connectingFrom}
                isConnectSource={connectingFrom === node.id}
                onMouseDown={handleNodeMouseDown}
                onStartConnect={setConnectingFrom}
                onCompleteConnect={handleCompleteConnect}
                onUpdate={updateNode}
                onDelete={deleteNode}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
