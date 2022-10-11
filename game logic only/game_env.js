"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
exports.__esModule = true;
var utilities_1 = require("./utilities");
var constants_1 = require("./constants");
var GameMember = /** @class */ (function () {
    function GameMember(idx) {
        this.cards = [];
        this.isPlaying = true;
        this.index = idx;
    }
    GameMember.prototype.hasAceOfSpades = function () {
        for (var i = 0; i < this.cards.length; i++) {
            var card = this.cards[i];
            if (card.number == 'A' && card.suit == '♠')
                return true;
        }
        return false;
    };
    GameMember.prototype.hasSuit = function (suit) {
        for (var i = 0; i < this.cards.length; i++)
            if (this.cards[i].suit == suit)
                return true;
        return false;
    };
    GameMember.prototype.removeCard = function (card) {
        var index = (0, utilities_1.findIndexOfCard)(card, this.cards);
        if (index > -1)
            this.cards.splice(index, 1);
    };
    return GameMember;
}());
;
var Game = /** @class */ (function () {
    function Game(maxNoOfPlayers) {
        this.members = [];
        this.maxNoOfPlayers = maxNoOfPlayers;
        for (var i = 0; i < maxNoOfPlayers; i++) {
            this.members.push(new GameMember(i));
        }
    }
    Game.prototype.setStarter = function (index) {
        this.starter = index;
    };
    Game.prototype.findNextPlayingMember = function (current) {
        var currentIndex = this.members.indexOf(current);
        var length = this.members.length;
        for (var i = 1; i < length; i++) { //loop starts from 1 because we have to find next person not current one again
            var targetIndex = currentIndex + i;
            targetIndex = (0, utilities_1.mod)(targetIndex, length);
            if (this.members[targetIndex].isPlaying)
                return this.members[targetIndex];
        }
        return null;
    };
    Game.prototype.countPlayingMembers = function () {
        var playingMembersCount = 0;
        this.members.forEach(function (member) {
            if (member.isPlaying) {
                playingMembersCount += 1;
            }
        });
        return playingMembersCount;
    };
    Game.prototype.getPlayersWithNonZeroCards = function () {
        var players = [];
        this.members.forEach(function (member) {
            if (member.isPlaying && member.cards.length > 0) {
                players.push(member);
            }
        });
        return players;
    };
    Game.prototype.getSenior = function (pile) {
        var _highestCardNumber = '2', senior = null;
        for (var i = 0; i < pile.length; i++) {
            var cardValue = constants_1.NUMBER_VALUE_MAP.get(pile[i].card.number);
            var highestCardValue = constants_1.NUMBER_VALUE_MAP.get(_highestCardNumber);
            if (cardValue == undefined || highestCardValue == undefined)
                return null;
            else if (cardValue >= highestCardValue) {
                _highestCardNumber = pile[i].card.number;
                senior = pile[i].cardOwner;
            }
        }
        return senior;
    };
    Game.prototype.determineFuture = function (pile) {
        var senior = this.getSenior(pile), gameHasEnded = false, playersWithNonZeroCards = this.getPlayersWithNonZeroCards();
        if (senior === null)
            throw new Error('Unable to find Senior');
        if (playersWithNonZeroCards.length == 0) {
            //winners
            this.members.forEach(function (member) {
                if (member != senior)
                    declareWinner(member);
            });
            //loser
            declareLoser(senior);
            gameHasEnded = true;
        }
        else if (playersWithNonZeroCards.length == 1) {
            var leftoutPlayer_1 = playersWithNonZeroCards[0];
            if (senior == leftoutPlayer_1) {
                //winners
                this.members.forEach(function (member) {
                    if (member != senior)
                        declareWinner(member);
                });
                //loser
                declareLoser(senior);
                gameHasEnded = true;
            }
            else {
                //winners
                this.members.forEach(function (member) {
                    if (member != senior && member != leftoutPlayer_1)
                        declareWinner(member);
                });
                //give one card of leftoutPlayer to senior
                var randomIndex = (Math.floor(Math.random()) * 100) % leftoutPlayer_1.cards.length;
                var pickedCard = leftoutPlayer_1.cards[randomIndex];
                //shift picked card (on server side)
                senior.cards = __spreadArray(__spreadArray([], senior.cards, true), [pickedCard], false);
                leftoutPlayer_1.cards.splice(randomIndex, 1);
                gameHasEnded = false;
            }
        }
        else {
            //winners
            this.members.forEach(function (member) {
                if (playersWithNonZeroCards.indexOf(member) == -1)
                    declareWinner(member);
            });
            //determine senior from remaining pile
            pile = pile.filter(function (_a) {
                var cardOwner = _a.cardOwner;
                return (playersWithNonZeroCards.indexOf(cardOwner) > -1);
            });
            senior = this.getSenior(pile);
            gameHasEnded = false;
        }
        return {
            gameHasEnded: gameHasEnded,
            senior: senior
        };
    };
    Game.prototype.determineFutureAfterThola = function () {
        var playersWithNonZeroCards = this.getPlayersWithNonZeroCards();
        //winners
        this.members.forEach(function (member) {
            if (playersWithNonZeroCards.indexOf(member) == -1)
                declareWinner(member);
        });
        //loser
        if (playersWithNonZeroCards.length == 1) {
            declareLoser(playersWithNonZeroCards[0]);
            return true;
        }
        return false;
    };
    return Game;
}());
;
var noOfPlayers = 4;
var game = new Game(noOfPlayers);
handleTheGame(game);
function handleTheGame(game) {
    return __awaiter(this, void 0, void 0, function () {
        var gameEndedSuccessfully;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    distributeCards(game);
                    return [4 /*yield*/, playTheGame(game)];
                case 1:
                    gameEndedSuccessfully = _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function distributeCards(game) {
    var deck = (0, utilities_1.createDeck)();
    (0, utilities_1.shuffle)(deck);
    var i = 0;
    while (i < game.maxNoOfPlayers) {
        var remainingMembersCount = game.maxNoOfPlayers - i;
        var division = Math.floor(deck.length / remainingMembersCount);
        var currentUserCards = deck.slice(0, division);
        game.members[i].cards = currentUserCards;
        if (game.starter === undefined)
            if (game.members[i].hasAceOfSpades())
                game.setStarter(i);
        deck.splice(0, division);
        i++;
    }
}
function playTheGame(game) {
    return __awaiter(this, void 0, void 0, function () {
        var turnHolder, senior, pile, validSuits, throwingThola, isFirstRound, roundNumber, _loop_1, state_1;
        return __generator(this, function (_a) {
            turnHolder = game.members[game.starter];
            senior = game.members[game.starter];
            pile = [];
            validSuits = [];
            throwingThola = false;
            isFirstRound = true;
            roundNumber = 1;
            _loop_1 = function () {
                var _b;
                //setValidSuits
                if (pile.length === 0)
                    validSuits = constants_1.ALL_SUITS;
                else {
                    validSuits = [pile[0].card.suit];
                    if (turnHolder.hasSuit(validSuits[0]))
                        throwingThola = false;
                    else {
                        validSuits = constants_1.ALL_SUITS;
                        if (!isFirstRound) //not in very first turn
                            throwingThola = true;
                    }
                }
                var thrownCard = void 0, response = void 0;
                var validCards = turnHolder.cards.filter(function (card) { return validSuits.indexOf(card.suit) !== -1; });
                var tempCard = validCards[validCards.length - 1];
                response = { type: 'throwCard', card: tempCard };
                if (!response.card)
                    throw new Error('Card not found in the response');
                thrownCard = response.card;
                //remove card
                turnHolder.removeCard(thrownCard);
                //add to pile
                pile.push({
                    card: thrownCard,
                    cardOwner: turnHolder
                });
                // let the thola roll
                if (throwingThola) {
                    throwingThola = false;
                    var cards_1 = [];
                    pile.forEach(function (_a) {
                        var card = _a.card;
                        cards_1.push(card);
                    }); //get cards from pile
                    (_b = senior.cards).push.apply(_b, cards_1);
                    //empty the pile
                    pile = [];
                    var gameHasEnded = game.determineFutureAfterThola();
                    if (gameHasEnded)
                        return "break";
                    // for next turn
                    turnHolder = senior;
                    roundNumber += 1;
                    return "continue";
                }
                //else
                //check if a round has completed
                if (pile.length == game.countPlayingMembers()) {
                    if (isFirstRound)
                        isFirstRound = false;
                    var future = game.determineFuture(pile);
                    var gameHasEnded = future.gameHasEnded;
                    if (future.senior)
                        senior = future.senior;
                    pile = [];
                    if (gameHasEnded)
                        return "break";
                    turnHolder = senior;
                    roundNumber += 1;
                    return "continue";
                }
                //normal next turn
                var temp2 = game.findNextPlayingMember(turnHolder);
                if (temp2 == null)
                    throw new Error("Playing member not found yet game is continuing");
                turnHolder = temp2;
            };
            while (true) {
                state_1 = _loop_1();
                if (state_1 === "break")
                    break;
            }
            console.log("A game took ", roundNumber, " rounds");
            return [2 /*return*/, true]; //game ended successfully
        });
    });
}
function declareWinner(targetMember) {
    targetMember.isPlaying = false;
}
function declareLoser(targetMember) {
    targetMember.isPlaying = false;
    console.log(targetMember.index, ' is the Babhi');
}
