import React, { useState, useEffect, useRef } from 'react';
import VideoStream from './VideoStream';
import { User } from '../types';
import Peer, { MediaConnection } from 'peerjs';

const VIDEO_OPTIONS = { audio: true, video: { width: 1280, height: 720 }};

type Connection = {
  stream: MediaStream;
  mediaConnection: MediaConnection;
  user: User
}

const ChatRoom = (props: any) => {
  const { id } = props.match.params;
  const { socket } = props;
  const [connected, setConnected] = useState(false);
  const [localConnection, setLocalConnection] = useState({} as Connection);
  const [remoteConections, setRemoteConnections] = useState([] as Connection[])
  let peer: Peer;

  const handlePeerConnection = (user: User, stream: MediaStream) => {
    console.log(`${user.id} has joined the room`);
    let call = peer.call(user.id, stream);
    call.on('stream', (remoteStream) => {
      const remoteConnection: Connection = {
        stream: remoteStream,
        mediaConnection: call,
        user: user
      }
      setRemoteConnections([...remoteConections, remoteConnection]);
    })
  }

  const setupLocalPeer = (user: User, stream: MediaStream) => {
    console.log(`Setting up peer connection for ${user.id}`);
    setConnected(true);
    peer = new Peer(user.id);
    peer.on('call', (call) => {
      call.answer(stream);
      call.on('stream', (remoteStream) => {
        const remoteConnection: Connection = {
          stream: remoteStream,
          mediaConnection: call,
          user: user
        }
        setRemoteConnections([...remoteConections, remoteConnection]);
      });
    })

    socket.on('user-joined', (user: User) => handlePeerConnection(user, stream));
  }

  useEffect(() => {
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

    return () => socket.emit('leave-room', {room: id});
  
  },[id]);

  return (
    <div>
      { connected ? <VideoStream stream={localConnection.stream}/> : <p>Connecting...</p> }
      { remoteConections.map(conn => <VideoStream stream={conn.stream}/>) }
    </div>
  )
}

export { ChatRoom };
