import React, { useState, useEffect, useRef, useReducer } from 'react';
import VideoStream from './VideoStream';
import { User } from '../types';
import Peer, { MediaConnection } from 'peerjs';

const VIDEO_OPTIONS = { audio: false, video: true};

type Connection = {
  stream: MediaStream;
  mediaConnection: MediaConnection;
  user: User
}

const ChatRoom = (props: any) => {
  const { id } = props.match.params;
  const { socket } = props;
  const [connected, setConnected] = useState(false);
  const [ user, setUser ] = useState({} as User);
  const [localConnection, setLocalConnection] = useState({} as Connection);
  const [remoteConections, setRemoteConnections] = useState([] as Connection[])
  let peer: Peer;

  const openRemoteConnection = (stream: MediaStream, call: MediaConnection, user: User) => {
    const remoteConnection: Connection = {
      stream: stream,
      mediaConnection: call,
      user: user
    }
    setRemoteConnections(remoteConections => [...remoteConections, remoteConnection]);
  }

  const closeRemoteConnection = (call: MediaConnection) => {
    console.log(`${call.peer} closed the connection`);
    setRemoteConnections(remoteConections.filter(conn => conn.user.id !== call.peer));
  }

  const handlePeerConnection = (user: User, stream: MediaStream) => {
    if(remoteConections.find(conn => conn.user.id === user.id)) return
    console.log(`${user.id} has joined the room`);
    let call = peer.call(user.id, stream);
    call.on('stream', (remoteStream) => {
      openRemoteConnection(remoteStream, call, user);
    })

    call.on('error', () => closeRemoteConnection(call));
  }

  const setupLocalPeer = (user: User, stream: MediaStream) => {
    if(remoteConections.find(conn => conn.user.id === user.id)) return
    setUser(user);
    console.log(`Setting up peer connection for ${user.id}`);
    setConnected(true);
    peer = new Peer(user.id);
    peer.on('call', (call) => {
      call.answer(stream);
      call.on('stream', (remoteStream) => {
        openRemoteConnection(remoteStream, call, user);
      });

      call.on('error', () => closeRemoteConnection(call));
    })
    
    socket.on('user-joined', (user: User) => handlePeerConnection(user, stream));
  }

  useEffect(() => {
    console.log("In useEffect");
    async function enableLocalStream() {
      const stream = await navigator.mediaDevices.getUserMedia(VIDEO_OPTIONS);
      setLocalConnection({...localConnection, stream: stream});
      return stream;
    }
    
    enableLocalStream().then((stream) => {
      socket.emit('join', {room: id});
      socket.on('join-success', (user: User) => setupLocalPeer(user, stream));
      socket.on('join-failed', () => console.log("Could not join the room"));
    }).catch(() => console.log("Could not receive video feed"));


    return () => {
      remoteConections.forEach(conn => conn.mediaConnection.close());
      socket.emit('leave-room', {room: id});
      socket.off('join-success');
      socket.off('join-failed');
      socket.off('user-joined');
    }
  
  },[]);

  return (
    <div className="flex flex-wrap h-full w-full px-20 py-10 bg-gray-200">
      { connected ? <VideoStream user={user} stream={localConnection.stream}/> : <p>Connecting...</p> }
      { remoteConections.map(conn => <VideoStream key={conn.user.id} user={conn.user} stream={conn.stream}/>) }
    </div>
  )
}

export { ChatRoom };
