import { View, Text } from 'react-native'
import React from 'react'
import tw from 'tailwind-react-native-classnames'

const App = () => {
  return (
    <View style={tw`font-bold flex-1 bg-green-400 `}>
      <Text>App</Text>
    </View>
  )
}

export default App