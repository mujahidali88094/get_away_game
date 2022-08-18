import { Formik, Form, Field } from 'formik';
import { useContext, useState } from 'react';
import CardsContext from '../../contexts/CardsContext';

import './Landing.css'

const CHOICES = {
  JOIN_ANY_GAME: 'Join Random Game',
  JOIN_FRIENDS: 'Join Friends',
  CREATE_GAME: 'Start A New Game'
}

export default function Landing() {
  let { name, changeName, mySocket } = useContext(CardsContext);
  let [error, setError] = useState('');
  mySocket.on('error', ({message}) => {
    setError(message);
  })
	return (
		<>
			<Formik
        initialValues={{
          name: name,
          choice: CHOICES.JOIN_ANY_GAME,
          game_id: '',
          no_of_players:4
        }}
        onSubmit={(values,{setSubmitting}) => {
					changeName(values.name);
          setSubmitting(false);
          mySocket.emit('choicesSelected', {
            name: values.name,
            choice: values.choice,
            gameId: values.game_id,
            noOfPlayers: values.no_of_players
          })
        }}
        onChange={() => { setError(''); }}
      >
      {
        ({ values,handleChange }) => (
          <Form>
            <h2 style={{ display: 'inline-block'}}>Hi </h2>
            <Field className='inline-input' name='name' type='text' required
              // style={{ width: values.name.length + 'ch' }}
              // onChange={(e) => { handleChange(e); e.target.style.width = (e.target.value.length+ 1) + 'ch'; }} 
            />
            <div role="group" aria-labelledby="my-radio-group" onChange={handleChange}>
              <label htmlFor="choice"><Field type='radio' name='choice' value={CHOICES.JOIN_ANY_GAME}/>Join a Random Game</label>
              <label htmlFor="choice"><Field type='radio' name='choice' value={CHOICES.JOIN_FRIENDS}/>Join your Friends </label>
              <label htmlFor="choice"><Field type='radio' name='choice' value={CHOICES.CREATE_GAME} />Start a New Game </label>
            </div>
            {
              values.choice === CHOICES.JOIN_FRIENDS
                ? (
                  <>
                    <label htmlFor="game_id">Game ID:</label>
                    <Field type='text' name='game_id' required onChange={handleChange}/><br/>
                  </>
                )
                : values.choice === CHOICES.CREATE_GAME
                  ? (
                    <>
                      <label htmlFor="no_of_players">No Of Players:</label>
                      <Field type='number' min='3' max='8' name='no_of_players' required/><br/>
                    </>
                  )
                  : null
            }
            <button type='submit'>Go</button>
          </Form>
        )
      }
      </Formik>
      { error!=='' &&
        <div className='error-message'>{error}</div>
      }
		</>
	)
}