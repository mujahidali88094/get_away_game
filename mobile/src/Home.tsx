import React, {useEffect, useState} from 'react';
import {SafeAreaView, ScrollView, StatusBar} from 'react-native';

import {useCardsContext} from './contexts/CardsContext';
import ChoicePage from './pages/ChoicePage';
import Header from './components/Header';

const Home = () => {
  const {mySocket} = useCardsContext();

  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    mySocket.on('connect', () => {
      setIsConnected(true);
    });
    mySocket.on('disconnect', () => {
      setIsConnected(false);
    });
  }, [mySocket]);

  return (
    <SafeAreaView style={{width: '50%'}}>
      <StatusBar hidden barStyle="light-content" animated />
      <ScrollView contentInsetAdjustmentBehavior="automatic">
        <Header textColor={isConnected ? 'green' : 'red'} />
        <ChoicePage />
      </ScrollView>
    </SafeAreaView>
  );
};

export default Home;
