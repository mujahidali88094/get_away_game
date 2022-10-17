import express from "express";
import http from 'http';
import {Server,Socket} from "socket.io";
import { v4 as uuidv4 } from 'uuid';
import path from "path";
import cors from 'cors';

import { CardNumber, CardSuit, Card, ChoiceFromFrontend, PileCard, SocketId, ResponseOnTurn } from "./types";
import { GameMember, User, Game, FrontEndUser } from './classes';
import { createDeck, shuffle, waitOneSecond, waitForUserTurnOptions} from './utilities';
import { CHOICES,DEFAULT_NO_OF_PLAYERS, ALL_SUITS } from "./constants";

const app = express();
app.use(cors({ origin: '*' }));
const port = process.env.PORT || 5000;
const server = http.createServer(app);
const io = new Server(server);

//if (process.env.NODE_ENV == 'production') {
	app.use(express.static(path.join(__dirname,'../','react_frontend','build')));
	app.get('/', (req, res) => {
		res.sendFile(path.join(__dirname,'../','react_frontend','build','index.html'));
	})
//}

server.listen(
  port,
  () => console.log(`Server is running on the port no: ${(port)}`)
);


var users = new Map<SocketId, User>();
var games = new Map<SocketId, Game>();
var lastGameId: SocketId | null = null;  // game available for random players



io.on('connection', (socket) => {
	// let prevId = socket.request._query.prevSocketId;
	console.log(socket.id + ' connected');
	
	socket.on('disconnect', () => {
		console.log(socket.id+' disconnected');
	});

	socket.on('choicesSelected', (data: ChoiceFromFrontend) => {
		let gameId;
		users.set(socket.id, new User(socket, data.name));
		if (data.choice === CHOICES.JOIN_ANY_GAME) {
			if (lastGameId == null) { //create game
				gameId = socket.id;
				games.set(gameId, new Game(DEFAULT_NO_OF_PLAYERS, [socket.id]));
				games.get(gameId)?.joinRooms(socket);
				users.get(socket.id)?.setGameId(gameId);
				tellUserAboutGame(socket, gameId,0);
				lastGameId = gameId;
			} else {//join available game
				gameId = lastGameId;
				let selectedGame = games.get(gameId);
				if (selectedGame) {
					const indexOfNewUser = selectedGame.addMember(socket);
					users.get(socket.id)?.setGameId(gameId);
					tellUserAboutGame(socket, gameId, indexOfNewUser);
					socket.to(selectedGame.membersRoom).emit('addNewMember', new FrontEndUser(socket.id, users.get(socket.id)?.name, 0));
					if (selectedGame.maxNoOfPlayers === selectedGame.members.length) {
						lastGameId = null;
						handleTheGame(gameId);
					}
				}
			}
		} else if (data.choice === CHOICES.JOIN_FRIENDS) {
			gameId = data.gameId;
			let selectedGame = games.get(gameId);
			if (selectedGame === undefined) {
				socket.emit('error',{message:'No Game with this ID found! :( '})
			} else if (selectedGame.members.length === selectedGame.maxNoOfPlayers) {
				socket.emit('error',{message:'Table already filled out :( '})
			} else {
				const indexOfNewUser = selectedGame.addMember(socket);
				users.get(socket.id)?.setGameId(gameId);
				tellUserAboutGame(socket, gameId, indexOfNewUser);
				socket.to(selectedGame.membersRoom).emit('addNewMember', new FrontEndUser(socket.id, users.get(socket.id)?.name, 0));
				if (selectedGame.members.length === selectedGame.maxNoOfPlayers)
					handleTheGame(gameId);
			}
		} else if (data.choice === CHOICES.CREATE_GAME) {
			gameId = socket.id;
			games.set(gameId, new Game(data.noOfPlayers, [socket.id]));
			games.get(gameId)?.joinRooms(socket);
			users.get(socket.id)?.setGameId(gameId);
			tellUserAboutGame(socket, gameId, 0);
		}
	})
});

