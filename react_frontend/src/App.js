import React, { useContext,useEffect,useState } from 'react';
import Landing from './components/landing/Landing';
import Game from './components/Game/Game';

import './FormStyles.css'
import './App.css';
import CardsContext from './contexts/CardsContext';
import Header from './components/Header/Header';


export default function App() {
  const [goToGame, setGoToGame] = useState(false);

  const { mySocket,setGameId,setMaxNoOfPlayers,setMembers,setMyIndex} = useContext(CardsContext);

  useEffect(() => { 
    mySocket.on('gameInfo', ({ gameId, maxNoOfPlayers, members, currentUserIndex }) => {
      setGameId(gameId);
      setMaxNoOfPlayers(maxNoOfPlayers);
      setMyIndex(currentUserIndex);
      setMembers(members);
      setGoToGame(true);
    });
    mySocket.on('addNewMember', member => {
      setMembers(oldMembers=>[...oldMembers,member]);
    })
  }, [mySocket,setGameId,setMaxNoOfPlayers,setMyIndex,setMembers,setGoToGame]);

  return (
    <>
      {!goToGame
        ? <> <Header big />  <Landing /> </>
        : <> <Header />      <Game />    </>
      }
      
    </>

  );
};
