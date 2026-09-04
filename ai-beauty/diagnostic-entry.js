import React from 'react';
import { View, Text } from 'react-native';
import { registerRootComponent } from 'expo';

function App() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>AI Beauty diagnostic OK</Text>
    </View>
  );
}

registerRootComponent(App);
