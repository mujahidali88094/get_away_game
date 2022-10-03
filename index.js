const express = require("express");
const app = express();
const http = require('http');
const {Server} = require("socket.io");
// const cors = require("cors");
const { v4: uuidv4 } = require('uuid');
const path = require("path");

const port = process.env.PORT || 5000;
// app.use(cors());

const server = http.createServer(app);


// const io = new Server(server, {
// 	cors: {
// 		origin: 'http://localhost:3000',
// 	}
// })

const io = new Server(server);

//if (process.env.NODE_ENV == 'production') {
	app.use(express.static(path.join(__dirname,'react_frontend','build')));
	// app.get('/', (req, res) => {
	// 	console.log(__dirname);
	// 	res.sendFile(path.join(__dirname,'react_frontend','build','index.html'));
	// })
//}

server.listen(
	port,
	console.log(
		`Server is running on the port no: ${(port)}`
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
	declareWinner(membersRoom, playingMembersRoom) {
		io.to(membersRoom).emit("status", {
			status: "WON!",
			targetSocketId: this.socketId
		});
		this.isPlaying = false;
		users[this.socketId].socket.leave(playingMembersRoom);
	}
	declareLoser(membersRoom, playingMembersRoom) {
		io.to(this.socketId).emit('disableAllSuits');
		io.to(membersRoom).emit("status", {
			status: "BHABI!",
			targetSocketId: this.socketId
		});
		this.isPlaying = false;
		users[this.socketId].socket.leave(playingMembersRoom);
	}
};
class Game {
	starter;
	maxNoOfPlayers;
	members = [];
	membersRoom;
	playingMembersRoom;

	constructor(maxNoOfPlayers,members) {
		this.maxNoOfPlayers = maxNoOfPlayers;
		members.forEach(socketId => this.members.push(new GameMember(socketId)));
		this.membersRoom = uuidv4();
		this.playingMembersRoom = uuidv4();
		//join rooms
		this.members.forEach(({ socketId }) => {
			let socket = users[socketId].socket;
			socket.join(this.membersRoom);
			socket.join(this.playingMembersRoom);
		});
	}
	addMember(socketId) { //adds member and returns its index;
		this.members.push(new GameMember(socketId));
		//join rooms
		let socket = users[socketId].socket;
		socket.join(this.membersRoom);
		socket.join(this.playingMembersRoom);

		return this.members.length - 1;
	}
	setStarter(index) {
		this.starter = index;
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
	getPlayersWithNonZeroCards() {
		let players = [];
		this.members.forEach(member => {
			if (member.isPlaying && member.cards.length>0 ) {
				players.push(member);
			}
		})
		return players;
	}
	getSenior(pile) {
		let _highestCardNumber = '2', senior=null;
		for (let i = 0; i < pile.length; i++){
			if (NUMBER_VALUE_MAP.get(pile[i].card.number) >= NUMBER_VALUE_MAP.get(_highestCardNumber)) {
				_highestCardNumber = pile[i].card.number;
				senior = pile[i].cardOwner;
			}
		}
		return senior;
	}
	determineFuture(pile) { //determines winners,loser and other key variables
		let senior = null,
			gameHasEnded = false,
			playersWithNonZeroCards = this.getPlayersWithNonZeroCards();
		
		senior = this.getSenior(pile);
		if (playersWithNonZeroCards.length == 0) {
			//winners
			this.members.forEach(member => {
				if (member != senior)
					member.declareWinner(this.membersRoom, this.playingMembersRoom);
			});
			//loser
			senior.declareLoser(this.membersRoom, this.playingMembersRoom);
			gameHasEnded = true;
		} else if (playersWithNonZeroCards.length == 1) {
			let leftoutPlayer = playersWithNonZeroCards[0];
			if (senior == leftoutPlayer) {
				//winners
				this.members.forEach(member => {
					if (member != senior)
						member.declareWinner(this.membersRoom, this.playingMembersRoom);
				})
				//loser
				senior.declareLoser(this.membersRoom, this.playingMembersRoom);
				gameHasEnded = true;
			}
			else {
				//winners
				this.members.forEach(member => {
					if (member != senior && member != leftoutPlayer)
						member.declareWinner(this.membersRoom, this.playingMembersRoom);
				})
				//give one card of leftoutPlayer to senior
				let randomIndex = (Math.floor(Math.random()) * 100) % leftoutPlayer.cards.length;
				let randomCard = leftoutPlayer.cards[randomIndex];
				//shift random card (on server side)
				senior.cards = [...senior.cards, randomCard];
				leftoutPlayer.cards.splice(randomIndex, 1);
				//shift random card (on client side)
				io.to(leftoutPlayer.socketId).emit('removeCard',randomCard);
				io.to(senior.socketId).emit('addCard', randomCard);
				io.to(this.membersRoom).emit("changeCardsCount", {
					targetSocketId: senior.socketId,
					newCardCount: senior.cards.length
				});
				io.to(this.membersRoom).emit("changeCardsCount", {
					targetSocketId: leftoutPlayer.socketId,
					newCardCount: leftoutPlayer.cards.length
				});
				gameHasEnded = false;
			}

		} else {
			//winners
			this.members.forEach(member => {
				if (playersWithNonZeroCards.indexOf(member) == -1)
					member.declareWinner(this.membersRoom, this.playingMembersRoom);
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
				member.declareWinner(this.membersRoom, this.playingMembersRoom);
		})
		//loser
		if (playersWithNonZeroCards.length == 1) {
			playersWithNonZeroCards[0].declareLoser(this.membersRoom, this.playingMembersRoom);
			return { gameHasEnded: true };
		}
		return { gameHasEnded: false };
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
		io.to(this.playingMembersRoom).emit("disableAllSuits");
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
			let thrownCard, response;
			if (pile.length < this.countPlayingMembers() - 1) { //only enable takeCards if this is not last turn of a round
				turnHolderSocket.emit('enableTakeCards');
			}
			response = await waitForUserTurnOptions(turnHolderSocket);
			turnHolderSocket.emit('disableTakeCards');
			if (response.type === 'takeCards') {
				//get target's cards
				let targetPlayer = this.findNextPlayingMember(turnHolder);
				let targetCards = [...targetPlayer.cards];
				//add these to turn holder account
				turnHolder.cards = [...turnHolder.cards, ...targetCards];
				turnHolderSocket.emit('receiveMoreCards', targetCards);
				//remove target's cards
				targetPlayer.cards.splice(0, targetPlayer.cards.length);
				io.to(targetPlayer.socketId).emit('removeAllCards');
				//let the target player win
				io.to(this.membersRoom).emit("status", {
					status: "WON!",
					targetSocketId: targetPlayer.socketId
				});
				targetPlayer.isPlaying = false;
				users[targetPlayer.socketId].socket.leave(this.playingMembersRoom);
				//update card counts
				io.to(this.membersRoom).emit("changeCardsCount", {
					targetSocketId: turnHolder.socketId,
					newCardCount: turnHolder.cards.length
				});
				io.to(this.membersRoom).emit("changeCardsCount", {
					targetSocketId: targetPlayer.socketId,
					newCardCount: targetPlayer.cards.length
				});
				continue;
			}
			//else if (response.type === 'throwCard')
			thrownCard = response.card;
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

				let { gameHasEnded } = this.determineFutureAfterThola();
				if (gameHasEnded)
					break;
				// for next turn
				turnHolder = senior;
				roundNumber += 1;
				continue;
			}
			//else
			//identify senior
			/*if (pile.length == 1) {
				highestCardNumber = thrownCard.number;
				senior = turnHolder;
			}
			else if (NUMBER_VALUE_MAP.get(thrownCard.number) > NUMBER_VALUE_MAP.get((highestCardNumber))) {
				senior = turnHolder;
				highestCardNumber = thrownCard.number;
			}*/

			//check if a round has completed
			if (pile.length == this.countPlayingMembers()) {
				if (isFirstRound) isFirstRound = false;
				await waitOneSecond();
				
				let future = this.determineFuture(pile);
				let gameHasEnded = future.gameHasEnded;
				if(future.senior)
					senior = future.senior;

				pile = [];
				io.to(this.membersRoom).emit("emptyPile");

				if (gameHasEnded)
					break;

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
async function waitForUserTurnOptions(socket) {
	let throwCardPromise = new Promise((resolve) => {
		socket.once("throwCard", (card) => {
			resolve({type:'throwCard', card:card});
		});
	});
	let takeCardsPromise = new Promise((resolve) => {
		socket.once("takeCards", () => {
			resolve({type:'takeCards'});
		});
	});
	return Promise.any([throwCardPromise, takeCardsPromise]);
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
