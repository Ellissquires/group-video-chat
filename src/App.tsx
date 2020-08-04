/**
 *
 */
import * as React from 'react';
import { hot } from 'react-hot-loader';
import { ChatRoom } from './components/ChatRoom';
import { RoomList } from './components/RoomList'
import socketIOClient from "socket.io-client";
import './app.global.css';

import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link
} from "react-router-dom";

const socket = socketIOClient();

class App extends React.Component {
  public render(): React.ReactNode {
    return (
      <Router>
        <Switch>
          <Route exact path="/" render={() => <RoomList socket={socket}/>}/>
          <Route path="/room/:id" render={(props) => 
            <ChatRoom socket={socket} {...props} />
          }/>
        </Switch>
      </Router>
    );
  }
}

const app: React.ComponentType = hot(module)(App);

export { app as App };
