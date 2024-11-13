import React, { useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import tw from 'tailwind-react-native-classnames';
import * as Location from 'expo-location';

const MapScreen = () => {

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission to access location was denied');
      }
    })();
  }, []);

  const locations = [
    { id: 1, title: 'Charminar', latitude: 17.3616, longitude: 78.4747 },
    { id: 2, title: 'HITEC City', latitude: 17.4483, longitude: 78.3915 },
    { id: 3, title: 'Golconda Fort', latitude: 17.3833, longitude: 78.4011 },
    { id: 4, title: 'Nehru Zoological Park', latitude: 17.3520, longitude: 78.4521 },
    { id: 5, title: 'Hussain Sagar', latitude: 17.4239, longitude: 78.4738 },
  ];

  return (
    <View style={styles.container}>
      
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 17.385044,
          longitude: 78.486671,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
      >
        {locations.map((location) => (
          <Marker
            key={location.id}
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            title={location.title}
          />
        ))}
      </MapView>

      <View style={tw`h-10 w-24 bg-green-500 rounded-lg absolute top-5 left-5 flex items-center justify-center`}>
        <Text style={tw`font-bold text-lg text-white`}>🕒 5 Min</Text>
      </View>
    </View>
  );
};

export default MapScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
});
