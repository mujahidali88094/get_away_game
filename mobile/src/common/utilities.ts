import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
