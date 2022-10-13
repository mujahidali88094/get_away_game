import {CardNumber, CardSuit} from './types';

export const USERNAME_KEY = 'username';
export const SUITS = {
  HEART: '♥',
  DIAMOND: '♦',
  CLUB: '♣',
  SPADE: '♠',
};
export const ALL_SUITS: CardSuit[] = [
  SUITS.SPADE,
  SUITS.DIAMOND,
  SUITS.CLUB,
  SUITS.HEART,
];
export const ALL_NUMBERS: CardNumber[] = [
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  'J',
  'Q',
  'K',
  'A',
];

export const CHOICES = {
  JOIN_ANY_GAME: 'Join Random Game',
  JOIN_FRIENDS: 'Join Friends',
  CREATE_GAME: 'Start A New Game',
};
export const DEFAULT_NO_OF_PLAYERS = 4;

export const NUMBER_VALUE_MAP = new Map<CardNumber, number>();
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
