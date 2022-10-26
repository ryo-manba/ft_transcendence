import { io, Socket } from 'socket.io-client';

class ClientSocket {
  public socket: Socket | null;
  private url: string;

  constructor(url: string) {
    this.socket = null;
    this.url = url;
  }

  connect() {
    this.socket = io(this.url);
    this.socket.on('connect', () => {
      console.log('connect success!!');
    });
    this.socket.on('connect_error', () => {
      console.log('connect failure!!');
    });
  }
}

export { ClientSocket };
