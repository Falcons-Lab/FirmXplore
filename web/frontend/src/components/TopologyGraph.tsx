import { useMemo, useState } from 'react'
import type { GraphData, GraphNode } from '@/types'

/**
 * 组件关联拓扑图：纯 SVG + 轻量力导向布局（无第三方依赖）。
 * 节点按 component_type 着色，边按 confidence 决定透明度；
 * 数据来自 fwagent ComponentGraphBuilder 的 correlation/component_graph.json。
 */

const TYPE_COLORS: Record<string, string> = {
  binary: '#2563eb',
  service: '#16a34a',
  config: '#d97706',
  script: '#9333ea',
  web: '#db2777',
  library: '#0891b2',
  driver: '#dc2626',
  filesystem: '#525252',
}
const FALLBACK_COLORS = ['#4f46e5', '#0d9488', '#ca8a04', '#7c3aed', '#be123c']

function colorForType(type: string, index: number): string {
  return TYPE_COLORS[type] ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length]
}

interface SimNode extends GraphNode {
  x: number
  y: number
  vx: number
  vy: number
  color: string
}

const W = 800
const H = 520
const MAX_NODES = 40

/** 简单力导向模拟：节点斥力 + 边弹簧 + 向心力，迭代固定次数保证确定性 */
function simulate(nodes: GraphNode[], edges: { source: string; target: string }[]): SimNode[] {
  // 节点过多时只保留度数最高的前 MAX_NODES 个，避免布局爆炸
  let kept = nodes
  if (nodes.length > MAX_NODES) {
    const degree = new Map<string, number>()
    for (const e of edges) {
      degree.set(e.source, (degree.get(e.source) ?? 0) + 1)
      degree.set(e.target, (degree.get(e.target) ?? 0) + 1)
    }
    kept = [...nodes]
      .sort((a, b) => (degree.get(b.id) ?? 0) - (degree.get(a.id) ?? 0) || b.confidence - a.confidence)
      .slice(0, MAX_NODES)
  }
  const keptIds = new Set(kept.map((n) => n.id))
  const keptEdges = edges.filter((e) => keptIds.has(e.source) && keptIds.has(e.target))

  const sim: SimNode[] = kept.map((n, i) => ({
    ...n,
    color: colorForType(n.type, i),
    x: W / 2 + Math.cos((i / kept.length) * Math.PI * 2) * 220 + ((i * 37) % 40) - 20,
    y: H / 2 + Math.sin((i / kept.length) * Math.PI * 2) * 150 + ((i * 53) % 30) - 15,
    vx: 0,
    vy: 0,
  }))
  const index = new Map(sim.map((n) => [n.id, n]))

  for (let iter = 0; iter < 300; iter++) {
    // 斥力（库仑）
    for (let i = 0; i < sim.length; i++) {
      for (let j = i + 1; j < sim.length; j++) {
        const a = sim[i]
        const b = sim[j]
        let dx = a.x - b.x
        let dy = a.y - b.y
        let dist = Math.sqrt(dx * dx + dy * dy) || 0.01
        if (dist > 320) continue
        const force = 2600 / (dist * dist)
        dx /= dist
        dy /= dist
        a.vx += dx * force
        a.vy += dy * force
        b.vx -= dx * force
        b.vy -= dy * force
      }
    }
    // 引力（弹簧）
    for (const e of keptEdges) {
      const a = index.get(e.source)
      const b = index.get(e.target)
      if (!a || !b) continue
      const dx = b.x - a.x
      const dy = b.y - a.y
      const dist = Math.sqrt(dx * dx + dy * dy) || 0.01
      const force = (dist - 110) * 0.012
      a.vx += (dx / dist) * force
      a.vy += (dy / dist) * force
      b.vx -= (dx / dist) * force
      b.vy -= (dy / dist) * force
    }
    // 向心力 + 阻尼 + 位移积分
    for (const n of sim) {
      n.vx += (W / 2 - n.x) * 0.004
      n.vy += (H / 2 - n.y) * 0.004
      n.vx *= 0.86
      n.vy *= 0.86
      n.x = Math.min(W - 60, Math.max(60, n.x + Math.max(-8, Math.min(8, n.vx))))
      n.y = Math.min(H - 40, Math.max(40, n.y + Math.max(-8, Math.min(8, n.vy))))
    }
  }
  return sim
}

