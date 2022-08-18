import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import {CardsContextProvider} from './contexts/CardsContext';
import io from 'socket.io-client';
import { getCookie, setCookie } from './utilities/utility';

const socket = io.connect('http://localhost:3001', {
  query: {
    "prevSocketId": getCookie('socketId')
  }
});


socket.on('connect', () => {
  setCookie('socketId', socket.id, 1);
  
  ReactDOM.render(
    <CardsContextProvider socket={socket}>
      <App />
    </CardsContextProvider>,
    document.getElementById('root')
  );
})

socket.on('disconnect', () => {
  console.log('I am disconnected');
})

