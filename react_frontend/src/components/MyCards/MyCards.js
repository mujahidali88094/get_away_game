import React,{useContext,useState,useEffect} from 'react'
import CardsContext from '../../contexts/CardsContext'

import MyCard from '../MyCard/MyCard';

import './MyCards.css';

import { getArrangedCards, SUITS } from '../../utilities/utility';

export default function MyCards() {
	let { mySocket } = useContext(CardsContext);

	const [cards, setCards] = useState([]);
	const [enabledSuits, setEnabledSuits] = useState([]);

	useEffect(() => {
		mySocket.on('cardsDistributed', (cards) => {
			console.log(`cards received ${cards}`);
			cards = getArrangedCards(cards);
			setCards(cards);
		})

		mySocket.on("enableSuit", (suit) => { setEnabledSuits([suit]); })
		mySocket.on("disableAllSuits", () => { setEnabledSuits([]); })
		mySocket.on("enableAllSuits", () => { setEnabledSuits([SUITS.SPADE, SUITS.CLUB, SUITS.DIAMOND, SUITS.HEART]); })

		mySocket.on("addCard", card => {
			setCards(exisitingCards => {
				return getArrangedCards([...exisitingCards, card]);
			});
		})

		mySocket.on('receiveMoreCards', moreCards => {
			setCards(exisitingCards => {
				return getArrangedCards([...exisitingCards, ...moreCards]);
			});
		})
		
		mySocket.on('removeCard', cardToRemove => {
			removeHandler(cardToRemove);
		})

		mySocket.on('removeAllCards', () => {
			setCards([]);
		})
	}, [mySocket]);

	useEffect(() => {
		let normalCards = document.getElementsByClassName('normalCard');
		if (normalCards.length > 0) {
			let middleCard = normalCards[Math.floor(normalCards.length/2)];
			middleCard.scrollIntoView(false);
		}
	}, [enabledSuits]);

	function removeHandler(cardToRemove){
		setCards(cards => {
			return cards.filter(card => (card.number !== cardToRemove.number || card.suit !== cardToRemove.suit));
		})
	}

	return (
		<div className='cards-container'>
			{
				cards.map((card) => {
					return (
						<MyCard
							key={card.number + card.suit}
							card={card}
							disabled={enabledSuits.indexOf(card.suit) === -1}
							removeHandler = {removeHandler}
						/>
					)
				})
			}
		</div>
	)
}