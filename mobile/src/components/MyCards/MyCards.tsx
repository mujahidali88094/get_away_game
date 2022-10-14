import {ScrollView} from 'react-native';
import React, {useState, useEffect} from 'react';
import MyCard from '../../components/MyCard';
import {SUITS} from '../../common/constants';
import {getArrangedCards} from '../../common/utilities';
import {CardSuit, CardType} from '../../common/types';
import {useCardsContext} from '../../contexts/CardsContext';

const MyCards = () => {
  let {mySocket} = useCardsContext();

  const [cards, setCards] = useState<CardType[]>([]);
  const [enabledSuits, setEnabledSuits] = useState<CardSuit[]>([]);

  useEffect(() => {
    mySocket.on('cardsDistributed', (recievedCards: CardType[]) => {
      console.log(`cards received ${recievedCards}`);
      let arrangedCards = getArrangedCards(recievedCards);
      setCards(arrangedCards);
    });

    mySocket.on('enableSuit', (suit: CardSuit) => {
      setEnabledSuits([suit]);
    });
    mySocket.on('disableAllSuits', () => {
      setEnabledSuits([]);
    });
    mySocket.on('enableAllSuits', () => {
      setEnabledSuits([SUITS.SPADE, SUITS.CLUB, SUITS.DIAMOND, SUITS.HEART]);
    });

    mySocket.on('addCard', (cardToAdd: CardType) => {
      setCards(exisitingCards => {
        return getArrangedCards([...exisitingCards, cardToAdd]);
      });
    });

    mySocket.on('receiveMoreCards', (moreCards: CardType[]) => {
      setCards(exisitingCards => {
        return getArrangedCards([...exisitingCards, ...moreCards]);
      });
    });

    mySocket.on('removeCard', (cardToRemove: CardType) => {
      removeHandler(cardToRemove);
    });

    mySocket.on('removeAllCards', () => {
      setCards([]);
    });
  }, [mySocket]);

  function removeHandler(cardToRemove: CardType) {
    setCards(existingCards => {
      return existingCards.filter(
        existingCard =>
          existingCard.number !== cardToRemove.number ||
          existingCard.suit !== cardToRemove.suit,
      );
    });
  }

  return (
    <ScrollView horizontal style={{flexDirection: 'row'}}>
      {cards.map(card => {
        return (
          <MyCard
            key={card.number + card.suit}
            card={card}
            disabled={enabledSuits.indexOf(card.suit) === -1}
            removeHandler={removeHandler}
          />
        );
      })}
    </ScrollView>
  );
};

export default MyCards;
