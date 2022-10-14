import {CHOICES, SUITS} from './constants';

export declare type SocketId = string;
export type ChoiceFromFrontend = {
  choice:
    | typeof CHOICES.CREATE_GAME
    | typeof CHOICES.JOIN_ANY_GAME
    | typeof CHOICES.JOIN_FRIENDS;
  name: string;
  gameId: SocketId;
  noOfPlayers: number;
};
export type Member = {
  socketId: SocketId;
  name: string;
  cardCount: number;
  card?: CardType | null;
  status?: string | null;
};

export type CardNumber =
  | 'A'
  | 'K'
  | 'Q'
  | 'J'
  | '10'
  | '9'
  | '8'
  | '7'
  | '6'
  | '5'
  | '4'
  | '3'
  | '2';
export type CardSuit =
  | typeof SUITS.HEART
  | typeof SUITS.CLUB
  | typeof SUITS.DIAMOND
  | typeof SUITS.SPADE;
export type CardType = {
  number: CardNumber;
  suit: CardSuit;
};

// export type CardsContextType = {
//   name: string;
//   changeName: (newName: string) => void;
//   mySocket: Socket;
//   gameId: SocketId;
//   setGameId: (gameId: SocketId) => void;
//   maxNoOfPlayers: number;
//   setMaxNoOfPlayers: (maxNoOfPlayers: number) => void;
//   cards: Card[];
//   setCards: (cards: Card[]) => void;
//   myIndex: number;
//   setMyIndex: (myIndex: number) => void;
//   members: string[];
//   setMembers: (members: string[]) => void;
// };
