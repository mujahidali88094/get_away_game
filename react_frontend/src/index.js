import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import {CardsContextProvider} from './contexts/CardsContext';
import io from 'socket.io-client';
import { getCookie, setCookie } from './utilities/utility';

const socket = io.connect('', {
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


if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)){
  document.getElementsByTagName('body')[0].style.fontSize = '11px';
}else{
  document.getElementsByTagName('body')[0].style.fontSize = '16px';
}
