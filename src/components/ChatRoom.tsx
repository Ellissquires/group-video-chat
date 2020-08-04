import React, { useState, useEffect, useRef } from 'react';
import VideoStream from './VideoStream';
import { User } from '../types';
import Peer from 'peerjs';

const VIDEO_OPTIONS = { audio: false, video: { width: 1280, height: 720 } };

const ChatRoom = (props: any) => {
  const { id } = props.match.params;
  const { socket } = props;
  const [connected, setConnected] = useState(false);
  const [remoteStreams, setRemoteStreams] = useState([] as MediaStream[])
  const [localStream, setLocalStream] = useState({} as MediaStream);
  let peer: Peer;

  const handlePeerConnection = (user: User, stream: MediaStream) => {
    console.log(`${user.id} has joined the room`);
    let call = peer.call(user.id, stream);
    call.on('stream', (remoteStream) => {
      setRemoteStreams([...remoteStreams, remoteStream]);
    })
  }

  const setupLocalPeer = (user: User, stream: MediaStream) => {
    setConnected(true);
    console.log(`Setting up peer connection for ${user.id}`);
    peer = new Peer(user.id);
    peer.on('call', (call) => {
      call.answer(stream);
      call.on('stream', (remoteStream) => {
        setRemoteStreams([...remoteStreams, remoteStream]);
      });
    })

    socket.on('user-joined', (user: User) => handlePeerConnection(user, stream));
  }

  useEffect(() => {
    async function enableLocalStream() {
      const stream = await navigator.mediaDevices.getUserMedia(VIDEO_OPTIONS);
      setLocalStream(stream);
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
      { connected ? <VideoStream stream={localStream}/> : <p>Connecting...</p> }
      { remoteStreams.map(remoteStream => <VideoStream stream={remoteStream}/>)}
    </div>
  )
}

export { ChatRoom };
