import React, {useState, useContext} from 'react';
import {Socket} from 'socket.io';
import {USERNAME_KEY} from '../common/constants';
import {SocketId, CardType, Member} from '../common/types';
import {getData, storeData} from '../common/utilities';
// import { getCookie, setCookie } from "../utilities/utility";

const CardsContext = React.createContext<any>(null);
export default CardsContext;

export const CardsContextProvider: React.FC<{
  socket: any;
  children: React.ReactNode;
}> = ({socket, children}) => {
  let [name, setName] = useState('Stranger');
  let [mySocket, setMySocket] = useState<Socket>(socket);
  let [gameId, setGameId] = useState<SocketId>('');
  let [maxNoOfPlayers, setMaxNoOfPlayers] = useState(0);
  let [members, setMembers] = useState<Member[]>([]);
  let [myIndex, setMyIndex] = useState(0);
  let [cards, setCards] = useState<CardType[]>([]);

  let changeName = (newName: string) => {
    storeData(USERNAME_KEY, newName);
    setName(newName);
  };
  let getSavedName = async () => {
    let username = await getData(USERNAME_KEY);
    return username ? username : 'Stranger';
  };

  return (
    <CardsContext.Provider
      value={{
        name,
        getSavedName,
        changeName,
        mySocket,
        setMySocket,
        gameId,
        setGameId,
        maxNoOfPlayers,
        setMaxNoOfPlayers,
        cards,
        setCards,
        myIndex,
        setMyIndex,
        members,
        setMembers,
      }}>
      {children}
    </CardsContext.Provider>
  );
};

export const useCardsContext = () => {
  return useContext(CardsContext);
};