async function handleTheGame(gameId: SocketId){
	let game = games.get(gameId);
	if (!game) return;
	distributeCards(game);
	let gameEndedSuccessfully = await playTheGame(game);
	if (gameEndedSuccessfully) {
		games.delete(gameId);
	}
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
		io.to(game.members[i].socketId).emit("cardsDistributed", currentUserCards);
		io.to(game.membersRoom).emit("changeCardsCount", {
			targetSocketId: game.members[i].socketId,
			newCardCount: currentUserCards.length
		});
		if (game.starter === undefined)
			if (game.members[i].hasAceOfSpades())
				game.setStarter(i);

		deck.splice(0, division);
		i++;
	}

	io.to(game.playingMembersRoom).emit("disableAllSuits");
}
async function playTheGame(game: Game) {
	let turnHolder = game.members[game.starter];
	let turnHolderSocket:Socket;
	let senior = game.members[game.starter];
	let pile:PileCard[] = []; 
	let validSuits:CardSuit[] = [];
	let throwingThola = false;
	let isFirstRound = true;
	let roundNumber = 1;

	await waitOneSecond();
	while (true) {

		let temp = users.get(turnHolder.socketId);
		if (temp === undefined) throw new Error("A user was not found which needed to be there");
		turnHolderSocket = temp.socket;

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
		if (validSuits.length === 1)
			turnHolderSocket.emit("enableSuit", validSuits[0]);
		else
			turnHolderSocket.emit("enableAllSuits");


		io.to(game.membersRoom).emit("status", { targetSocketId: turnHolder.socketId, status: 'Turn' });
		let thrownCard:Card, response:ResponseOnTurn;
		if (pile.length < game.countPlayingMembers() - 1) { //only enable takeCards if this is not last turn of a round
			turnHolderSocket.emit('enableTakeCards');
		}
		response = await waitForUserTurnOptions(turnHolderSocket);
		turnHolderSocket.emit('disableTakeCards');
		if (response.type === 'takeCards') {
			//get target's cards
			let targetPlayer = game.findNextPlayingMember(turnHolder);
			if (targetPlayer == null) continue;
			let targetCards = [...targetPlayer.cards];
			//add these to turn holder account
			turnHolder.cards = [...turnHolder.cards, ...targetCards];
			turnHolderSocket.emit('receiveMoreCards', targetCards);
			//remove target's cards
			targetPlayer.cards.splice(0, targetPlayer.cards.length);
			io.to(targetPlayer.socketId).emit('removeAllCards');
			//let the target player win
			io.to(game.membersRoom).emit("status", {
				status: "WON!",
				targetSocketId: targetPlayer.socketId
			});
			targetPlayer.isPlaying = false;
			users.get(targetPlayer.socketId)?.socket.leave(game.playingMembersRoom);
			//update card counts
			io.to(game.membersRoom).emit("changeCardsCount", {
				targetSocketId: turnHolder.socketId,
				newCardCount: turnHolder.cards.length
			});
			io.to(game.membersRoom).emit("changeCardsCount", {
				targetSocketId: targetPlayer.socketId,
				newCardCount: targetPlayer.cards.length
			});
			continue;
		}
		//else if (response.type === 'throwCard')
		if (!response.card) throw new Error('Card not found in the response');
		thrownCard = response.card;
		turnHolderSocket.emit("disableAllSuits");

		//suit not allowed
		// if (validSuits.indexOf(thrownCard.suit) == -1) { 
		// 	turnHolderSocket.emit("addCard", thrownCard); //add it back
		// 	continue;
		// }
		
		//remove card
		turnHolder.removeCard(thrownCard);
		//send thrown card to all users
		io.to(game.membersRoom).emit("placeCard", {
			targetSocketId: turnHolder.socketId,
			card: thrownCard
		})
		io.to(game.membersRoom).emit("changeCardsCount", {
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
			
			let cards:Card[]= [];
			pile.forEach(({ card }) => { cards.push(card); }); //get cards from pile

			senior.cards.push(...cards);
			io.to(senior.socketId).emit('receiveMoreCards', cards);

			io.to(game.membersRoom).emit("changeCardsCount", {
				targetSocketId: senior.socketId,
				newCardCount: senior.cards.length
			});

			//empty the pile
			pile = [];
			io.to(game.membersRoom).emit("emptyPile");

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
			await waitOneSecond();
			
			let future = game.determineFuture(pile);
			let gameHasEnded = future.gameHasEnded;
			if(future.senior)
				senior = future.senior;

			pile = [];
			io.to(game.membersRoom).emit("emptyPile");

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
	return true; //game ended successfully
}



export function declareWinner(targetMember:GameMember, membersRoom:string, playingMembersRoom:string) {
	io.to(membersRoom).emit("status", {
		status: "WON!",
		targetSocketId: targetMember.socketId
	});
	targetMember.isPlaying = false;
	users.get(targetMember.socketId)?.socket.leave(playingMembersRoom);
}
export function declareLoser(targetMember:GameMember, membersRoom:string, playingMembersRoom:string) {
	io.to(targetMember.socketId).emit('disableAllSuits');
	io.to(membersRoom).emit("status", {
		status: "BHABI!",
		targetSocketId: targetMember.socketId
	});
	targetMember.isPlaying = false;
	users.get(targetMember.socketId)?.socket.leave(playingMembersRoom);
}
export function tellUserAboutGame(userSocket:Socket, gameId:SocketId, userIndexInGame:number) {
	userSocket.emit('gameInfo', {
		gameId: gameId,
		maxNoOfPlayers: games.get(gameId)?.maxNoOfPlayers,
		members: games.get(gameId)?.members.map(({ socketId }) => { return new FrontEndUser(socketId, users.get(socketId)?.name, 0); }),
		currentUserIndex: userIndexInGame,
	});
}
export function shiftCardOnClientSide(card:Card, leftoutPlayer:GameMember,senior:GameMember,membersRoom:string) {
	io.to(leftoutPlayer.socketId).emit('removeCard',card);
	io.to(senior.socketId).emit('addCard', card);
	io.to(membersRoom).emit("changeCardsCount", {
		targetSocketId: senior.socketId,
		newCardCount: senior.cards.length
	});
	io.to(membersRoom).emit("changeCardsCount", {
		targetSocketId: leftoutPlayer.socketId,
		newCardCount: leftoutPlayer.cards.length
	});
}