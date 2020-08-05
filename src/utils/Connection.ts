import { MediaConnection } from "peerjs";
import { User } from "../types";

class Connection {
  stream: MediaStream;
  mediaConnection: MediaConnection;
  user: User;

  constructor(stream: MediaStream, mediaConnection: MediaConnection, user: User) {
    this.stream = stream;
    this.mediaConnection = mediaConnection;
    this.user = user;
  }


}

export default Connection;