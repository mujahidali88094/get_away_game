import { CHOICES, SUITS } from "./constants";
import { GameMember } from "./classes";

export declare type SocketId = string;
export type ChoiceFromFrontend = {
  choice: typeof CHOICES.CREATE_GAME | typeof CHOICES.JOIN_ANY_GAME | typeof CHOICES.JOIN_FRIENDS  ,
  name: string,
  gameId: SocketId,
  noOfPlayers: number
};

export type CardNumber = 'A' | 'K' | 'Q' | 'J' | '10' | '9' | '8' | '7' | '6' | '5' | '4' | '3' | '2';
export type CardSuit = typeof SUITS.HEART | typeof SUITS.CLUB | typeof SUITS.DIAMOND | typeof SUITS.SPADE;
export type Card = {
  number: CardNumber;
  suit: CardSuit;
};

export type PileCard = {
  card: Card,
  cardOwner: GameMember
}

export type ResponseOnTurn = {
  type: 'takeCards' | 'throwCard',
  card?: Card
}