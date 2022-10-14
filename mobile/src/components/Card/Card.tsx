import {Text, View} from 'react-native';
import React from 'react';
import {SUITS} from '../../common/constants';
import {type CardType} from '../../common/types';

declare type CardProps = {
  card: CardType;
  size?: number;
};
export const Card = ({card, size = 10}: CardProps) => {
  let cardColor =
    card.suit === SUITS.SPADE || card.suit === SUITS.CLUB ? 'black' : 'red';

  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 2,
        margin: 1,
        backgroundColor: 'white',
        borderColor: cardColor,
        borderWidth: 1,
        borderRadius: 5,
        alignSelf: 'center',
      }}>
      <View style={{alignSelf: 'flex-start', alignItems: 'center'}}>
        <Text style={{fontSize: size, color: cardColor}}>{card.suit}</Text>
        <Text style={{fontSize: size, color: cardColor}}>{card.number}</Text>
      </View>
      <View style={{paddingVertical: 2 * size}}>
        <Text style={{fontSize: size * 3, color: cardColor}}>{card.suit}</Text>
      </View>
      <View style={{alignSelf: 'flex-end', alignItems: 'center'}}>
        <Text style={{fontSize: size, color: cardColor}}>{card.number}</Text>
        <Text style={{fontSize: size, color: cardColor}}>{card.suit}</Text>
      </View>
    </View>
  );
};

export default Card;
