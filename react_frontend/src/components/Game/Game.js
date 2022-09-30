import React, { useContext,useState,useEffect } from 'react'
import CardsContext from '../../contexts/CardsContext'
import Slot from '../Slot/Slot'
import MyCards from '../MyCards/MyCards'
import './Game.css';

export default function Game() {
	let { gameId, maxNoOfPlayers, members, myIndex,mySocket } = useContext(CardsContext);
	let [arrangedMembers, setArrangedMembers] = useState([]);

	useEffect(() => {
	}, [arrangedMembers]);
	
	useEffect(() => {

		let temp = [];
		for (let i = myIndex; i < members.length; i++)
			temp.push(members[i]);
		for (let i = 0; i < myIndex; i++)
			temp.push(members[i]);
		
		setArrangedMembers(temp);

	}, [members, myIndex]);

	useEffect(() => {
		mySocket.on('changeCardsCount', ({ targetSocketId, newCardCount }) => {
			setArrangedMembers(old => {
				return old.map((member) => {
					if (member.socketId === targetSocketId) {
						member.cardCount = newCardCount;
					}
					return member;
				})
			})
		});
		mySocket.on('placeCard', ({ targetSocketId, card }) => {
			setArrangedMembers(old => {
				return old.map((member) => {
					if (member.socketId === targetSocketId) {
						member.card = card;
						member.status = null;
					}
					return member;
				})
			})
		});
		mySocket.on('status', ({ targetSocketId, status }) => {
			setArrangedMembers(old => {
				return old.map((member) => {
					if (member.socketId === targetSocketId) {
						member.card = null;
						member.status = status;
					}
					return member;
				})
			})
		});
		mySocket.on("emptyPile", () => {
			setArrangedMembers(old => {
				return old.map((member) => {
					member.card = null;
					// member.status = null;
					return member;
				})
			})
		})
	}, [mySocket]);

	function takeCardsPressHandler() {
		mySocket.emit('takeCards');
	}

	
	return (
		<>
			<div className='game'>
				<div className='game-info'>
					<div>Game ID: {gameId}</div>
					<div>Maximum Players: {maxNoOfPlayers}</div>
				</div>
				<div className='slots-container'>
					{
						arrangedMembers.map((member,i) => {
							return (
								<Slot
									key={i}
									name={member.name}
									cardCount={member.cardCount}
									socketId={member.socketId}
									card={member.card}
									status={member.status} 
								/>
							)
						})
					}
				</div>
			</div>
			<button onClick={takeCardsPressHandler}>Take Cards</button>
			<MyCards/>
		</>
	)
}

