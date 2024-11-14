import { View, Text, Image } from 'react-native'
import React from 'react'

const MapScreen = () => {
  return (
    <View style={{ flex: 1, backgroundColor: 'blue' }}>
      <Image style={{ width: '100%', height: '100%', resizeMode: 'cover'}} source={require('../../../../assets/images/demobustrack.jpg')}  />
    </View>
  )
}

export default MapScreen