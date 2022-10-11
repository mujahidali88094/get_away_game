

import { CardNumber, CardSuit, Card,  ResponseOnTurn } from "../types";
import { createDeck, shuffle, findIndexOfCard, mod } from '../utilities';
import { ALL_SUITS, NUMBER_VALUE_MAP } from "../constants";

type PileCard = {
  card: Card,
  cardOwner: GameMember
}
class GameMember{
	index: number;
	cards : Card[] = [];
	isPlaying: boolean = true;
	constructor(idx: number) {
		this.index = idx;
	}
	hasAceOfSpades() :boolean{
		for (let i = 0; i < this.cards.length; i++){
			let card = this.cards[i];
			if (card.number == 'A' && card.suit == '♠')
				return true;
		}
		return false;
	}
	hasSuit(suit:CardSuit):boolean {
		for (let i = 0; i < this.cards.length; i++)
			if (this.cards[i].suit == suit)
				return true;
		return false;
	}
	removeCard(card:Card):void {
		const index = findIndexOfCard(card,this.cards);
		if (index > -1)	this.cards.splice(index, 1);
	}
};

class Game {
	starter: number;
	maxNoOfPlayers:number;
	members: GameMember[] = [];

	constructor(maxNoOfPlayers: number) {
		this.maxNoOfPlayers = maxNoOfPlayers;
		for (let i = 0; i < maxNoOfPlayers; i++){
			this.members.push(new GameMember(i));
		}
	}
	setStarter(index:number):void {
		this.starter = index;
	}
	findNextPlayingMember(current:GameMember):GameMember|null {
		let currentIndex = this.members.indexOf(current);
		let length = this.members.length;
		for (let i = 1; i < length; i++){ //loop starts from 1 because we have to find next person not current one again
			let targetIndex = currentIndex + i;
			targetIndex = mod(targetIndex, length);
			if (this.members[targetIndex].isPlaying)
				return this.members[targetIndex];
		}
		return null;
	}
	countPlayingMembers():number {
		let playingMembersCount = 0;
		this.members.forEach(member => {
			if (member.isPlaying) {
				playingMembersCount += 1;
			}
		})
		return playingMembersCount;
	}
	getPlayersWithNonZeroCards():GameMember[] {
		let players:GameMember[] = [];
		this.members.forEach(member => {
			if (member.isPlaying && member.cards.length>0 ) {
				players.push(member);
			}
		})
		return players;
	}
	getSenior(pile:PileCard[]) {
		let _highestCardNumber:CardNumber = '2', senior:GameMember|null = null;
		for (let i = 0; i < pile.length; i++){
			let cardValue = NUMBER_VALUE_MAP.get(pile[i].card.number);
			let highestCardValue = NUMBER_VALUE_MAP.get(_highestCardNumber);
      if (cardValue==undefined || highestCardValue==undefined)
        return null;
      else if (cardValue >= highestCardValue) {
				_highestCardNumber = pile[i].card.number;
				senior = pile[i].cardOwner;
			}
		}
		return senior;
	}
	determineFuture(pile:PileCard[]) { //determines winners,loser and other key variables
		let senior:GameMember|null = this.getSenior(pile),
			gameHasEnded = false,
			playersWithNonZeroCards = this.getPlayersWithNonZeroCards();

		if (senior === null) throw new Error('Unable to find Senior');
		if (playersWithNonZeroCards.length == 0) {
			//winners
			this.members.forEach(member => {
				if (member != senior)
					declareWinner(member);
			});
			//loser
			declareLoser(senior);
			gameHasEnded = true;
		} else if (playersWithNonZeroCards.length == 1) {
			let leftoutPlayer = playersWithNonZeroCards[0];
			if (senior == leftoutPlayer) {
				//winners
				this.members.forEach(member => {
					if (member != senior)
						declareWinner(member);
				})
				//loser
				declareLoser(senior);
				gameHasEnded = true;
			}
			else {
				//winners
				this.members.forEach(member => {
					if (member != senior && member != leftoutPlayer)
						declareWinner(member);
				})
				//give one card of leftoutPlayer to senior
				let randomIndex = (Math.floor(Math.random()) * 100) % leftoutPlayer.cards.length;
				let pickedCard = leftoutPlayer.cards[randomIndex];
				//shift picked card (on server side)
				senior.cards = [...senior.cards, pickedCard];
				leftoutPlayer.cards.splice(randomIndex, 1);

				gameHasEnded = false;
			}

		} else {
			//winners
			this.members.forEach(member => {
				if (playersWithNonZeroCards.indexOf(member) == -1)
					declareWinner(member);
			})
			//determine senior from remaining pile
			pile = pile.filter(({ cardOwner }) => (playersWithNonZeroCards.indexOf(cardOwner) > -1));
			senior = this.getSenior(pile);
			gameHasEnded = false;
		}
		return {
			gameHasEnded,
			senior,
		};
	}
	determineFutureAfterThola() {
		let playersWithNonZeroCards = this.getPlayersWithNonZeroCards();
		//winners
		this.members.forEach(member => {
			if (playersWithNonZeroCards.indexOf(member) == -1)
				declareWinner(member);
		})
		//loser
		if (playersWithNonZeroCards.length == 1) {
			declareLoser(playersWithNonZeroCards[0]);
			return true;
		}
		return false;
	}

};