export function TopologyGraph({ graph }: { graph: GraphData }) {
  const [hover, setHover] = useState<string | null>(null)
  const nodes = useMemo(
    () => simulate(graph.nodes, graph.edges.map((e) => ({ source: e.source, target: e.target }))),
    [graph],
  )
  const pos = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes])
  const typeLegend = useMemo(() => {
    const seen = new Map<string, string>()
    nodes.forEach((n, i) => seen.set(n.type, colorForType(n.type, i)))
    return [...seen.entries()]
  }, [nodes])
  const truncated = graph.nodes.length > nodes.length

  if (nodes.length === 0) {
    return <p className="p-4 text-sm text-muted-foreground">图中没有组件节点。</p>
  }

  const related = (nodeId: string) =>
    graph.edges.filter((e) => e.source === nodeId || e.target === nodeId)

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-3 font-mono text-xs text-txt-secondary">
        {typeLegend.map(([type, color]) => (
          <span key={type} className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5" style={{ background: color }} />
            {type}
          </span>
        ))}
        <span className="ml-auto text-txt-muted">
          {nodes.length} components · {graph.edges.length} relations
          {truncated && ' (top-connected only)'}
        </span>
      </div>

      <div className="overflow-hidden border border-brd bg-bg-console">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full select-none">
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#484f58" />
            </marker>
          </defs>

          {graph.edges.map((e) => {
            const a = pos.get(e.source)
            const b = pos.get(e.target)
            if (!a || !b) return null
            const dim = hover && e.source !== hover && e.target !== hover
            const mx = (a.x + b.x) / 2 + (b.y - a.y) * 0.08
            const my = (a.y + b.y) / 2 - (b.x - a.x) * 0.08
            return (
              <path
                key={e.id}
                d={`M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}`}
                fill="none"
                stroke={e.static_or_dynamic === 'dynamic' ? '#00ff41' : '#484f58'}
                strokeWidth={hover && (e.source === hover || e.target === hover) ? 2 : 1}
                strokeDasharray={e.static_or_dynamic === 'dynamic' ? '6 3' : undefined}
                strokeOpacity={dim ? 0.1 : 0.35 + e.confidence * 0.5}
                markerEnd="url(#arrow)"
              />
            )
          })}

          {nodes.map((n) => {
            const dim = hover && hover !== n.id && !related(n.id).some((e) => e.source === hover || e.target === hover)
            return (
              <g
                key={n.id}
                opacity={dim ? 0.2 : 1}
                onMouseEnter={() => setHover(n.id)}
                onMouseLeave={() => setHover(null)}
                className="cursor-pointer"
              >
                <circle cx={n.x} cy={n.y} r={13 + n.confidence * 6} fill={n.color} fillOpacity={0.85} stroke="#0d0d0d" strokeWidth={1} />
                <text x={n.x} y={n.y + 26} textAnchor="middle" fontSize={10} fill="#8b949e">
                  {n.name.length > 22 ? `${n.name.slice(0, 20)}…` : n.name}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      {/* 悬停详情：节点与出边信息 */}
      {hover && (() => {
        const node = nodes.find((n) => n.id === hover)
        if (!node) return null
        return (
          <div className="border border-brd bg-bg-secondary p-3 font-mono text-xs">
            <div className="text-txt-primary">
              {node.name} <span className="ml-1 text-txt-muted">({node.type})</span>
            </div>
            {node.path && <div className="mt-0.5 text-txt-muted">{node.path}</div>}
            <div className="mt-1 text-txt-secondary">confidence {(node.confidence * 100).toFixed(0)}%</div>
            {related(node.id).length > 0 && (
              <ul className="mt-1.5 space-y-0.5">
                {related(node.id).slice(0, 8).map((e) => {
                  const other = pos.get(e.source === node.id ? e.target : e.source)
                  return (
                    <li key={e.id} className="text-txt-secondary">
                      {e.type} → {other?.name ?? '?'} ({(e.confidence * 100).toFixed(0)}%,
                      {e.static_or_dynamic === 'dynamic' ? ' dynamic' : ' static'})
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        )
      })()}
    </div>
  )
}
