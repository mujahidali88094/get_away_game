const express = require("express");
const app = express();
const http = require('http');
const {Server} = require("socket.io");
const cors = require("cors");
const { v4: uuidv4 } = require('uuid');

const port = 3001;
app.use(cors());

const server = http.createServer(app);


const io = new Server(server, {
	cors: {
		origin: 'http://localhost:3000',
	}
})

server.listen(
  port,
  console.log(
    `Server is running on the port no: ${(port)} `
  )
);

const SUITS = {
  HEART: '♥',
  DIAMOND: '♦',
  CLUB: '♣',
  SPADE: '♠'
}
const ALL_SUITS = [
	SUITS.SPADE,
	SUITS.DIAMOND,
	SUITS.CLUB,
	SUITS.HEART
];

const NUMBER_VALUE_MAP = new Map();
NUMBER_VALUE_MAP.set('A', 14);
NUMBER_VALUE_MAP.set('K', 13);
NUMBER_VALUE_MAP.set('Q', 12);
NUMBER_VALUE_MAP.set('J', 11);
NUMBER_VALUE_MAP.set('10', 10);
NUMBER_VALUE_MAP.set('9', 9);
NUMBER_VALUE_MAP.set('8', 8);
NUMBER_VALUE_MAP.set('7', 7);
NUMBER_VALUE_MAP.set('6', 6);
NUMBER_VALUE_MAP.set('5', 5);
NUMBER_VALUE_MAP.set('4', 4);
NUMBER_VALUE_MAP.set('3', 3);
NUMBER_VALUE_MAP.set('2', 2);

const CHOICES = {
  JOIN_ANY_GAME: 'Join Random Game',
  JOIN_FRIENDS: 'Join Friends',
  CREATE_GAME: 'Start A New Game'
}
const DEFAULT_NO_OF_PLAYERS = 3;

let users = {};                  // = { socketId : User, ... } 
let games = {};                  // = { gameId   : Game, ... }
let lastGameId = null;           // game available for random players
class User{
	socket;	name;	gameId;
	constructor(socket,name) {
		this.socket = socket;
		this.name = name;
	}
	setGameId(id) {	this.gameId = id;	}
}
class FrontEndUser{
	constructor(socketId,name,cardCount) {
		this.socketId = socketId;
		this.name = name;
		this.cardCount = cardCount;
	}
}
class GameMember{
	socketId;
	cards = [];
	isPlaying = true;
	constructor(socketId) {
		this.socketId = socketId;
	}
	hasAceOfSpades() {
		for (let i = 0; i < this.cards.length; i++){
			let card = this.cards[i];
			if (card.number == 'A' && card.suit == '♠')
				return true;
		}
		return false;
	}
	hasSuit(suit) {
		for (let i = 0; i < this.cards.length; i++)
			if (this.cards[i].suit == suit)
				return true;
		return false;
	}
	removeCard(card) {
		const index = findIndexOfCard(card,this.cards);
		if (index > -1)	this.cards.splice(index, 1);
	}
};
class Game {
	starter;
	maxNoOfPlayers;
	members = [];
	membersRoom;
	NonPlayingMembersRoom;

