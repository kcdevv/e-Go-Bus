import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, Image, ActivityIndicator } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import tw from 'tailwind-react-native-classnames';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { database } from '../../../../../firebase.config'; // Adjust the import path
import { ref, onValue } from 'firebase/database';
import Loader from '../../../../components/Loader'; // Assuming you have a Loader component

const MapScreen = () => {
  const [busLocation, setBusLocation] = useState(null);
  const [busHeading, setBusHeading] = useState(0); // Store heading
  const [busID, setBusID] = useState(null);
  const [schoolID, setSchoolID] = useState(null);
  const [tripID, setTripID] = useState(null);
  const [loading, setLoading] = useState(true); // Loading state

  // Fetch data from AsyncStorage
  useEffect(() => {
    const fetchData = async () => {
      try {
        const storedBusID = await AsyncStorage.getItem('busID');
        const storedSchoolID = await AsyncStorage.getItem('schoolID');
        const storedTripID = await AsyncStorage.getItem('tripID');
  
        // Sanitize retrieved values by trimming and removing quotes
        if (storedBusID && storedSchoolID && storedTripID) {
          setBusID(storedBusID.replace(/"/g, '').trim());
          setSchoolID(storedSchoolID.replace(/"/g, '').trim());
          setTripID(storedTripID.replace(/"/g, '').trim());
        } else {
          alert('Missing required data in AsyncStorage.');
        }
      } catch (error) {
        console.error('Error fetching data from AsyncStorage', error);
      }
    };
  
    fetchData();
  }, []);
  

  // Request location permissions
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission to access location was denied');
      }
    })();
  }, []);

  // Fetch location and heading from Firebase
  useEffect(() => {
    if (busID && schoolID && tripID) {
      console.log("School ID:", schoolID);
      console.log("Bus ID:", busID);
      console.log("Trip ID:", tripID);

      // Correct Firebase path with trip ID
      const locationRef = ref(database, `schools/${schoolID}/buses/${busID}/trips/${tripID}/location`);
      console.log(`schools/${schoolID}/buses/${busID}/trips/${tripID}/location`);
      
      const unsubscribe = onValue(locationRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          console.log("Fetched data:", data);

          if (data.latitude && data.longitude) {
            setBusLocation({
              latitude: data.latitude,
              longitude: data.longitude,
            });
            setBusHeading(data.heading || 0); // Use heading or default to 0
          } else {
            console.warn("Missing latitude or longitude in Firebase data");
          }
        } else {
          console.warn("No data available at this Firebase path");
        }
        setLoading(false); // Stop loading once data is fetched
      });

      return () => unsubscribe(); // Unsubscribe listener on cleanup
    }
  }, [busID, schoolID, tripID]);

  if (loading) {
    return (
      <Loader />
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 17.385044,
          longitude: 78.486671,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {busLocation && (
          <Marker
            coordinate={busLocation}
            title="Bus Location"
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <Image
              source={require('../../../../assets/icons/bus.png')}
              style={{
                width: 50,
                height: 50,
                transform: [{ rotate: `${busHeading}deg` }], // Rotate based on heading
              }}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
});