import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, Image } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import tw from 'tailwind-react-native-classnames';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ref, onValue } from 'firebase/database';
import { database } from '../../../../../firebase.config'; // Correct path
import axios from 'axios'; // Import axios
import Loader from '../../../../components/Loader';

const MapScreen = () => {
  const [busLocation, setBusLocation] = useState(null);
  const [busHeading, setBusHeading] = useState(0);
  const [busID, setBusID] = useState(null);
  const [schoolID, setSchoolID] = useState(null);
  const [tripID, setTripID] = useState(null);
  const [loading, setLoading] = useState(true);
  const [eta, setEta] = useState(null);
  const [route, setRoute] = useState(null); // Store route information
  const [prevLocation, setPrevLocation] = useState(null); // Store previous location
  const [busSpeed, setBusSpeed] = useState(0); // Store the calculated speed

  // Static location of TKR College
  const tkrCollegeLocation = {
    latitude: 17.324011659596977,  // Replace with TKR College's actual latitude
    longitude: 78.53910916463558,
  };

  // Google Maps Directions API key (replace with your own API key)
  const googleMapsApiKey = 'AIzaSyBjtpKDllff6rIJhy3TW8mt84Ix2RE9Y-4';

  // Haversine formula to calculate distance between two points
  const haversineDistance = (lat1, lon1, lat2, lon2) => {
    const toRad = (deg) => deg * (Math.PI / 180);
    const R = 6371; // Earth's radius in km

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km

    return distance;
  };

  // Fetch data from AsyncStorage
  useEffect(() => {
    const fetchData = async () => {
      try {
        const storedBusID = await AsyncStorage.getItem('busID');
        const storedSchoolID = await AsyncStorage.getItem('schoolID');
        const storedTripID = await AsyncStorage.getItem('tripID');

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
      const locationRef = ref(database, `schools/${schoolID}/buses/${busID}/trips/${tripID}/location`);

      const unsubscribe = onValue(locationRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();

          if (data.latitude && data.longitude) {
            const busLat = data.latitude;
            const busLon = data.longitude;

            setBusLocation({
              latitude: busLat,
              longitude: busLon,
            });
            setBusHeading(data.heading || 0); // Use heading or default to 0

            if (prevLocation) {
              const distance = haversineDistance(busLat, busLon, prevLocation.latitude, prevLocation.longitude);
              const timeElapsed = (Date.now() - prevLocation.timestamp) / 1000 / 60 / 60; // Time in hours
              const speed = distance / timeElapsed; // Speed in km/h
              setBusSpeed(speed.toFixed(2)); // Update bus speed
            }

            // Update previous location with current one
            setPrevLocation({
              latitude: busLat,
              longitude: busLon,
              timestamp: Date.now(),
            });

            // Calculate ETA
            const distanceToDestination = haversineDistance(busLat, busLon, tkrCollegeLocation.latitude, tkrCollegeLocation.longitude);
            const time = (distanceToDestination / busSpeed) * 60; // Time in minutes
            setEta(Math.round(time)); // Set ETA in minutes

            // Fetch the route from Google Maps Directions API
            fetchRoute(busLat, busLon, tkrCollegeLocation.latitude, tkrCollegeLocation.longitude);
          } else {
            console.warn("Missing latitude or longitude in Firebase data");
          }
        } else {
          console.warn("No data available at this Firebase path");
        }
        setLoading(false);
      });

      return () => unsubscribe(); // Unsubscribe listener on cleanup
    }
  }, [busID, schoolID, tripID, prevLocation, busSpeed]);

  // Fetch the route from Google Maps Directions API
  const fetchRoute = async (startLat, startLon, endLat, endLon) => {
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${startLat},${startLon}&destination=${endLat},${endLon}&key=${googleMapsApiKey}&mode=driving`;

    try {
      const response = await axios.get(url);
      if (response.data.routes.length > 0) {
        const polyline = response.data.routes[0].overview_polyline.points;
        const decodedRoute = decodePolyline(polyline); // Decode the polyline to get accurate route coordinates
        setRoute(decodedRoute); // Set the decoded route as an array of coordinates
      }
    } catch (error) {
      console.error("Error fetching route:", error);
    }
  };

  const decodePolyline = (encoded) => {
    let polyline = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < encoded.length) {
      let result = 0;
      let shift = 0;
      let byte;
      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);

      let deltaLat = ((result & 1) ? ~(result >> 1) : result >> 1);
      lat += deltaLat;

      result = 0;
      shift = 0;
      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);

      let deltaLng = ((result & 1) ? ~(result >> 1) : result >> 1);
      lng += deltaLng;

      polyline.push({
        latitude: lat / 1e5,
        longitude: lng / 1e5,
      });
    }
    return polyline;
  };

  if (loading) {
    return <Loader />;
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
          <Marker coordinate={busLocation} title="Bus Location" anchor={{ x: 0.5, y: 0.5 }}>
            <Image
              source={require('../../../../assets/icons/bus.png')}
              style={{
                width: 50,
                height: 30,
                transform: [{ rotate: `${busHeading}deg` }],
              }}
            />
          </Marker>
        )}
  
        {/* Marker for TKR College */}
        <Marker coordinate={tkrCollegeLocation} title="TKR College" />
  
        {/* Render the route using Polyline if available */}
        {route && (
          <Polyline
            coordinates={route} 
            strokeColor="#2A73E8" 
            strokeWidth={5}       
          />
        )}
      </MapView>
  
      <View style={tw`h-8 w-24 bg-green-500 rounded-lg absolute top-5 left-5 flex items-center justify-center`}>
        <Text style={tw`font-bold text-lg text-white`}>
          {eta !== null  && eta !== Infinity ? `🕒 ${eta} Min` : '🕒 Load...'}
        </Text>
        
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
});

export default MapScreen;
