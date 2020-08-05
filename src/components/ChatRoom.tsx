import React, { useState, useEffect, useRef, useReducer } from 'react';
import VideoStream from './VideoStream';
import { User } from '../types';
import Peer from 'peerjs';
import Connection from '../utils/Connection';

// local stream video options TODO: move into component (allow user to change)
const VIDEO_OPTIONS = { audio: false, video: true};

const ChatRoom = (props: any) => {
  // get the room id from the url
  const { id } = props.match.params;
  // store a reference to the client socket
  const { socket } = props;
  // state to manage if a user is connected to the room or not
  const [ connected, setConnected ] = useState(false);
  // state to manage the local user
  const [ user, setUser ] = useState({} as User);
  // stores the local users connection to the room, contains local video stream
  const [ localConnection, setLocalConnection ] = useState({} as Connection);
  // state to manage an array of remote connections, on change will re-render the displayed 
  // remote streams
  const [ remoteConections, setRemoteConnections ] = useState([] as Connection[]);
  // declare a peerjs Peer for the local user, will allow connections to remote clients
  let peer: Peer;

  /*
    handlePeerConnection -> uses the local peer to form a MediaConnection with a 
    remote user, the local users stream is sent and the remote users stream is
    received. If the connection is successful a new remote connection is created
    and the remoteConnections are updated causing the component to re-render.
  */
  const handlePeerConnection = (user: User, stream: MediaStream) => {
    console.log(`${user.id} has joined the room`);
    let call = peer.call(user.id, stream);
    call.on('stream', (remoteStream) => {
      const conn = new Connection(remoteStream, call, user);
      setRemoteConnections(remoteConections => [...remoteConections, conn]);
    })
  }

  /*
    setupLocalPeer -> sets the local peer to listen to incoming users and 
    remote connections. if a call (remote connection) is received the local
    peer responds with the local stream and in return receives the remote users
    stream. Before listening for incoming calls a listener is defined to create
    peer connections with newly connected users.
  */
  const setupLocalPeer = (user: User, stream: MediaStream) => {
    console.log(`Setting up peer connection for ${user.id}`);
    setConnected(true);
    setUser(user);
    // when a user joins the room try and form a p2p connection with them.
    socket.on('user-joined', (user: User) => handlePeerConnection(user, stream));

    // initialise peerjs using the local user is as the peer id, this will allow
    // remote connections requests to be linked to the user who sent the
    peer = new Peer(user.id);
    // listen for incoming calls.
    peer.on('call', (call) => {
      call.answer(stream);
      call.on('stream', (remoteStream) => {
        const remoteUser: User = {id: call.peer, socketId: ""};
        const conn = new Connection(remoteStream, call, remoteUser);
        setRemoteConnections(remoteConections => [...remoteConections, conn]);
      });
    })
  }

  useEffect(() => {
    // Load the users camera feed into a local Connection object
    async function enableLocalStream() {
      const stream = await navigator.mediaDevices.getUserMedia(VIDEO_OPTIONS);
      const localConnection = new Connection(stream, null, user);
      setLocalConnection({...localConnection, stream: stream});
      return stream;
    }
    
    // Once the users stream has loaded setup socket hooks and notify the server that the client has joined the room
    enableLocalStream().then((stream) => {
      socket.on('join-success', (user: User) => setupLocalPeer(user, stream));
      socket.on('join-failed', () => console.log("Could not join the room"));
      socket.emit('join', {room: id});
    }).catch(() => console.log("Could not receive video feed"));
    
    return () => {
      socket.emit('leave', {room: id});
    }
  },[id]);

  return (
    <div className="flex flex-wrap h-screen py-3 px-5 w-full sm:px-20 sm:py-10 bg-gray-200">
      { connected ? <VideoStream user={localConnection.user} stream={localConnection.stream}/> : <p>Connecting...</p> }
      { remoteConections.map(conn => <VideoStream key={conn.user.id} user={conn.user} stream={conn.stream}/>) }
    </div>
  )
}

export { ChatRoom };
