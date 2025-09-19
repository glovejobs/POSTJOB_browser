import { useState, useCallback, useRef } from 'react';
import { api } from '@/lib/api';

interface StreamEvent {
  type: 'connected' | 'content' | 'done' | 'error';
  content?: string;
  error?: string;
}

interface UseAIStreamOptions {
  onContent?: (content: string) => void;
  onComplete?: (fullContent: string) => void;
  onError?: (error: string) => void;
}

export function useAIStream(options: UseAIStreamOptions = {}) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedContent, setStreamedContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const accumulatedContentRef = useRef('');

  const startStream = useCallback(async (endpoint: string, data: any) => {
    // Reset state
    setIsStreaming(true);
    setStreamedContent('');
    setError(null);
    accumulatedContentRef.current = '';

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    try {
      // Get authentication headers
      const headers: any = {
        'Content-Type': 'application/json'
      };

      // Check for Bearer token first (Supabase Auth)
      const sessionStr = localStorage.getItem('supabase_session');
      if (sessionStr) {
        try {
          const session = JSON.parse(sessionStr);
          if (session.access_token) {
            headers['Authorization'] = `Bearer ${session.access_token}`;
          }
        } catch (e) {
          console.error('Error parsing session:', e);
        }
      }

      // Fallback to API key
      const apiKey = localStorage.getItem('api_key');
      if (apiKey && !headers['Authorization']) {
        headers['x-api-key'] = apiKey;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        try {
          const errorData = await response.json();
          console.error('AI API Error:', errorData);
          throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`);
        } catch (e) {
          throw new Error(`Request failed with status ${response.status}`);
        }
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Failed to get response stream');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data.trim()) {
              try {
                const event: StreamEvent = JSON.parse(data);

                switch (event.type) {
                  case 'content':
                    if (event.content) {
                      accumulatedContentRef.current += event.content;
                      setStreamedContent(accumulatedContentRef.current);
                      options.onContent?.(event.content);
                    }
                    break;

                  case 'done':
                    setIsStreaming(false);
                    options.onComplete?.(accumulatedContentRef.current);
                    break;

                  case 'error':
                    throw new Error(event.error || 'Stream error');

                  case 'connected':
                    console.log('Stream connected');
                    break;
                }
              } catch (e) {
                console.error('Error parsing SSE event:', e);
              }
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Stream aborted');
      } else {
        const errorMessage = err.message || 'Failed to stream content';
        setError(errorMessage);
        options.onError?.(errorMessage);
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, [options]);

  const stopStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsStreaming(false);
    }
  }, []);

  const clearContent = useCallback(() => {
    setStreamedContent('');
    accumulatedContentRef.current = '';
    setError(null);
  }, []);

  return {
    streamedContent,
    isStreaming,
    error,
    startStream,
    stopStream,
    clearContent
  };
}