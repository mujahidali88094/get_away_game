import React, {useState, useEffect} from 'react';
import {Button, View, TextInput, Text} from 'react-native';
import RadioButtonRN from 'radio-buttons-react-native';

import {useCardsContext} from '../../contexts/CardsContext';
import {CHOICES, DEFAULT_NO_OF_PLAYERS} from '../../common/constants';
import {showToast} from '../../common/utilities';

export const ChoiceForm = () => {
  const {name, mySocket, changeName, getSavedName} = useCardsContext();
  //form values
  const [form_name, set_form_name] = useState(name);
  const [form_choice, set_form_choice] = useState(CHOICES.JOIN_ANY_GAME);
  const [form_no_of_players, set_form_no_of_players] = useState(
    DEFAULT_NO_OF_PLAYERS.toString(),
  );
  const [form_game_id, set_form_game_id] = useState('');

  useEffect(() => {
    (async () => {
      set_form_name(await getSavedName());
    })(); // get saved name and set it to form_name
  }, [getSavedName]);

  useEffect(() => {
    mySocket.on('error', ({message}) => {
      showToast('error', message);
    });
  }, [mySocket]);

  const choice_labels = [
    {
      label: CHOICES.JOIN_ANY_GAME,
    },
    {
      label: CHOICES.CREATE_GAME,
    },
    {
      label: CHOICES.JOIN_FRIENDS,
    },
  ];

  let handleSubmit = () => {
    let intNoOfPlayers = parseInt(form_no_of_players);
    if (
      form_choice === CHOICES.CREATE_GAME &&
      (isNaN(intNoOfPlayers) || intNoOfPlayers < 3 || intNoOfPlayers > 8)
    ) {
      showToast('error', 'No Of players not valid', 'Valid range is: 3 <--> 8');
      return;
    }
    if (form_name !== name) {
      changeName(form_name);
    }
    mySocket.emit('choicesSelected', {
      name: form_name,
      choice: form_choice,
      noOfPlayers: intNoOfPlayers,
      gameId: form_game_id,
    });
  };
  let handleNameChange = (val: string) => {
    set_form_name(val);
  };
  let handleChoiceChange = (val: string) => {
    set_form_choice(val);
  };
  let handleGameIdChange = (val: string) => {
    set_form_game_id(val);
  };
  let handleNoOfPlayersChange = (val: string) => {
    set_form_no_of_players(val);
  };
  return (
    <>
      <View style={{padding: 5, justifyContent: 'space-evenly'}}>
        <Text style={{color: 'white'}}>Hi</Text>
        <TextInput
          value={form_name}
          onChangeText={str => handleNameChange(str)}
          style={{color: 'white', borderBottomWidth: 2, borderColor: 'white'}}
        />
        <RadioButtonRN
          data={choice_labels}
          initial={1}
          selectedBtn={(response: any) => handleChoiceChange(response.label)}
          box={false}
          circleSize={10}
          textColor="white"
          activeColor="white"
          deactiveColor="gray"
        />
        {form_choice === CHOICES.JOIN_FRIENDS ? (
          <>
            <Text style={{color: 'white'}}>Game ID:</Text>
            <TextInput
              value={form_game_id}
              onChangeText={str => handleGameIdChange(str)}
              style={{
                color: 'white',
                borderBottomWidth: 2,
                borderColor: 'white',
              }}
            />
          </>
        ) : form_choice === CHOICES.CREATE_GAME ? (
          <>
            <Text style={{color: 'white'}}>No Of Players:</Text>
            <TextInput
              value={form_no_of_players.toString()}
              onChangeText={str => handleNoOfPlayersChange(str)}
              keyboardType="numeric"
              style={{
                color: 'white',
                borderBottomWidth: 2,
                borderColor: 'white',
              }}
            />
          </>
        ) : null}
        <View style={{alignSelf: 'stretch'}}>
          <Button color="gray" onPress={() => handleSubmit()} title="Go" />
        </View>
      </View>
    </>
  );
};
