import {View, Text} from 'react-native';
import React from 'react';
import {CardType} from '../../common/types';
import Card from '../Card';

declare type SlotProps = {
  name: string;
  card?: CardType | null;
  status?: string | null;
  cardCount: number;
};
const Slot = ({name, card, cardCount, status}: SlotProps) => {
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        borderColor: 'white',
        borderWidth: 2,
        padding: 10,
        minWidth: 90,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <View
        style={{
          borderBottomWidth: 2,
          borderColor: 'white',
          minHeight: 100,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        {card ? <Card card={card} /> : null}
        {status ? <Text style={{color: 'white'}}>{status}</Text> : null}
      </View>
      <View style={{paddingTop: 5}}>
        <Text style={{color: 'white'}}>{name}</Text>
        <View
          style={{
            borderWidth: 2,
            borderColor: 'white',
            borderRadius: 50,
            alignSelf: 'center',
            padding: 2,
          }}>
          <Text style={{color: 'white'}}>{cardCount}</Text>
        </View>
      </View>
    </View>
  );
};

export default Slot;
