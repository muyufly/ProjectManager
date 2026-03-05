import React, { useEffect, useRef } from 'react';
import * as d3Base from 'd3';
import type { Task } from '../types';

const d3 = d3Base as any;

interface DependencyGraphProps {
  tasks: Task[];
  onNodeClick: (taskId: number) => void;
}

export const DependencyGraph: React.FC<DependencyGraphProps> = ({ tasks, onNodeClick }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || tasks.length === 0) return;

    const width = 800;
    const height = 400;

    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr("viewBox", [0, 0, width, height])
      .attr("width", "100%")
      .attr("height", "100%")
      .style("background-color", "#f8fafc")
      .style("border-radius", "0.5rem");

    const nodes = tasks.map(t => ({ id: t.id, title: t.title, status: t.status }));
    const links: { source: number; target: number }[] = [];

    tasks.forEach(task => {
      task.dependencies.forEach(depId => {
        if (tasks.find(t => t.id === depId)) {
          links.push({ source: depId, target: task.id });
        }
      });
    });

    const simulation = d3.forceSimulation(nodes as any)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2));

    svg.append("defs").selectAll("marker")
      .data(["end"])
      .enter().append("marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 25)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#94a3b8");

    const link = svg.append("g")
      .attr("stroke", "#94a3b8")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", 2)
      .attr("marker-end", "url(#arrow)");

    const node = svg.append("g")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("r", 15)
      .attr("fill", (d: any) => {
        if (d.status === 'DONE') return '#10b981';
        if (d.status === 'IN_PROGRESS') return '#3b82f6';
        return '#cbd5e1';
      })
      .call(drag(simulation) as any)
      .on("click", (event: any, d: any) => onNodeClick((d as any).id));

    const label = svg.append("g")
      .attr("class", "labels")
      .selectAll("text")
      .data(nodes)
      .enter()
      .append("text")
      .attr("dx", 20)
      .attr("dy", 5)
      .text((d: any) => d.title.length > 15 ? d.title.substring(0, 15) + '...' : d.title)
      .style("font-size", "12px")
      .style("fill", "#334155")
      .style("pointer-events", "none");

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node
        .attr("cx", (d: any) => d.x)
        .attr("cy", (d: any) => d.y);

      label
        .attr("x", (d: any) => d.x)
        .attr("y", (d: any) => d.y);
    });

    function drag(simulation: any) {
      function dragstarted(event: any) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }

      function dragged(event: any) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }

      function dragended(event: any) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }

      return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
    }

    return () => {
      simulation.stop();
    };
  }, [tasks]);

  return (
    <div className="w-full h-[400px] border border-slate-200 rounded-lg overflow-hidden relative">
      <div className="absolute top-2 left-2 bg-white/80 p-2 rounded text-xs text-slate-500 pointer-events-none">
        Dependency Graph (Drag nodes to rearrange)
      </div>
      <svg ref={svgRef}></svg>
    </div>
  );
};