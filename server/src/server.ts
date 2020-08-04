import express, { Application } from 'express';
import socketIO, { Server as SocketIOServer } from 'socket.io';
import { createServer, Server as HTTPServer } from 'http';
import { nanoid } from 'nanoid';
import * as path from 'path';

import { Room, User } from '../../src/types';

export class Server {
  
  private app: Application;
  private httpServer: HTTPServer;
  private socket: SocketIOServer;
  private activeRooms: Array<Room> = [];
  private activeUsers: Array<User> = [];

  private readonly PORT = process.env.PORT || "5000";

  constructor() {
    this.initialise();
    this.setupMiddleware();
    this.handleRoutes();
    this.handleSocketConnections();
  }

  private initialise(): void {
    this.app = express();
    this.httpServer = createServer(this.app);
    this.socket = socketIO(this.httpServer);
  }

  private setupMiddleware(): void {
    this.app.use(express.static(path.join(__dirname, '../..', 'dist')));
  }
  
  private handleRoutes(): void {
    this.app.get('/create-room', (req, res) => {
      const roomId = this.createRoom();
      res.send(roomId);
    })

    this.app.get('/rooms', (req, res) => {
      res.send(this.activeRooms);
    })

    this.app.get('*', function(req, res) {
      res.sendFile(path.join(__dirname, '../..', 'dist/index.html'));
    });
  }

  private handleSocketConnections(): void {
    this.socket.on('connection', socket => {
      // Checking if the user already exists
      const existingUser = this.activeUsers.find(user => user.socketId === socket.id);
      if(existingUser) return;
      const user = {id: nanoid(), socketId: socket.id};
      this.activeUsers.push(user);
      console.log(`User connected (${user.id})`);

      socket.on('join', (data) => {
        const room: Room = this.findRoom(data.room);
        if(!room) return socket.emit('join-failed');
        
        socket.emit('join-success', user);

        this.socket.sockets.in(data.room).emit('user-joined', user);
        socket.join(data.room);
        console.log(`${user.id} connected to ${data.room}`);

      });

      socket.on('disconnect', () => {
        this.activeUsers = this.activeUsers.filter(user => user.id !== user.id);
        console.log(`User disconnected (${user.id})`);
      });

      socket.on('leave-room', (data) => {
        const roomIndex = this.activeRooms.findIndex(room => room.id === data.room);
        this.activeRooms[roomIndex]
        console.log(`${user.id} disconnected from ${data.room}`);
      });
    });
  }

  private createRoom(): string {
    const room: Room = {
      id: nanoid(),
      users: []
    };

    console.log(`Room ${room.id} created.`);
    this.activeRooms.push(room);
    this.socket.emit('new-room', room);
    return room.id
  }

  private findRoom(id: string): Room {
    return this.activeRooms.find(room => room.id == id);
  }

  private findUser(socketId: string): User {
    return this.activeUsers.find(user => user.socketId == socketId);
  }

  public listen(callback: (port: string) => void): void {
    this.httpServer.listen(this.PORT, () => callback(this.PORT));
  }

}