import {
  SubscribeMessage,
  WebSocketGateway,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';

type Player = {
  name: string;
  socket: Socket;
};

type RoomInfo = {
  roomName: string;
  playerName1: string;
  playerName2: string;
};

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/game',
})
export class GameGateway {
  roomNum = 0;
  gameRooms = new Map<string, RoomInfo>();
  waitingQueue: Player[] = [];

  handleConnection(socket: Socket) {
    console.log('hello', socket.id);
  }

  handleDisconnect(socket: Socket) {
    console.log('bye', socket.id);

    this.gameRooms.delete(socket.id);
    this.waitingQueue = this.waitingQueue.filter(
      (n) => n.socket.id !== socket.id,
    );
  }

  @SubscribeMessage('playStart')
  joinRoom(@ConnectedSocket() socket: Socket, @MessageBody() data: string) {
    if (this.waitingQueue.length == 0) {
      this.waitingQueue.push({ name: data, socket: socket });
    } else {
      const waitingPlayer = this.waitingQueue.pop();
      const roomName = String(this.roomNum);
      this.roomNum++;

      console.log(socket.id, 'joined to room', roomName);
      console.log(waitingPlayer.socket.id, 'joined to room', roomName);

      void socket.join(roomName);
      void waitingPlayer.socket.join(roomName);

      socket.emit('playStarted', waitingPlayer.name);
      waitingPlayer.socket.emit('playStarted', data);

      const newRoom: RoomInfo = {
        roomName: roomName,
        playerName1: waitingPlayer.name,
        playerName2: data,
      };
      this.gameRooms.set(socket.id, newRoom);
      this.gameRooms.set(waitingPlayer.socket.id, newRoom);
    }
  }

  @SubscribeMessage('playScore')
  updateScore(@ConnectedSocket() socket: Socket, @MessageBody() data: string) {
    socket.to(this.gameRooms.get(socket.id).roomName).emit('playScored', data);
    socket.emit('playScored', data);
  }

  @SubscribeMessage('watchList')
  getGameRooms(@ConnectedSocket() socket: Socket) {
    // exclude duplications
    const gameRooms = Array.from(new Set(Array.from(this.gameRooms.values())));

    socket.emit('watchListed', JSON.stringify(gameRooms));
  }
}
