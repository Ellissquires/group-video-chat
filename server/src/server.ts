import express, { Application } from 'express';
import socketIO, { Server as SocketIOServer } from 'socket.io';
import { createServer, Server as HTTPServer } from 'http';
import { nanoid } from 'nanoid';
import * as path from 'path';

import { Room, User } from '../../src/types';

/*
  Express server wrapper which manages connections to video chat rooms
*/
export class Server {
  
  private app: Application;
  private httpServer: HTTPServer;
  private socket: SocketIOServer;
  private activeRooms: Array<Room> = [];
  private activeUsers: Array<User> = [];

  // If the process port is not available use 5000 as a default
  private readonly PORT = process.env.PORT || "5000";

  constructor() {
    this.initialise();
    this.setupMiddleware();
    this.handleRoutes();
    // Listen for client socket messages
    this.handleSocketConnections();
  }

  /*
    Initialise the http server and Websocket
  */
  private initialise(): void {
    this.app = express();
    this.httpServer = createServer(this.app);
    this.socket = socketIO(this.httpServer);
  }

  /*
    Setup express middleware
  */
  private setupMiddleware(): void {
    // tell express to statically load from the react client build directory
    this.app.use(express.static(path.join(__dirname, '../..', 'dist')));
  }
  
  /*
    Setup Express routing, the client uses react routing so only api end points are
    defined here
  */
  private handleRoutes(): void {
    // Creates and a new room and sends the newly created route back to the client
    this.app.get('/create-room', (req, res) => {
      const roomId = this.createRoom();
      res.send(roomId);
    })

    // Returns the currently active rooms
    this.app.get('/rooms', (req, res) => {
      res.send(this.activeRooms);
    })

    // All non-endpoint calls should be handle by the react router
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
      // Handling room connections
      socket.on('join', (data) => {
        // find the room the user connected to
        let room: Room = this.findRoom(data.room);
        // if the room doesnt exist create the room
        if(!room) room = this.findRoom(this.createRoom());
        // if the room exists notify the client they have successfully joined
        socket.emit('join-success', user);
        // notify the rooms users that a new user has joined
        this.socket.sockets.in(data.room).emit('user-joined', user);
        // connect the users socket to the joined room
        socket.join(data.room);
        // add the user to room
        room.users.push(user);
        console.log(`${user.id} connected to ${data.room}`);
      });

      // Handling socket disconnections
      socket.on('disconnect', () => {
        // Remove the user from the active users
        this.activeUsers = this.activeUsers.filter(user => user.id !== user.id);
        // this is scuffed
        const joinedRooms = this.activeRooms.filter(room => room.users.includes(user));
        joinedRooms.forEach(room => {
          socket.leave(room.id);
          this.socket.sockets.in(room.id).emit('user-left', user);
          console.log(`${user.id} disconnected from ${room.id}`);
        });
        console.log(`User disconnected (${user.id})`);
      });

      socket.on('leave', (data) => {
        const { room , user } = data;
        socket.leave(room);
        this.socket.sockets.in(room).emit('user-left', user);
        console.log(`${user.id} disconnected from ${data.room}`);
      });
    });
  }

  /*
    Creates a new room with a generated id and no users
  */
  private createRoom(): string {
    const room: Room = {
      id: nanoid(),
      users: []
    };

    console.log(`Room ${room.id} created.`);
    this.activeRooms.push(room);
    // Tell the client a new room has been created (updates room lists)
    this.socket.emit('new-room', room);
    return room.id
  }

  /* finds a room given the room id */
  private findRoom(id: string): Room {
    return this.activeRooms.find(room => room.id == id);
  }

  /* finds a user given a socket id */
  private findUser(socketId: string): User {
    return this.activeUsers.find(user => user.socketId == socketId);
  }

  /* starts the server and runs the supplied user callback */
  public listen(callback: (port: string) => void): void {
    this.httpServer.listen(this.PORT, () => callback(this.PORT));
  }

}