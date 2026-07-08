"use client";

import { useState, useEffect, useMemo } from "react";
import { getEvents, type EventRecord } from "@/lib/api";
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
  const [events, setEvents] = useState<EventRecord[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getEvents();
        setEvents(res.events);
      } catch {}
    };
    fetchData();
    const t = setInterval(fetchData, 4000);
    return () => clearInterval(t);
  }, []);

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
      
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "24px" }}>
        
        {/* Cost by Category */}
        <div className="card" style={{ padding: "24px" }}>
          <h3 style={{ margin: "0 0 4px", fontSize: "14px", fontWeight: 600 }}>Total Cost by Category</h3>
          <p style={{ margin: "0 0 20px", fontSize: "12px", color: "#6B7280" }}>Cumulative spend per query type</p>
          
          <div style={{ height: "250px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={costByCategory} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E3E8E6" />
                <XAxis type="number" tickFormatter={v => `$${v.toFixed(3)}`} stroke="#6B7280" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" stroke="#6B7280" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip 
                  formatter={(value: number) => [`$${value.toFixed(5)}`, "Cost"]}
                  contentStyle={{ borderRadius: "8px", border: "1px solid #E3E8E6", fontSize: "12px" }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {costByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.rawName] ?? "#6B7280"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Model Usage */}
        <div className="card" style={{ padding: "24px" }}>
          <h3 style={{ margin: "0 0 4px", fontSize: "14px", fontWeight: 600 }}>Model Distribution</h3>
          <p style={{ margin: "0 0 20px", fontSize: "12px", color: "#6B7280" }}>Number of queries routed to each model</p>
          
          <div style={{ height: "250px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={modelUsage}
                  cx="50%" cy="50%"
                  innerRadius={60} outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {modelUsage.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={MODEL_COLORS[index % MODEL_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: "8px", border: "1px solid #E3E8E6", fontSize: "12px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Latency Histogram */}
        <div className="card" style={{ padding: "24px" }}>
          <h3 style={{ margin: "0 0 4px", fontSize: "14px", fontWeight: 600 }}>Latency Distribution</h3>
          <p style={{ margin: "0 0 20px", fontSize: "12px", color: "#6B7280" }}>Response times across all queries</p>
          
          <div style={{ height: "250px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={latencyHistogram} margin={{ top: 20, right: 30, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E3E8E6" />
                <XAxis dataKey="name" stroke="#6B7280" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis stroke="#6B7280" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: '#F7F9F8' }}
                  contentStyle={{ borderRadius: "8px", border: "1px solid #E3E8E6", fontSize: "12px" }}
                />
                <Bar dataKey="count" fill="#0D9488" radius={[4, 4, 0, 0]} name="Queries" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cumulative Cost Trend */}
         <div className="card" style={{ padding: "24px" }}>
          <h3 style={{ margin: "0 0 4px", fontSize: "14px", fontWeight: 600 }}>Cumulative Spend</h3>
          <p style={{ margin: "0 0 20px", fontSize: "12px", color: "#6B7280" }}>Total cost growth over time (queries)</p>
          
          <div style={{ height: "250px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={costTrend} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E3E8E6" />
                <XAxis dataKey="index" stroke="#6B7280" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={30} />
                <YAxis stroke="#6B7280" tick={{ fontSize: 11 }} tickFormatter={v => `$${v.toFixed(2)}`} axisLine={false} tickLine={false} />
                <Tooltip 
                  formatter={(value: number) => [`$${value.toFixed(5)}`, "Cost"]}
                  labelFormatter={(v) => `Query #${v}`}
                  contentStyle={{ borderRadius: "8px", border: "1px solid #E3E8E6", fontSize: "12px" }}
                />
                <Line type="monotone" dataKey="cumulative" stroke="#6366F1" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: "#6366F1", stroke: "#fff", strokeWidth: 2 }} name="Total Spend" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
