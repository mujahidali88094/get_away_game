import { Card, CardNumber, CardSuit, ResponseOnTurn, SocketId } from "./types";
import { ALL_NUMBERS, ALL_SUITS } from "./constants";
import { Socket } from "socket.io";

export function findIndexOfCard(cardToBeSearched: Card, arr:Card[]) :number{
	for (let i = 0; i < arr.length; i++)
		if (arr[i].number == cardToBeSearched.number && arr[i].suit == cardToBeSearched.suit)
			return i;
	return -1;
}
export function createDeck(): Card[] {
	var deck:Card[] = [];
  let numbers = ALL_NUMBERS;
  let suits = ALL_SUITS;
  
	numbers.forEach(n => {
		suits.forEach(s => {
			let card:Card = { number: n, suit: s };
			deck.push(card);
		});
  });
  
	return deck;
}

export function shuffle(array: any[]) { //source: stack_overflow
	var currentIndex = array.length, randomIndex;

	// While there remain elements to shuffle...
	while (currentIndex != 0) {

		// Pick a remaining element...
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex--;

		// And swap it with the current element.
		[array[currentIndex], array[randomIndex]] = [
			array[randomIndex], array[currentIndex]];
	}

	return array;
}
export async function waitForUserTurnOptions(socket:Socket):Promise<ResponseOnTurn> {
	let throwCardPromise: Promise<ResponseOnTurn> = new Promise((resolve) => {
		socket.once("throwCard", (card) => {
			resolve({type:'throwCard', card:card});
		});
	});
	let takeCardsPromise: Promise<ResponseOnTurn> = new Promise((resolve) => {
		socket.once("takeCards", () => {
			resolve({type:'takeCards'});
		});
	});
	return Promise.any([throwCardPromise, takeCardsPromise]);
}
export async function waitOneSecond() {
	return new Promise((resolve) => {
		setTimeout(resolve, 1000);
	});
}

export function mod(n:number, m:number) { // performs n mod m (source: stack_overflow)
  return ((n % m) + m) % m;
}
