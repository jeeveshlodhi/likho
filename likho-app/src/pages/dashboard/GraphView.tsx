import { useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { 
  Share2, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Target,
  Settings,
  Filter,
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
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showTags, setShowTags] = useState(true);
  const [showFolders, setShowFolders] = useState(true);
  const animationRef = useRef<number | undefined>(undefined);
  
  const notes = useWorkspaceStore((s) => s.notes);
  const folders = useWorkspaceStore((s) => s.folders);
  const generateGraph = useLinkStore((s) => s.generateGraph);
  
  const { graph, nodes, edges } = useMemo(() => {
    const g = generateGraph(notes, folders);
    
    // Initialize node positions randomly
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
  }, [notes, folders, generateGraph]);
  
  // Filter nodes based on search and settings
  const visibleNodes = useMemo(() => {
    const filtered = new Map(nodes);
    
    if (!showTags) {
      filtered.forEach((node, id) => {
        if (node.type === 'tag') filtered.delete(id);
      });
    }
    
    if (!showFolders) {
      filtered.forEach((node, id) => {
        if (node.type === 'folder') filtered.delete(id);
      });
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered.forEach((node, id) => {
        if (!node.label.toLowerCase().includes(query)) {
          filtered.delete(id);
        }
      });
    }
    
    return filtered;
  }, [nodes, showTags, showFolders, searchQuery]);
  
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
      
      // Update positions with damping
      nodeArray.forEach(node => {
        node.vx *= 0.9;
        node.vy *= 0.9;
        node.x += node.vx;
        node.y += node.vy;
        
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
        
        // Highlight hovered node
        if (hoveredNode?.id === node.id) {
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
  
  // Handle mouse interactions
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setOffset({
        x: offset.x + e.movementX,
        y: offset.y + e.movementY,
      });
      return;
    }
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - offset.x) / scale;
    const y = (e.clientY - rect.top - offset.y) / scale;
    
    // Find hovered node
    let found = null;
    visibleNodes.forEach(node => {
      const dx = x - node.x;
      const dy = y - node.y;
      if (Math.sqrt(dx * dx + dy * dy) < node.radius + 5) {
        found = node;
      }
    });
    setHoveredNode(found);
  };
  
  const handleClick = () => {
    if (!hoveredNode) return;
    
    if (hoveredNode.type === 'note') {
      navigate(`/dashboard/note/${hoveredNode.id}`);
    } else if (hoveredNode.type === 'folder') {
      navigate(`/dashboard/folder/${hoveredNode.id}`);
    } else if (hoveredNode.type === 'tag') {
      const tagId = hoveredNode.id.replace('tag:', '');
      navigate(`/dashboard/tag-manager`);
    }
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
      
      {/* Controls */}
      <div className="absolute top-16 left-4 z-10 bg-card border border-border rounded-lg p-3 shadow-lg">
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showTags}
              onChange={(e) => setShowTags(e.target.checked)}
              className="rounded"
            />
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-yellow-500" />
              Tags
            </span>
          </label>
          
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showFolders}
              onChange={(e) => setShowFolders(e.target.checked)}
              className="rounded"
            />
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              Folders
            </span>
          </label>
        </div>
      </div>
      
      {/* Canvas */}
      <div 
        ref={containerRef}
        className="flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing"
        onMouseDown={() => setIsDragging(true)}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
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
            <div className="text-xs text-muted-foreground mt-1">Click to open</div>
          </div>
        )}
      </div>
    </div>
  );
}
