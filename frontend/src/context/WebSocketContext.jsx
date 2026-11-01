import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import notificationService from '../services/notificationService';

const WebSocketContext = createContext(null);

export function WebSocketProvider({ children }) {
  const { user, token, isLoggedIn } = useAuth();
  const { showToast } = useToast();

  const [connected, setConnected] = useState(false);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const stompClientRef = useRef(null);
  const notifListenersRef = useRef(new Set());
  const msgListenersRef = useRef(new Set());

  const getWsUrl = () => {
    if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL;
    const isLocal =
      window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    return isLocal
      ? 'http://localhost:8080/ws'
      : 'https://stayfinder-backend-5en8.onrender.com/ws';
  };

  const refreshUnreadCount = useCallback(async () => {
    if (!isLoggedIn) {
      setUnreadNotifCount(0);
      return;
    }
    try {
      const data = await notificationService.getUnreadCount();
      const count = typeof data === 'object' && data !== null ? data.count ?? data : data;
      setUnreadNotifCount(Number(count) || 0);
    } catch {
      // Non-critical
    }
  }, [isLoggedIn]);

  const addNotificationListener = useCallback((fn) => {
    notifListenersRef.current.add(fn);
    return () => notifListenersRef.current.delete(fn);
  }, []);

  const addMessageListener = useCallback((fn) => {
    msgListenersRef.current.add(fn);
    return () => msgListenersRef.current.delete(fn);
  }, []);

  useEffect(() => {
    if (!isLoggedIn || !user?.id || !token) {
      if (stompClientRef.current && stompClientRef.current.connected) {
        try {
          stompClientRef.current.disconnect();
        } catch {}
      }
      setConnected(false);
      setUnreadNotifCount(0);
      return;
    }

    refreshUnreadCount();

    let client = null;
    let isSubscribed = true;

    try {
      const socket = new SockJS(getWsUrl());
      client = Stomp.over(socket);
      client.debug = () => {}; // Suppress debug logs

      client.connect(
        { Authorization: `Bearer ${token}` },
        () => {
          if (!isSubscribed) return;
          stompClientRef.current = client;
          setConnected(true);

          // 1. Subscribe to personal notification queue
          client.subscribe(`/user/${user.id}/queue/notifications`, (msg) => {
            try {
              const notification = JSON.parse(msg.body);
              setUnreadNotifCount((prev) => prev + 1);

              if (notification.title) {
                showToast(`🔔 ${notification.title}`);
              }

              notifListenersRef.current.forEach((fn) => {
                try {
                  fn(notification);
                } catch (err) {
                  console.error('Notification handler error:', err);
                }
              });
            } catch (err) {
              console.warn('WS notification parse error:', err.message);
            }
          });

          // 2. Subscribe to messages queue
          client.subscribe(`/user/${user.id}/queue/messages`, (msg) => {
            try {
              const message = JSON.parse(msg.body);
              if (msgListenersRef.current.size > 0) {
                msgListenersRef.current.forEach((fn) => {
                  try {
                    fn(message);
                  } catch (err) {
                    console.error('Message handler error:', err);
                  }
                });
              } else {
                showToast(`💬 New message from ${message.senderName || 'someone'}`);
              }
            } catch (err) {
              console.warn('WS message parse error:', err.message);
            }
          });
        },
        (err) => {
          setConnected(false);
          console.warn('WebSocket connection error:', err);
        }
      );
    } catch (e) {
      console.warn('WebSocket init failed:', e.message);
    }

    return () => {
      isSubscribed = false;
      if (client && client.connected) {
        try {
          client.disconnect();
        } catch {}
      }
      setConnected(false);
    };
  }, [isLoggedIn, user?.id, token, refreshUnreadCount, showToast]);

  return (
    <WebSocketContext.Provider
      value={{
        connected,
        client: stompClientRef.current,
        unreadNotifCount,
        setUnreadNotifCount,
        refreshUnreadCount,
        addNotificationListener,
        addMessageListener,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) throw new Error('useWebSocket must be used within WebSocketProvider');
  return context;
}
