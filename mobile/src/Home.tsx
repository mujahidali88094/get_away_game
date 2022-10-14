import React, {useEffect, useState} from 'react';
import {SafeAreaView, ScrollView, StatusBar} from 'react-native';

import {useCardsContext} from './contexts/CardsContext';
import GamePage from './pages/GamePage';
import ChoicePage from './pages/ChoicePage';
import Header from './components/Header';

import {Member} from './common/types';

const Home = () => {
  const {mySocket, setGameId, setMaxNoOfPlayers, setMembers, setMyIndex} =
    useCardsContext();

  const [isConnected, setIsConnected] = useState(false);
  const [goToGame, setGoToGame] = useState(false);

  useEffect(() => {
    mySocket.on('connect', () => {
      setIsConnected(true);
    });
    mySocket.on('disconnect', () => {
      setIsConnected(false);
    });
  }, [mySocket]);

  useEffect(() => {
    mySocket.on(
      'gameInfo',
      ({
        gameId,
        maxNoOfPlayers,
        members,
        currentUserIndex,
      }: {
        gameId: string;
        maxNoOfPlayers: number;
        members: Member;
        currentUserIndex: number;
      }) => {
        setGameId(gameId);
        setMaxNoOfPlayers(maxNoOfPlayers);
        setMyIndex(currentUserIndex);
        setMembers(members);
        setGoToGame(true);
      },
    );
    mySocket.on('addNewMember', (member: Member) => {
      setMembers((oldMembers: Member[]) => [...oldMembers, member]);
    });
  }, [
    mySocket,
    setGameId,
    setMaxNoOfPlayers,
    setMyIndex,
    setMembers,
    setGoToGame,
  ]);

  return (
    <SafeAreaView>
      <StatusBar hidden barStyle="light-content" animated />
      <ScrollView contentInsetAdjustmentBehavior="automatic">
        <Header textColor={isConnected ? 'green' : 'red'} />
        {goToGame ? <GamePage /> : <ChoicePage />}
      </ScrollView>
    </SafeAreaView>
  );
};

export default Home;
