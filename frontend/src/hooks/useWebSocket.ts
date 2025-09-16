import { useEffect, useRef, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { connectSocket } from '@/lib/socket';
import { WEBSOCKET_EVENTS } from '../../../shared/constants';

interface UseWebSocketOptions {
  autoConnect?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

export const useWebSocket = (options: UseWebSocketOptions = {}) => {
  const socketRef = useRef<Socket | null>(null);
  const { autoConnect = true, onConnect, onDisconnect, onError } = options;

  const connect = useCallback(() => {
    if (!socketRef.current) {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const apiKey = localStorage.getItem('api_key') || '';
      socketRef.current = connectSocket(apiUrl, apiKey);

      if (onConnect) {
        socketRef.current!.on(WEBSOCKET_EVENTS.CONNECT, onConnect);
      }

      if (onDisconnect) {
        socketRef.current!.on(WEBSOCKET_EVENTS.DISCONNECT, onDisconnect);
      }

      if (onError) {
        socketRef.current!.on(WEBSOCKET_EVENTS.ERROR, onError);
      }
    }

    return socketRef.current;
  }, [onConnect, onDisconnect, onError]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, []);

  const emit = useCallback((event: string, data?: any) => {
    if (socketRef.current) {
      socketRef.current.emit(event, data);
    }
  }, []);

  const on = useCallback((event: string, handler: (...args: any[]) => void) => {
    if (socketRef.current) {
      socketRef.current.on(event, handler);
    }
  }, []);

  const off = useCallback((event: string, handler?: (...args: any[]) => void) => {
    if (socketRef.current) {
      if (handler) {
        socketRef.current.off(event, handler);
      } else {
        socketRef.current.off(event);
      }
    }
  }, []);

  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    socket: socketRef.current,
    connect,
    disconnect,
    emit,
    on,
    off,
    isConnected: socketRef.current?.connected ?? false
  };
};