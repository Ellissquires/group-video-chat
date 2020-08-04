import socketIOClient from "socket.io-client";
import React, {useState, useEffect } from 'react';
import axios from 'axios';
import { Message } from '../types';

const ChatConsole = (props: any) => {

  const [messages, setMessages] = useState([] as Message[]);
  return <div></div>
}

export { ChatConsole };
