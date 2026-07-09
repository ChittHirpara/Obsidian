"use client";

import { useMemo } from "react";
import { type EventRecord } from "@/lib/api";
import { useDashboardData } from "@/components/DashboardContext";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from "recharts";

const CATEGORY_COLORS: Record<string, string> = {
  order_status: "#0D9488",
  refund: "#6366F1",
  sensitive_data: "#DC2626",
  general_faq: "#16A34A",
};
const CATEGORY_LABELS: Record<string, string> = {
  order_status: "Order Status",
  refund: "Refund",
  sensitive_data: "Sensitive Data",
  general_faq: "General FAQ",
};

export default function AnalyticsPage() {
  const { events } = useDashboardData();

  const costByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    events.forEach(e => {
      map[e.category] = (map[e.category] ?? 0) + (e.audit_event.cost_total ?? 0);
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name: CATEGORY_LABELS[name] ?? name, value, rawName: name }))
      .sort((a, b) => b.value - a.value);
  }, [events]);

  const modelUsage = useMemo(() => {
    const map: Record<string, number> = {};
    events.forEach(e => {
      const model = e.audit_event.model || "unknown";
      map[model] = (map[model] ?? 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [events]);

  const MODEL_COLORS = ["#6366F1", "#0D9488", "#D97706", "#16A34A"];

  const latencyHistogram = useMemo(() => {
    const bins = [0, 500, 1000, 2000, 5000];
    const labels = ["<500ms", "0.5-1s", "1-2s", "2-5s", ">5s"];
    const counts = [0, 0, 0, 0, 0];
    
    events.forEach(e => {
      const l = e.audit_event.latency_used_ms ?? 0;
      if (l < bins[1]) counts[0]++;
      else if (l < bins[2]) counts[1]++;
      else if (l < bins[3]) counts[2]++;
      else if (l < bins[4]) counts[3]++;
      else counts[4]++;
    });

    return labels.map((name, i) => ({ name, count: counts[i] }));
  }, [events]);

  const costTrend = useMemo(() => {
    let cum = 0;
    return [...events].reverse().map((e, i) => {
      cum += e.audit_event.cost_total ?? 0;
      return { 
        index: i, 
        cost: e.audit_event.cost_total ?? 0, 
        cumulative: cum 
      };
    });
  }, [events]);


  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px", maxWidth: "1200px" }}>
        
        {/* Cost by Category */}
        <div className="card" style={{ padding: "24px" }}>
          <h3 style={{ margin: "0 0 4px", fontSize: "14px", fontWeight: 600, color: "#F3F4F6" }}>Total Cost by Category</h3>
          <p style={{ margin: "0 0 20px", fontSize: "12px", color: "#9CA3AF" }}>Cumulative spend per query type</p>
          
          <div style={{ height: "250px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={costByCategory} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <defs>
                  <filter id="barShadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000" floodOpacity="0.3" />
                  </filter>
                </defs>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.1)" />
                <XAxis type="number" tickFormatter={v => `$${v.toFixed(3)}`} stroke="#9CA3AF" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" stroke="#9CA3AF" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip 
                  formatter={(value: number) => [`$${value.toFixed(5)}`, "Cost"]}
                  contentStyle={{ background: "#1F2937", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.12)", color: "#F3F4F6", fontSize: "12px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.3)" }} itemStyle={{ color: "#F3F4F6" }}
                  cursor={{ fill: "rgba(255,255,255,0.05)" }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={16} isAnimationActive={true} animationDuration={1200} animationEasing="ease-out" style={{ filter: "url(#barShadow)" }}>
                  {costByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.rawName] ?? "#6B7280"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Model Usage */}
        <div className="card" style={{ padding: "24px", display: "flex", flexDirection: "column" }}>
          <h3 style={{ margin: "0 0 4px", fontSize: "14px", fontWeight: 600, color: "#F3F4F6" }}>Model Distribution</h3>
          <p style={{ margin: "0 0 16px", fontSize: "12px", color: "#9CA3AF" }}>Number of queries routed to each model</p>
          
          <div style={{ height: "180px", width: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={modelUsage}
                  cx="50%" cy="50%"
                  innerRadius={50} outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="rgba(255,255,255,0.12)"
                  strokeWidth={2}
                  isAnimationActive={true}
                  animationDuration={1000}
                  animationBegin={200}
                  style={{ filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.3))" }}
                >
                  {modelUsage.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={MODEL_COLORS[index % MODEL_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ background: "#1F2937", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.12)", color: "#F3F4F6", fontSize: "12px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.3)" }} itemStyle={{ color: "#F3F4F6" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "16px" }}>
            {modelUsage.map((entry, index) => {
              const total = modelUsage.reduce((sum, d) => sum + d.value, 0);
              const percent = total > 0 ? ((entry.value / total) * 100).toFixed(0) : "0";
              return (
                <div key={entry.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 10px", background: "rgba(17,24,39,0.4)", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.12)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ width: 10, height: 10, borderRadius: "50%", background: MODEL_COLORS[index % MODEL_COLORS.length], display: "inline-block", flexShrink: 0 }} />
                    <span style={{ fontSize: "12.5px", color: "#D1D5DB", fontWeight: 500 }}>{entry.name}</span>
                  </div>
                  <span className="font-mono-data" style={{ fontSize: "12.5px", color: "#F3F4F6", fontWeight: 700 }}>{percent}%</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Latency Histogram */}
        <div className="card" style={{ padding: "24px" }}>
          <h3 style={{ margin: "0 0 4px", fontSize: "14px", fontWeight: 600, color: "#F3F4F6" }}>Latency Distribution</h3>
          <p style={{ margin: "0 0 20px", fontSize: "12px", color: "#9CA3AF" }}>Response times across all queries</p>
          
          <div style={{ height: "250px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={latencyHistogram} margin={{ top: 20, right: 30, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0D9488" stopOpacity={1}/>
                    <stop offset="100%" stopColor="#0D9488" stopOpacity={0.6}/>
                  </linearGradient>
                  <filter id="latencyShadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#0D9488" floodOpacity="0.4" />
                  </filter>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="name" stroke="#9CA3AF" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis stroke="#9CA3AF" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ background: "#1F2937", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.12)", color: "#F3F4F6", fontSize: "12px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.3)" }} itemStyle={{ color: "#F3F4F6" }}
                />
                <Bar dataKey="count" fill="url(#latencyGradient)" radius={[4, 4, 0, 0]} barSize={20} name="Queries" isAnimationActive={true} animationDuration={1200} animationEasing="ease-out" style={{ filter: "url(#latencyShadow)" }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cumulative Cost Trend */}
         <div className="card" style={{ padding: "24px" }}>
          <h3 style={{ margin: "0 0 4px", fontSize: "14px", fontWeight: 600, color: "#F3F4F6" }}>Cumulative Spend</h3>
          <p style={{ margin: "0 0 20px", fontSize: "12px", color: "#9CA3AF" }}>Total cost growth over time (queries)</p>
          
          <div style={{ height: "250px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={costTrend} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                <defs>
                  <filter id="lineShadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#6366F1" floodOpacity="0.3" />
                  </filter>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="index" stroke="#9CA3AF" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={30} />
                <YAxis stroke="#9CA3AF" tick={{ fontSize: 11 }} tickFormatter={v => `$${v.toFixed(2)}`} axisLine={false} tickLine={false} />
                <Tooltip 
                  formatter={(value: number) => [`$${value.toFixed(5)}`, "Cost"]}
                  labelFormatter={(v) => `Query #${v}`}
                  contentStyle={{ background: "#1F2937", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.12)", color: "#F3F4F6", fontSize: "12px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.3)" }} itemStyle={{ color: "#F3F4F6" }}
                />
                <Line type="monotone" dataKey="cumulative" stroke="#6366F1" strokeWidth={3} style={{ filter: "url(#lineShadow)" }} dot={false} activeDot={{ r: 6, fill: "#6366F1", stroke: "#1F2937", strokeWidth: 2 }} name="Total Spend" isAnimationActive={true} animationDuration={1500} animationEasing="ease-out" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
