import {ScrollView, Text, View, Button} from 'react-native';
import React, {useState, useEffect} from 'react';
import MyCards from '../../components/MyCards';
import Slot from '../../components/Slot';
import {SUITS} from '../../common/constants';
import {CardType, Member, SocketId} from '../../common/types';

import {useCardsContext} from '../../contexts/CardsContext';

const GamePage = () => {
  let {gameId, maxNoOfPlayers, members, myIndex, mySocket} = useCardsContext();
  let [arrangedMembers, setArrangedMembers] = useState<Member[]>([]);
  let [takeCardsDisabled, setTakeCardsDisabled] = useState(true);

  useEffect(() => {}, [arrangedMembers]);

  useEffect(() => {
    let temp: Member[] = [];
    for (let i = myIndex; i < members.length; i++) {
      temp.push(members[i]);
    }
    for (let i = 0; i < myIndex; i++) {
      temp.push(members[i]);
    }

    setArrangedMembers(temp);
  }, [members, myIndex]);

  useEffect(() => {
    mySocket.on(
      'changeCardsCount',
      ({
        targetSocketId,
        newCardCount,
      }: {
        targetSocketId: string;
        newCardCount: number;
      }) => {
        setArrangedMembers(old => {
          return old.map(member => {
            if (member.socketId === targetSocketId) {
              member.cardCount = newCardCount;
            }
            return member;
          });
        });
      },
    );
    mySocket.on(
      'placeCard',
      ({targetSocketId, card}: {targetSocketId: string; card: CardType}) => {
        setArrangedMembers(old => {
          return old.map(member => {
            if (member.socketId === targetSocketId) {
              member.card = card;
              member.status = null;
            }
            return member;
          });
        });
      },
    );
    mySocket.on(
      'status',
      ({targetSocketId, status}: {targetSocketId: string; status: string}) => {
        setArrangedMembers(old => {
          return old.map(member => {
            if (member.socketId === targetSocketId) {
              member.card = null;
              member.status = status;
            }
            return member;
          });
        });
      },
    );
    mySocket.on('emptyPile', () => {
      setArrangedMembers(old => {
        return old.map(member => {
          member.card = null;
          // member.status = null;
          return member;
        });
      });
    });

    mySocket.on('enableTakeCards', () => {
      setTakeCardsDisabled(false);
    });
    mySocket.on('disableTakeCards', () => {
      setTakeCardsDisabled(true);
    });
  }, [mySocket]);

  function takeCardsPressHandler() {
    if (!takeCardsDisabled) {
      mySocket.emit('takeCards');
    }
  }

  // let card: CardType = {number: '7', suit: SUITS.SPADE};
  return (
    <View>
      <View style={{flexDirection: 'row', justifyContent: 'space-evenly'}}>
        <Text style={{color: 'white'}}>GameID: {gameId}</Text>
        <Text style={{color: 'white'}}>Max Players: {maxNoOfPlayers}</Text>
      </View>
      <ScrollView horizontal>
        {arrangedMembers.map((member, i) => {
          return (
            <Slot
              key={i}
              name={member.name}
              cardCount={member.cardCount}
              // socketId={member.socketId}
              card={member.card}
              status={member.status}
            />
          );
        })}
      </ScrollView>
      <View style={{alignSelf: 'center'}}>
        <Button
          onPress={takeCardsPressHandler}
          title="Take Cards"
          disabled={takeCardsDisabled}
        />
      </View>
      <MyCards />
    </View>
  );
};

export default GamePage;
