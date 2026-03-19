import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { 
  Share2, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Target,
  Search
} from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useLinkStore } from '@/store/linkStore';
import type { LinkGraph, LinkGraphNode, LinkGraphEdge } from '@/types/links';

interface GraphNode extends LinkGraphNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

export default function GraphView() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  // Node-drag state — Obsidian-style: the dragged node is pinned to the mouse;
  // connected nodes are pulled elastically by the existing spring forces.
  const draggingNodeIdRef = useRef<string | null>(null);
  // Mouse position in graph-coordinate space (updated every mousemove while dragging).
  const dragGraphPosRef = useRef({ x: 0, y: 0 });
  // Track last-click time & node to distinguish single vs double click.
  const lastClickTimeRef = useRef(0);
  const lastClickNodeRef = useRef<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const animationRef = useRef<number | undefined>(undefined);
  
  const notes = useWorkspaceStore((s) => s.notes);
  const folders = useWorkspaceStore((s) => s.folders);
  // Subscribe to the raw link/tag data so the graph re-computes whenever
  // scanNoteForLinks updates the store (generateGraph's function ref is stable).
  const links = useLinkStore((s) => s.links);
  const tags = useLinkStore((s) => s.tags);
  const tagUsages = useLinkStore((s) => s.tagUsages);
  const generateGraph = useLinkStore((s) => s.generateGraph);

  const { graph, nodes, edges } = useMemo(() => {
    const g = generateGraph(notes, folders);

    const nodeMap = new Map<string, GraphNode>();
    const centerX = (containerRef.current?.clientWidth || 800) / 2;
    const centerY = (containerRef.current?.clientHeight || 600) / 2;

    g.nodes.forEach((node, i) => {
      const angle = (i / g.nodes.length) * Math.PI * 2;
      const radius = 200;
      nodeMap.set(node.id, {
        ...node,
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
        radius: node.type === 'note' ? 8 : node.type === 'tag' ? 6 : 10,
      });
    });

    return { graph: g, nodes: nodeMap, edges: g.edges };
  // links / tags / tagUsages are the reactive triggers for graph changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notes, folders, links, tags, tagUsages]);
  
  // Filter nodes based on search
  const visibleNodes = useMemo(() => {
    const filtered = new Map(nodes);
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered.forEach((node, id) => {
        if (!node.label.toLowerCase().includes(query)) {
          filtered.delete(id);
        }
      });
    }
    
    return filtered;
  }, [nodes, searchQuery]);
  
  // Physics simulation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const animate = () => {
      // Apply forces
      const nodeArray = Array.from(nodes.values());
      
      // Repulsion between nodes
      for (let i = 0; i < nodeArray.length; i++) {
        for (let j = i + 1; j < nodeArray.length; j++) {
          const a = nodeArray[i];
          const b = nodeArray[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = 1000 / (dist * dist);
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          
          a.vx -= fx;
          a.vy -= fy;
          b.vx += fx;
          b.vy += fy;
        }
      }
      
      // Attraction along edges
      edges.forEach(edge => {
        const source = nodes.get(edge.source);
        const target = nodes.get(edge.target);
        if (!source || !target) return;
        
        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = (dist - 100) * 0.01;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        
        source.vx += fx;
        source.vy += fy;
        target.vx -= fx;
        target.vy -= fy;
      });
      
      // Center gravity
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      nodeArray.forEach(node => {
        const dx = centerX - node.x;
        const dy = centerY - node.y;
        node.vx += dx * 0.001;
        node.vy += dy * 0.001;
      });
      
      // Update positions with damping.
      // If a node is being dragged, pin it to the mouse — the spring forces
      // on its neighbours will pull them along naturally (Obsidian-style physics).
      nodeArray.forEach(node => {
        if (draggingNodeIdRef.current && node.id === draggingNodeIdRef.current) {
          // Pin dragged node exactly to the mouse; zero velocity so it doesn't drift.
          node.x = dragGraphPosRef.current.x;
          node.y = dragGraphPosRef.current.y;
          node.vx = 0;
          node.vy = 0;
        } else {
          node.vx *= 0.9;
          node.vy *= 0.9;
          node.x += node.vx;
          node.y += node.vy;
        }

        // Keep in bounds
        node.x = Math.max(node.radius, Math.min(canvas.width - node.radius, node.x));
        node.y = Math.max(node.radius, Math.min(canvas.height - node.radius, node.y));
      });
      
      // Clear and redraw
      ctx.fillStyle = '#00000000';
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      ctx.save();
      ctx.translate(offset.x, offset.y);
      ctx.scale(scale, scale);
      
      // Draw edges
      edges.forEach(edge => {
        const source = nodes.get(edge.source);
        const target = nodes.get(edge.target);
        if (!source || !target) return;
        if (!visibleNodes.has(edge.source) || !visibleNodes.has(edge.target)) return;
        
        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
        ctx.strokeStyle = edge.type === 'tag' ? '#f59e0b40' : '#3b82f640';
        ctx.lineWidth = edge.type === 'tag' ? 1 : 2;
        ctx.stroke();
      });
      
      // Draw nodes
      visibleNodes.forEach(node => {
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = node.color || (node.type === 'note' ? '#3b82f6' : node.type === 'tag' ? '#f59e0b' : '#8b5cf6');
        ctx.fill();
        
        // Highlight hovered node or the node being dragged
        if (hoveredNode?.id === node.id || draggingNodeIdRef.current === node.id) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius + 4, 0, Math.PI * 2);
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
        
        // Draw label
        ctx.fillStyle = '#374151';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(node.label.slice(0, 20), node.x, node.y + node.radius + 15);
      });
      
      ctx.restore();
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [nodes, edges, visibleNodes, scale, offset, hoveredNode]);
  
  /** Convert a viewport mouse event to graph-space coordinates. */
  const toGraphCoords = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - offset.x) / scale,
      y: (e.clientY - rect.top - offset.y) / scale,
    };
  }, [offset, scale]);

  /** Find the topmost visible node under graph-space point (x, y). */
  const nodeAtPoint = useCallback((x: number, y: number): GraphNode | null => {
    let found: GraphNode | null = null;
    visibleNodes.forEach(node => {
      const dx = x - node.x;
      const dy = y - node.y;
      if (Math.sqrt(dx * dx + dy * dy) < node.radius + 5) found = node;
    });
    return found;
  }, [visibleNodes]);

  /** Navigate to a node's destination. */
  const openNode = useCallback((node: GraphNode) => {
    if (node.type === 'note') navigate(`/dashboard/note/${node.id}`);
    else if (node.type === 'folder') navigate(`/dashboard/folder/${node.id}`);
    else navigate('/dashboard/graph');   // tag nodes → stay on graph (no separate tag page)
  }, [navigate]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const gp = toGraphCoords(e);
    const clicked = nodeAtPoint(gp.x, gp.y);

    if (clicked) {
      // Pin this node to the mouse; physics will pull its neighbours.
      draggingNodeIdRef.current = clicked.id;
      dragGraphPosRef.current = gp;
    } else {
      setIsDragging(true);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingNodeIdRef.current) {
      // Update the graph-space mouse position — the animation loop pins the
      // dragged node here every frame, letting spring forces pull neighbours.
      dragGraphPosRef.current = toGraphCoords(e);
      return;
    }

    if (isDragging) {
      setOffset(prev => ({ x: prev.x + e.movementX, y: prev.y + e.movementY }));
      return;
    }

    // Update hover highlight.
    const gp = toGraphCoords(e);
    setHoveredNode(nodeAtPoint(gp.x, gp.y));
  };

  const handleMouseUp = () => {
    draggingNodeIdRef.current = null;
    setIsDragging(false);
  };

  /** Double-click opens the node; single click just highlights. */
  const handleClick = () => {
    if (!hoveredNode) return;
    const now = Date.now();
    const isDouble =
      now - lastClickTimeRef.current < 400 &&
      lastClickNodeRef.current === hoveredNode.id;
    lastClickTimeRef.current = now;
    lastClickNodeRef.current = hoveredNode.id;
    if (isDouble) openNode(hoveredNode);
  };
  
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(s => Math.max(0.1, Math.min(3, s * delta)));
  };
  
  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Share2 className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold">Graph View</h1>
          <span className="text-sm text-muted-foreground">
            {notes.length} notes • {graph.edges.length} connections
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Find node..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-1.5 bg-background border border-input rounded text-sm w-48"
            />
          </div>
          
          <button
            onClick={() => setScale(s => Math.min(3, s * 1.2))}
            className="p-2 text-muted-foreground hover:text-foreground"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          
          <button
            onClick={() => setScale(s => Math.max(0.1, s * 0.8))}
            className="p-2 text-muted-foreground hover:text-foreground"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          
          <button
            onClick={() => { setScale(1); setOffset({ x: 0, y: 0 }); }}
            className="p-2 text-muted-foreground hover:text-foreground"
          >
            <Target className="h-4 w-4" />
          </button>
        </div>
      </div>
      

      {/* Canvas */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
        onWheel={handleWheel}
      >
        <canvas
          ref={canvasRef}
          width={containerRef.current?.clientWidth || 800}
          height={containerRef.current?.clientHeight || 600}
          className="absolute inset-0"
        />
        
        {hoveredNode && (
          <div 
            className="absolute bottom-4 left-4 bg-card border border-border rounded-lg p-3 shadow-lg pointer-events-none"
          >
            <div className="font-medium">{hoveredNode.label}</div>
            <div className="text-sm text-muted-foreground capitalize">{hoveredNode.type}</div>
            <div className="text-xs text-muted-foreground mt-1">Double-click to open · Drag to move with connections</div>
          </div>
        )}
      </div>
    </div>
  );
}
