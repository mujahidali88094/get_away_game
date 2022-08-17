import React from 'react'
import Card from '../Card/Card'
import './Slot.css'

export default function Slot({ name, cardCount, card ,status }) {
	return (
		<div className='slot'>
			<div className='slot-card'>
				{card && <Card number={card.number} suit={card.suit} /> }
				{status && <div className="status">{ status }</div> }
			</div>
			<hr />
			<div className="info">
				<div>{name}</div>
				<div className='badge'>{cardCount}</div>
			</div>
		</div>
	)
}
