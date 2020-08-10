import React, { useState, useEffect } from 'react';
import { Room } from '../types';
import { Link } from 'react-router-dom';
import axios from 'axios';

const RoomList = (props: any) => {
  const { socket } = props;
  const [rooms, setRooms] = useState([] as Room[]);

  useEffect(() => {
    let mounted = true;

    socket.on("new-room", (room: Room) => {
      if (mounted) setRooms([...rooms, room]);
    });

    axios.get<Room[]>("/rooms").then(response => {
      if (mounted) setRooms(response.data);
    });

    return () => {
      socket.off("new-room")
      mounted = false;
    }
  });


  const createRoom = () => {
    axios.get('create-room');
  }
  return (
    <div>
      <h1>Chat Rooms</h1>
      <ul>
        {rooms.map(room => 
          <li key={room.id}>
            {room.id} 
            <Link to={{
              pathname: `/room/${room.id}`,
              state: {socket: socket.id}
            }}>Join</Link> 
          </li>
        )}
      </ul>
      <button onClick={createRoom}>Create room</button>
    </div>
  )
};

export { RoomList };
