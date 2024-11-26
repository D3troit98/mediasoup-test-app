/* eslint-disable @typescript-eslint/no-explicit-any */
//client
import { io, Socket } from 'socket.io-client';
import * as mediasoupClient from 'mediasoup-client';

class SocketService {
  private socket: Socket;
  private device: mediasoupClient.Device | null = null;

  // Initialize socket with auth credentials
  initializeSocket(userId: string, token: string) {
    if (this.socket) {
      console.log('this.socket', this.socket);
      this.socket.disconnect();
    }

    this.socket = io('https://deploy-mester.vercel.app', {
      path: '/socket.io/',
      transports: ['websocket', 'polling'],
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      autoConnect: false,

      secure: true,
      rejectUnauthorized: false,
      auth: {
        userId,
        token,
      },
      // Add timeout and reconnection settings
      // timeout: 5000
    });

    // More comprehensive error handling
    this.socket.on('connect_error', (error) => {
      console.error('Socket Connection Error:', error);
      console.log('Error Details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
    });

    this.socket.on('connect_failed', (error) => {
      console.error('Socket Connection Failed:', error);
    });
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket.connect();
      this.socket.once('connect', () => resolve());
      this.socket.once('connect_error', (error) => reject(error));
    });
  }

  async loadDevice(): Promise<void> {
    console.log(this.device);
    if (!this.device) {
      console.log('no device');
      this.device = new mediasoupClient.Device();

      const routerRtpCapabilities = await this.getRouterRtpCapabilities();
      console.log(
        'routerRtpCapabilities: ',
        routerRtpCapabilities.rtpCapabilities
      );
      const hasVideoCodec = routerRtpCapabilities.rtpCapabilities.codecs.some(
        (codec) => codec.kind === 'video'
      );
      if (!hasVideoCodec) {
        console.error('No video codec found in routerRtpCapabilities');
        return;
      }

      await this.device.load({
        routerRtpCapabilities: routerRtpCapabilities.rtpCapabilities,
      });
    }
  }

  async getRouterRtpCapabilities(): Promise<mediasoupClient.types.RtpCapabilities> {
    return this.sendRequest('getRtpCapabilities');
  }

  async createSendTransport(
    roomId: string
  ): Promise<mediasoupClient.Transport> {
    if (!this.device) {
      throw new Error('Device not loaded');
    }
    console.log('sending transport: ');
    const transportInfo = await this.sendRequest('createWebRtcTransport', {
      roomId,
      consuming: false,
    });
    console.log('transportInfo params', transportInfo);
    if (!transportInfo || !transportInfo.params || !transportInfo.params.id) {
      throw new Error('Invalid transport info received from server');
    }

    return this.device.createSendTransport({
      id: transportInfo.params.id,
      iceParameters: transportInfo.params.iceParameters,
      iceCandidates: transportInfo.params.iceCandidates,
      dtlsParameters: transportInfo.params.dtlsParameters,
      // You might need to add these properties if they're required by your mediasoup-client version
      // sctpParameters: transportInfo.params.sctpParameters,
      // iceServers: [], // Add TURN servers if needed
      // proprietaryConstraints: {},
      // additionalSettings: {},
      iceServers: [],
      proprietaryConstraints: transportInfo.proprietaryConstraints,
      appData: { roomId },
    });
  }

  async createRecvTransport(
    roomId: string
  ): Promise<mediasoupClient.Transport> {
    if (!this.device) {
      throw new Error('Device not loaded');
    }
    const transportInfo = await this.sendRequest('createWebRtcTransport', {
      roomId,
      consuming: true,
    });
    console.log('reciever transport info', transportInfo);
    return this.device.createRecvTransport({
      id: transportInfo.params.id,
      iceParameters: transportInfo.params.iceParameters,
      iceCandidates: transportInfo.params.iceCandidates,
      dtlsParameters: transportInfo.params.dtlsParameters,
      iceServers: [],
      appData: { roomId },
    });
  }

  sendRequest(type: string, data = {}): Promise<any> {
    return new Promise((resolve, reject) => {
      console.log(`Sending ${type} request with data:`, data);
      if (!this.socket.connected) {
        console.error('Socket is not connected');
        reject(new Error('Socket is not connected'));
        return;
      }
      this.socket.emit(type, data, (response: any) => {
        console.log(`Received response for ${type}:`, response);
        if (response.error) {
          console.error(`Error in ${type} response:`, response.error);
          reject(new Error(response.error));
        } else {
          resolve(response);
        }
      });
    });
  }

  on(event: string, callback: (...args: any[]) => void): void {
    this.socket.on(event, callback);
  }

  emit(event: string, data?: any, callback?: (response: any) => void): void {
    if (callback) {
      this.socket.emit(event, data, callback);
    } else {
      this.socket.emit(event, data);
    }
  }

  removeListener(event: string, callback: (...args: any[]) => void): void {
    this.socket.off(event, callback);
  }
  removeAllListeners(): void {
    this.socket.removeAllListeners();
  }
  getCustomSocket() {
    return this.socket;
  }

  disconnect(): void {
    this.socket.disconnect();
  }
}

export default new SocketService();
