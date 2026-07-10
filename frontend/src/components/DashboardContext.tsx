"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { getEvents, getInsights, type EventRecord, type Insights } from "@/lib/api";

interface DashboardContextType {
  events: EventRecord[];
  insights: Insights | null;
  refreshData: () => Promise<void>;
  isLoading: boolean;
}

const defaultContext: DashboardContextType = {
  events: [],
  insights: null,
  refreshData: async () => {},
  isLoading: true,
};

const DashboardContext = createContext<DashboardContextType>(defaultContext);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = async () => {
    try {
      const [ev, ins] = await Promise.all([getEvents(), getInsights()]);
      setEvents([...ev.events].sort((a, b) => b.timestamp_ms - a.timestamp_ms));
      setInsights(ins);
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    pollingRef.current = setInterval(fetchData, 2000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  return (
    <DashboardContext.Provider value={{ events, insights, refreshData: fetchData, isLoading }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboardData() {
  return useContext(DashboardContext);
}
