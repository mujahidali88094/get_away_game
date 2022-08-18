import React, { useContext } from 'react'

import CardsContext from '../../contexts/CardsContext';

import Card from '../Card/Card'

import './MyCard.css';

export default function MyCard({ card, disabled,removeHandler }) {
	
	const { mySocket } = useContext(CardsContext);

	let disabledClass = disabled ? 'disabledCard' : 'normalCard';
	
	function handleClick() {
		if (!disabled) {
			mySocket.emit("throwCard", card);
			removeHandler(card);
		}
	}
	return (
		<div className={disabledClass} onClick={handleClick}>
			<Card number={ card.number } suit={card.suit} />
		</div>
	)
}
