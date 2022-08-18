import React from 'react'
import './Card.css'

import { SUITS } from '../../utilities/utility'

export default function Card({ number, suit }) {
	let color = 'red';
	if (suit === SUITS.SPADE || suit === SUITS.CLUB) color = 'black';
	return (
		<div className='card' style={{ color: color,borderColor:color,backgroundColor:'white'}}>
			<div className="top">
				<div className='number' >{number}</div>
				<div className='suit'>{suit}</div>
			</div>
			<div className="main">{suit }</div>
			<div className="bottom">
				<div className='suit'>{suit}</div>
				<div className='number'>{number}</div>
			</div>
		</div>
	)
}
