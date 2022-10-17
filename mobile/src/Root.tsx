import React from 'react';
import {View} from 'react-native';
import {CardsContextProvider} from './contexts/CardsContext';
import io, {Socket} from 'socket.io-client';
import Home from './Home';
import Toast from 'react-native-toast-message';

const Root = () => {
  let socket: Socket = io('http://10.49.10.131:5000');

  return (
    <View>
      <CardsContextProvider socket={socket}>
        <Home />
      </CardsContextProvider>
      {/* Toast is rendered here but will be displayed when we call the showToast function anywhere in the app. */}
      <Toast />
    </View>
  );
};

export default Root;