let noOfPlayers = 4;
let game = new Game(noOfPlayers);
handleTheGame(game);

async function handleTheGame(game: Game){
	distributeCards(game);
	let gameEndedSuccessfully = await playTheGame(game);
}
function distributeCards(game: Game):void {
	let deck = createDeck();
	shuffle(deck);

	let i = 0;
	while (i < game.maxNoOfPlayers) {
		let remainingMembersCount = game.maxNoOfPlayers - i;
		let division = Math.floor(deck.length / remainingMembersCount);
		let currentUserCards = deck.slice(0, division);
		game.members[i].cards = currentUserCards;
		if (game.starter === undefined)
			if (game.members[i].hasAceOfSpades())
				game.setStarter(i);

		deck.splice(0, division);
		i++;
	}
}
async function playTheGame(game: Game) {
	let turnHolder = game.members[game.starter];
	let senior = game.members[game.starter];
	let pile:PileCard[] = []; 
	let validSuits:CardSuit[] = [];
	let throwingThola = false;
	let isFirstRound = true;
	let roundNumber = 1;

	while (true) {

		//setValidSuits
		if (pile.length === 0)
			validSuits = ALL_SUITS;
		else {
			validSuits = [pile[0].card.suit];
			if (turnHolder.hasSuit(validSuits[0]))
				throwingThola = false;
			else {
				validSuits = ALL_SUITS;
				if (!isFirstRound) //not in very first turn
					throwingThola = true;
			}
		}

		let thrownCard:Card, response:ResponseOnTurn;
		
		let validCards = turnHolder.cards.filter(card => validSuits.indexOf(card.suit) !== -1);
		let tempCard = validCards[validCards.length - 1];
		response = { type: 'throwCard', card: tempCard };
		if (!response.card) throw new Error('Card not found in the response');
		thrownCard = response.card;
		
		//remove card
		turnHolder.removeCard(thrownCard);

		//add to pile
		pile.push({
			card: thrownCard,
			cardOwner: turnHolder
		})
		// let the thola roll
		if (throwingThola) {
			throwingThola = false;
			
			let cards:Card[]= [];
			pile.forEach(({ card }) => { cards.push(card); }); //get cards from pile

			senior.cards.push(...cards);

			//empty the pile
			pile = [];

			let gameHasEnded = game.determineFutureAfterThola();
			if (gameHasEnded)
				break;
			// for next turn
			turnHolder = senior;
			roundNumber += 1;
			continue;
		}
		//else

		//check if a round has completed
		if (pile.length == game.countPlayingMembers()) {
			if (isFirstRound) isFirstRound = false;
			
			let future = game.determineFuture(pile);
			let gameHasEnded = future.gameHasEnded;
			if(future.senior)
				senior = future.senior;

			pile = [];

			if (gameHasEnded)
				break;

			turnHolder = senior;

			roundNumber += 1;
			continue;
		}
		//normal next turn
		let temp2 = game.findNextPlayingMember(turnHolder);
		if (temp2 == null) throw new Error("Playing member not found yet game is continuing");
		turnHolder = temp2;
		
	}
	console.log("A game took ", roundNumber, " rounds");
	return true; //game ended successfully
}



function declareWinner(targetMember:GameMember) {
	targetMember.isPlaying = false;
}
function declareLoser(targetMember:GameMember) {
	targetMember.isPlaying = false;
	console.log(targetMember.index, ' is the Babhi');
}