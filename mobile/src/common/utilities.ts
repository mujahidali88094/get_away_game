import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {CardSuit, CardType} from './types';
import {ALL_SUITS, NUMBER_VALUE_MAP} from './constants';

declare type ToastType = 'info' | 'success' | 'error' | 'any';
export const showToast = (type: ToastType, text1: string, text2?: string) => {
  Toast.show({
    type,
    text1,
    text2,
    visibilityTime: 2000,
    autoHide: true,
    topOffset: 30,
    bottomOffset: 40,
  });
};
export const storeData = async (key: string, value: string) => {
  try {
    await AsyncStorage.setItem(key, value);
  } catch (e) {
    console.log('Error setting value from AsyncStorage');
  }
};
export const getData = async (key: string) => {
  try {
    const value = await AsyncStorage.getItem(key);
    return value;
  } catch (e) {
    console.log('Error getting value from AsyncStorage');
  }
};

function compare(a: CardType, b: CardType) {
  //custom compare func for cards sort
  let suits: CardSuit[] = ALL_SUITS;
  if (a.suit === b.suit) {
    let valueOfA = NUMBER_VALUE_MAP.get(a.number);
    let valueOfB = NUMBER_VALUE_MAP.get(b.number);
    if (!valueOfA || !valueOfB) {
      return -1;
    }
    if (valueOfA < valueOfB) {
      return -1;
    } else {
      return 1;
    }
  } else if (suits.indexOf(a.suit) < suits.indexOf(b.suit)) {
    return -1;
  } else {
    return 1;
  }
}
export function getArrangedCards(cards: CardType[]) {
  cards.sort(compare);
  return cards;
}
