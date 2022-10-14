import {View, TouchableHighlight} from 'react-native';
import React from 'react';
import {CardType} from '../../common/types';
import {useCardsContext} from '../../contexts/CardsContext';
import Card from '../../components/Card';

declare type MyCardPropsType = {
  card: CardType;
  disabled?: boolean;
  removeHandler: (arg0: CardType) => void;
};

const MyCard = ({card, disabled = false, removeHandler}: MyCardPropsType) => {
  const {mySocket} = useCardsContext();

  function handleClick() {
    if (!disabled) {
      mySocket.emit('throwCard', card);
      removeHandler(card);
    }
  }

  return (
    <TouchableHighlight onPress={handleClick} disabled={disabled}>
      <View style={{opacity: disabled ? 0.25 : 1}}>
        <Card card={card} />
      </View>
    </TouchableHighlight>
  );
};

export default MyCard;
