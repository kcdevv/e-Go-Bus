import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Text, Animated } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import tw from 'tailwind-react-native-classnames';
import Loader from '../../../../components/Loader'; // Assuming you have a Loader component
import requestLocationPermission from '../services/locationService';
import fetchAsyncStorageData from '../services/asyncStorageService';
import fetchBusLocation from '../services/firebaseService';

const MapScreen = () => {
  const [busLocation, setBusLocation] = useState(null);
  const [busHeading, setBusHeading] = useState(0);
  const [busID, setBusID] = useState(null);
  const [schoolID, setSchoolID] = useState(null);
  const [tripID, setTripID] = useState(null);
  const [loading, setLoading] = useState(true);
  const rotateAnim = useRef(new Animated.Value(0)).current; // Animation reference for smooth rotation

  useEffect(() => {
    const fetchData = async () => {
      await fetchAsyncStorageData(setBusID, setSchoolID, setTripID);
    };
    fetchData();
  }, []);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  useEffect(() => {
    if (busID && schoolID && tripID) {
      const unsubscribe = fetchBusLocation(busID, schoolID, tripID, setBusLocation, setBusHeading, setLoading);
      return unsubscribe; // Cleanup on unmount
    }
  }, [busID, schoolID, tripID]);

  useEffect(() => {
    // Smoothly animate rotation when bus heading changes
    Animated.timing(rotateAnim, {
      toValue: busHeading,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [busHeading]);

  if (loading || !busLocation) {
    return <Loader />;
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: busLocation.latitude,
          longitude: busLocation.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation
        rotateEnabled // Enable map rotation
      >
        {busLocation && (
          <Marker coordinate={busLocation} anchor={{ x: 0.5, y: 0.5 }} title="Bus Location">
            <Animated.Image
              source={require('../../../../assets/icons/bus.png')}
              style={[
                styles.markerImage,
                {
                  transform: [
                    {
                      rotate: rotateAnim.interpolate({
                        inputRange: [0, 360],
                        outputRange: ['0deg', '360deg'], // Ensure smooth rotation
                      }),
                    },
                  ],
                },
              ]}
            />
          </Marker>
        )}
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
  markerImage: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
});
