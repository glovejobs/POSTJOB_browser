import { io, Socket } from 'socket.io-client';
import { JobStatusUpdate } from '../../../shared/types';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const connectSocket = (apiUrl: string, apiKey: string): Socket => {
  const socket = io(apiUrl, {
    auth: {
      apiKey,
    },
    transports: ['websocket'],
  });
  return socket;
};

export class JobSocketClient {
  private socket: Socket | null = null;
  private jobId: string | null = null;
  
  connect() {
    if (this.socket?.connected) {
      return;
    }
    
    this.socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true
    });
    
    this.socket.on('connect', () => {
      console.log('Connected to WebSocket');
      
      // Re-subscribe to job if we had one
      if (this.jobId) {
        this.subscribeToJob(this.jobId);
      }
    });
    
    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket');
    });
  }
  
  subscribeToJob(jobId: string) {
    if (!this.socket?.connected) {
      this.connect();
    }
    
    this.jobId = jobId;
    this.socket?.emit('subscribe-job', jobId);
  }
  
  unsubscribeFromJob(jobId: string) {
    this.socket?.emit('unsubscribe-job', jobId);
    if (this.jobId === jobId) {
      this.jobId = null;
    }
  }
  
  onJobUpdate(callback: (update: JobStatusUpdate) => void) {
    this.socket?.on('job-update', callback);
  }
  
  onJobComplete(callback: (data: {
    job_id: string;
    overall_status: string;
    success_count: number;
    total_count: number;
  }) => void) {
    this.socket?.on('job-complete', callback);
  }
  
  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
    this.jobId = null;
  }
}