	constructor(maxNoOfPlayers,members) {
		this.maxNoOfPlayers = maxNoOfPlayers;
		members.forEach(socketId => this.members.push(new GameMember(socketId)));
		this.membersRoom = uuidv4();
		this.NonPlayingMembersRoom = uuidv4();
		//join rooms
		this.members.forEach(({ socketId }) => {
			let socket = users[socketId].socket;
			socket.join(this.membersRoom);
			socket.join(this.NonPlayingMembersRoom);
		});
	}
	addMember(socketId) { //adds member and returns its index;
		this.members.push(new GameMember(socketId));
		//join rooms
		let socket = users[socketId].socket;
		socket.join(this.membersRoom);
		socket.join(this.NonPlayingMembersRoom);

		return this.members.length - 1;
	}
	setStarter(index) {
		this.starter = index;
	}
	checkIfSomeoneWon() {
		this.members.forEach(member => {
			if (member.isPlaying && member.cards.length == 0) {
				io.to(this.membersRoom).emit("status", {
					status: "WON!",
					targetSocketId: member.socketId
				});
				member.isPlaying = false;
				users[member.socketId].socket.leave(this.membersRoom);
			}
		})
	}
	gameHasEnded() {
		let playingMembersCount = 0;
		let playingMember = null;
		this.members.forEach(member => {
			if (member.isPlaying) {
				playingMembersCount += 1;
				playingMember = member;
			}
		})

		if (playingMembersCount > 1)
			return false;
		//else playingMember is loser
		io.to(playingMember.socketId).emit('disableAllSuits');
		io.to(this.membersRoom).emit("status", {
			status: "BHABI!",
			targetSocketId: playingMember.socketId
		});
		playingMember.isPlaying = false;
		users[playingMember.socketId].socket.leave(this.membersRoom);
		return true;
	}
	findNextPlayingMember(current) {
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
	countPlayingMembers() {
		let playingMembersCount = 0;
		this.members.forEach(member => {
			if (member.isPlaying) {
				playingMembersCount += 1;
			}
		})
		return playingMembersCount;
	}

	async startTheGame() {

		let deck = createDeck();
		shuffle(deck);
	
		//dividing the cards
		let i = 0;
		while (i < this.maxNoOfPlayers) {
			let remainingMembersCount = this.maxNoOfPlayers - i;
			let division = Math.floor(deck.length / remainingMembersCount);
			let currentUserCards = deck.slice(0, division);
			this.members[i].cards = currentUserCards;
			io.to(this.members[i].socketId).emit("cardsDistributed", currentUserCards);
			io.to(this.membersRoom).emit("changeCardsCount", {
				targetSocketId: this.members[i].socketId,
				newCardCount: currentUserCards.length
			});
			if (this.starter === undefined)
				if (this.members[i].hasAceOfSpades())
					this.setStarter(i);
	
			deck.splice(0, division);
			i++;
		}
		io.to(this.membersRoom).emit("disableAllSuits");
		//starting the game
		let turnHolder = this.members[this.starter];
		let turnHolderSocket;
		let senior = this.members[this.starter];
		let pile = [];  //  pile = [{card,cardOwner}]
		let validSuits = [];
		let throwingThola = false;
		let isFirstRound = true;
		let highestCardNumber = 'A';
		let roundNumber = 1;

		await waitOneSecond();
		while (true) {
			turnHolderSocket = users[turnHolder.socketId].socket;
			function setValidSuits() {
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
				if (validSuits.length === 1)
					turnHolderSocket.emit("enableSuit", validSuits[0]);
				else
					turnHolderSocket.emit("enableAllSuits")
			}
			setValidSuits();
			io.to(this.membersRoom).emit("status", { targetSocketId: turnHolder.socketId, status: 'Turn' });
			let thrownCard;
			thrownCard = await waitForCardToBeThrown(turnHolderSocket);
			turnHolderSocket.emit("disableAllSuits");
			if (validSuits.indexOf(thrownCard.suit) == -1) { //suit not allowed
				turnHolderSocket.emit("addCard", card); //add it back
				continue;
			}
			//remove card
			turnHolder.removeCard(thrownCard);
			//send thrown card to all users
			io.to(this.membersRoom).emit("placeCard", {
				targetSocketId: turnHolder.socketId,
				card: thrownCard
			})
			io.to(this.membersRoom).emit("changeCardsCount", {
				targetSocketId: turnHolder.socketId,
				newCardCount: turnHolder.cards.length
			});
			//add to pile
			pile.push({
				card: thrownCard,
				cardOwner: turnHolder
			})
			// let the thola roll
			if (throwingThola) {
				throwingThola = false;

				await waitOneSecond();
				
				let cards = [];
				pile.forEach(({ card }) => { cards.push(card); }); //get cards from pile

				senior.cards.push(...cards);
				io.to(senior.socketId).emit('receiveMoreCards', cards);

				io.to(this.membersRoom).emit("changeCardsCount", {
					targetSocketId: senior.socketId,
					newCardCount: senior.cards.length
				});

				//empty the pile
				pile = [];
				io.to(this.membersRoom).emit("emptyPile");

				//check if turnHolder has won
				this.checkIfSomeoneWon();
				if (this.gameHasEnded())
					break;
				
				// for next turn
				turnHolder = senior;
				roundNumber += 1;
				continue;
			}
			//else
			//identify senior
			if (pile.length == 1) {
				highestCardNumber = thrownCard.number;
			}
			else if (NUMBER_VALUE_MAP.get(thrownCard.number) > NUMBER_VALUE_MAP.get((highestCardNumber))) {
				senior = turnHolder;
				highestCardNumber = thrownCard.number;
			}

			//check if a round has completed
			if (pile.length == this.countPlayingMembers()) {
				if (isFirstRound) isFirstRound = false;
				await waitOneSecond();
				this.checkIfSomeoneWon();
				if (this.gameHasEnded()) {
					//TODO: free memory by deleting game
					break;
				}

				//filter cards of NonPlayingMembers from Pile
				let newPile = [];
				pile.forEach(pileCard => {
					if (pileCard.cardOwner.isPlaying) {
						newPile.push(pileCard);
					}
				})
				//get senior from filtered pile because some members may have won
				let _highestCardNumber = '2';
				for (let i = 0; i < newPile.length; i++){
					if (NUMBER_VALUE_MAP.get(newPile[i].card.number) >= NUMBER_VALUE_MAP.get(_highestCardNumber)) {
						_highestCardNumber = newPile[i].card.number;
						senior = newPile[i].cardOwner;
					}
				}

				pile = [];
				io.to(this.membersRoom).emit("emptyPile");
				turnHolder = senior;

				roundNumber += 1;
				continue;
			}
			//normal next turn
			turnHolder = this.findNextPlayingMember(turnHolder);
		}

	}
}


function removeFromArray(array, toBeRemoved) {
	const index = findIndexOfCard(toBeRemoved,array);
	if (index > -1) {
		array.splice(index, 1);
	}
}
async function waitForCardToBeThrown(socket) {
	return new Promise((resolve) => {
		socket.once("throwCard", (card) => {
			resolve(card);
		});
	});
}
async function waitOneSecond() {
	return new Promise((resolve) => {
		setTimeout(resolve, 1000);
	});
}
function tellUserAboutGame(userSocket, gameId, userIndexInGame) {
	userSocket.emit('gameInfo', {
		gameId: gameId,
		maxNoOfPlayers: games[gameId].maxNoOfPlayers,
		members: games[gameId].members.map(({ socketId }) => { return new FrontEndUser(socketId, users[socketId].name, 0); }),
		currentUserIndex: userIndexInGame,
	});
}


io.on('connection', (socket) => {
	let prevId = socket.request._query.prevSocketId;
	console.log(socket.id + ' connected');
	
	socket.on('disconnect', () => {
		console.log(socket.id+' disconnected');
	});

	socket.on('choicesSelected', (data) => {
		let gameId;
		users[socket.id] = new User(socket,data.name);
		if (data.choice === CHOICES.JOIN_ANY_GAME) {
			if (lastGameId == null) { //create game
				gameId = socket.id;
				games[gameId] = new Game(DEFAULT_NO_OF_PLAYERS, [socket.id]);
				users[socket.id].setGameId(gameId);
				tellUserAboutGame(socket, gameId,0);
				lastGameId = gameId;
			} else {//join available game
				gameId = lastGameId;
				const indexOfNewUser = games[gameId].addMember(socket.id);
				users[socket.id].setGameId(gameId);
				tellUserAboutGame(socket, gameId, indexOfNewUser);
				socket.to(games[gameId].membersRoom).emit('addNewMember', new FrontEndUser(socket.id, users[socket.id].name, 0));
				if (games[lastGameId].maxNoOfPlayers === games[lastGameId].members.length) {
					lastGameId = null;
					games[gameId].startTheGame();
				}
			}
		} else if (data.choice === CHOICES.JOIN_FRIENDS) {
			if (games[data.gameId] == null) {
				socket.emit('error',{message:'No Game with this ID found! :( '})
			} else if (games[data.gameId].members.length === games[data.gameId].maxNoOfPlayers) {
				socket.emit('error',{message:'Table already filled out :( '})
			} else {
				gameId = data.gameId;
				const indexOfNewUser = games[gameId].addMember(socket.id);
				users[socket.id].setGameId(gameId);
				tellUserAboutGame(socket, gameId, indexOfNewUser);
				socket.to(games[gameId].membersRoom).emit('addNewMember', new FrontEndUser(socket.id, users[socket.id].name, 0));
				if (games[data.gameId].members.length === games[data.gameId].maxNoOfPlayers)
					games[gameId].startTheGame();
			}
		} else if (data.choice === CHOICES.CREATE_GAME) {
			gameId = socket.id;
			games[gameId] = new Game(data.noOfPlayers, [socket.id]);
			users[socket.id].setGameId(gameId);
			tellUserAboutGame(socket, gameId, 0);
		}
	})
});
function createDeck() {
	var deck = [];
	let numbers = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
	let suits = ALL_SUITS;
	numbers.forEach(n => {
		suits.forEach(s => {
			let card = { 'number': n, 'suit': s };
			deck.push(card);
		});
	});
	return deck;
}
function findIndexOfCard(cardToBeSearched, arr) {
	for (let i = 0; i < arr.length; i++)
		if (arr[i].number == cardToBeSearched.number && arr[i].suit == cardToBeSearched.suit)
			return i;
	return -1;
}
function shuffle(array) { //source: stack_overflow
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
function mod(n, m) { // performs n mod m (source: stack_overflow)
  return ((n % m) + m) % m;
}
