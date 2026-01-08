"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const WS_URL = API_URL.replace(/^http/, "ws");

export type WebSocketStatus =
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

export interface ExecutionEvent {
  type: string;
  execution_id?: string;
  timestamp?: number;
  message?: string;
  [key: string]: any;
}

interface UseWebSocketOptions {
  onMessage?: (event: ExecutionEvent) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
  autoReconnect?: boolean;
  reconnectAttempts?: number;
  reconnectInterval?: number;
}

export function useExecutionWebSocket(
  executionId: string | null,
  options: UseWebSocketOptions = {}
) {
  const {
    onMessage,
    onOpen,
    onClose,
    onError,
    autoReconnect = true,
    reconnectAttempts = 5,
    reconnectInterval = 3000,
  } = options;

  const [status, setStatus] = useState<WebSocketStatus>("disconnected");
  const [events, setEvents] = useState<ExecutionEvent[]>([]);
  const [lastEvent, setLastEvent] = useState<ExecutionEvent | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectCountRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (!executionId) return;

    const token = localStorage.getItem("access_token");
    if (!token) {
      console.error("No access token found");
      setStatus("error");
      return;
    }

    // Close existing connection
    if (wsRef.current) {
      wsRef.current.close();
    }

    setStatus("connecting");

    const wsUrl = `${WS_URL}/api/v1/ws/executions/${executionId}?token=${token}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setStatus("connected");
      reconnectCountRef.current = 0;
      onOpen?.();
    };

    ws.onmessage = (event) => {
      try {
        const data: ExecutionEvent = JSON.parse(event.data);
        setEvents((prev) => [...prev, data]);
        setLastEvent(data);
        onMessage?.(data);
      } catch (e) {
        console.error("Failed to parse WebSocket message:", e);
      }
    };

    ws.onclose = () => {
      setStatus("disconnected");
      onClose?.();

      // Auto reconnect
      if (
        autoReconnect &&
        reconnectCountRef.current < reconnectAttempts
      ) {
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectCountRef.current++;
          connect();
        }, reconnectInterval);
      }
    };

    ws.onerror = (error) => {
      setStatus("error");
      onError?.(error);
    };

    wsRef.current = ws;
  }, [
    executionId,
    onMessage,
    onOpen,
    onClose,
    onError,
    autoReconnect,
    reconnectAttempts,
    reconnectInterval,
  ]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setStatus("disconnected");
  }, []);

  const clearEvents = useCallback(() => {
    setEvents([]);
    setLastEvent(null);
  }, []);

  useEffect(() => {
    if (executionId) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [executionId, connect, disconnect]);

  return {
    status,
    events,
    lastEvent,
    connect,
    disconnect,
    clearEvents,
  };
}

export function useCrewWebSocket(crewId: string | null) {
  const [status, setStatus] = useState<WebSocketStatus>("disconnected");
  const [events, setEvents] = useState<ExecutionEvent[]>([]);
  const [executionId, setExecutionId] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);

  const connect = useCallback(() => {
    if (!crewId) return;

    const token = localStorage.getItem("access_token");
    if (!token) {
      console.error("No access token found");
      setStatus("error");
      return;
    }

    if (wsRef.current) {
      wsRef.current.close();
    }

    setStatus("connecting");
    setEvents([]);

    const wsUrl = `${WS_URL}/api/v1/ws/crews/${crewId}/stream?token=${token}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setStatus("connected");
    };

    ws.onmessage = (event) => {
      try {
        const data: ExecutionEvent = JSON.parse(event.data);
        setEvents((prev) => [...prev, data]);

        if (data.type === "execution_created" && data.execution_id) {
          setExecutionId(data.execution_id);
        }
      } catch (e) {
        console.error("Failed to parse WebSocket message:", e);
      }
    };

    ws.onclose = () => {
      setStatus("disconnected");
    };

    ws.onerror = () => {
      setStatus("error");
    };

    wsRef.current = ws;
  }, [crewId]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setStatus("disconnected");
  }, []);

  const kickoff = useCallback(
    (inputs: Record<string, any> = {}) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: "kickoff",
            inputs,
          })
        );
      }
    },
    []
  );

  const cancel = useCallback(() => {
    if (
      wsRef.current &&
      wsRef.current.readyState === WebSocket.OPEN &&
      executionId
    ) {
      wsRef.current.send(
        JSON.stringify({
          type: "cancel",
          execution_id: executionId,
        })
      );
    }
  }, [executionId]);

  const submitFeedback = useCallback(
    (feedback: Record<string, any>) => {
      if (
        wsRef.current &&
        wsRef.current.readyState === WebSocket.OPEN &&
        executionId
      ) {
        wsRef.current.send(
          JSON.stringify({
            type: "human_feedback",
            execution_id: executionId,
            feedback,
          })
        );
      }
    },
    [executionId]
  );

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    status,
    events,
    executionId,
    connect,
    disconnect,
    kickoff,
    cancel,
    submitFeedback,
  };
}
