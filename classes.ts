import { Socket } from "socket.io";
import { v4 as uuidv4 } from 'uuid';

import { Card, CardSuit, SocketId, PileCard, CardNumber } from './types';
import { findIndexOfCard, mod } from "./utilities";
import { NUMBER_VALUE_MAP } from "./constants";
import { declareWinner,declareLoser, shiftCardOnClientSide } from "./index";


export class User{
  socket : Socket;
  name : string;
  gameId: SocketId;
  
	constructor(socket:Socket,name:string) {
		this.socket = socket;
    this.name = name;
    this.gameId = '';
	}
	setGameId(id:SocketId) {	this.gameId = id;	}
}

//user type that is sent to the frontend
export class FrontEndUser{
  socketId : SocketId;
  name: string;
  cardCount: number;

	constructor(socketId:SocketId,name:string='Unnamed',cardCount:number) {
		this.socketId = socketId;
		this.name = name;
		this.cardCount = cardCount;
	}
}

export class GameMember{
	socketId : SocketId;
	cards : Card[] = [];
	isPlaying : boolean = true;
	constructor(socketId:SocketId) {
		this.socketId = socketId;
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

export class Game {
	starter: number;
	maxNoOfPlayers:number;
	members: GameMember[] = [];
	membersRoom: string;
  playingMembersRoom: string;

	constructor(maxNoOfPlayers: number,members:SocketId[]) {
		this.maxNoOfPlayers = maxNoOfPlayers;
		members.forEach(socketId => this.members.push(new GameMember(socketId)));
		this.membersRoom = uuidv4();
		this.playingMembersRoom = uuidv4();
	}
	addMember(socket:Socket):number { //adds member and returns its index;
		this.members.push(new GameMember(socket.id));
		this.joinRooms(socket);
		return this.members.length - 1;
	}
	joinRooms(socket:Socket): void{
		socket.join(this.membersRoom);
		socket.join(this.playingMembersRoom);
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
					declareWinner(member, this.membersRoom, this.playingMembersRoom);
			});
			//loser
			declareLoser(senior, this.membersRoom, this.playingMembersRoom);
			gameHasEnded = true;
		} else if (playersWithNonZeroCards.length == 1) {
			let leftoutPlayer = playersWithNonZeroCards[0];
			if (senior == leftoutPlayer) {
				//winners
				this.members.forEach(member => {
					if (member != senior)
						declareWinner(member, this.membersRoom, this.playingMembersRoom);
				})
				//loser
				declareLoser(senior, this.membersRoom, this.playingMembersRoom);
				gameHasEnded = true;
			}
			else {
				//winners
				this.members.forEach(member => {
					if (member != senior && member != leftoutPlayer)
						declareWinner(member, this.membersRoom, this.playingMembersRoom);
				})
				//give one card of leftoutPlayer to senior
				let randomIndex = (Math.floor(Math.random()) * 100) % leftoutPlayer.cards.length;
				let pickedCard = leftoutPlayer.cards[randomIndex];
				//shift picked card (on server side)
				senior.cards = [...senior.cards, pickedCard];
				leftoutPlayer.cards.splice(randomIndex, 1);
				//shift picked card (on client side)
				shiftCardOnClientSide(pickedCard, leftoutPlayer, senior, this.membersRoom);
				gameHasEnded = false;
			}

		} else {
			//winners
			this.members.forEach(member => {
				if (playersWithNonZeroCards.indexOf(member) == -1)
					declareWinner(member, this.membersRoom, this.playingMembersRoom);
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
				declareWinner(member, this.membersRoom, this.playingMembersRoom);
		})
		//loser
		if (playersWithNonZeroCards.length == 1) {
			declareLoser(playersWithNonZeroCards[0], this.membersRoom, this.playingMembersRoom);
			return true;
		}
		return false;
	}

};


