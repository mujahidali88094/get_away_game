import React from 'react';
import {View, Text} from 'react-native';

export const Header = ({textColor = 'white'}: {textColor?: string}) => {
  return (
    <View>
      <Text
        style={{
          color: textColor,
          fontSize: 30,
          fontFamily: 'consolas',
        }}>
        Just Get Away
      </Text>
    </View>
  );
};
