import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text, Image } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import tw from 'tailwind-react-native-classnames';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ref, onValue } from 'firebase/database';
import { database } from '../../../../../firebase.config';
import axios from 'axios';
import Loader from '../../../../components/Loader';
import Constants from 'expo-constants'; // Ensure Constants is imported

const MapScreen = () => {
  const [busLocation, setBusLocation] = useState(null);
  const [busHeading, setBusHeading] = useState(0);
  const [busSpeed, setBusSpeed] = useState(0);
  const [route, setRoute] = useState([]);
  const [eta, setEta] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [studentPickupLocation, setStudentPickupLocation] = useState(null);
  const [loading, setLoading] = useState(true);

  // IDs
  const [schoolID, setSchoolID] = useState(null);
  const [busID, setBusID] = useState(null);
  const [tripID, setTripID] = useState(null);
  const [studentID, setStudentID] = useState(null);

  // Map reference
  const mapRef = useRef(null);

  // Decode polyline
  const decodePolyline = (encoded) => {
    const polyline = require('polyline');
    return polyline.decode(encoded).map(([latitude, longitude]) => ({ latitude, longitude }));
  };

  // Fetch route from Google Directions API
  const fetchRoute = async (startLat, startLon, endLat, endLon) => {
    const googleMapsApiKey = Constants.expoConfig.android.config.googleMaps.apiKey; // Ensure key is valid
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${startLat},${startLon}&destination=${endLat},${endLon}&key=${googleMapsApiKey}&mode=driving`;

    try {
      const response = await axios.get(url);
      if (response.data.routes.length > 0) {
        const polyline = response.data.routes[0].overview_polyline.points;
        const decodedRoute = decodePolyline(polyline);
        setRoute(decodedRoute);

        const duration = response.data.routes[0].legs[0].duration.value; // Duration in seconds
        setEta(Math.round(duration / 60)); // Convert to minutes

        // Fit route to map
        mapRef.current?.fitToCoordinates(decodedRoute, {
          edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
          animated: true,
        });
      }
    } catch (error) {
      console.error('Error fetching route:', error.response?.data || error.message);
    }
  };

  const fetchIDs = async () => {
    try {
      const storedSchoolID = await AsyncStorage.getItem('schoolID');
      const storedBusID = await AsyncStorage.getItem('busID');
      const storedTripID = await AsyncStorage.getItem('tripID');
      const storedStudentID = await AsyncStorage.getItem('studentID');
      
      // Remove extra quotes if they exist by parsing
      const parsedSchoolID = storedSchoolID ? JSON.parse(storedSchoolID) : null;
      const parsedBusID = storedBusID ? JSON.parse(storedBusID) : null;
      const parsedTripID = storedTripID ? JSON.parse(storedTripID) : null;
      const parsedStudentID = storedStudentID ? JSON.parse(storedStudentID) : null;
  
      console.log('Fetched IDs:', { parsedSchoolID, parsedBusID, parsedTripID, parsedStudentID });
  
      if (parsedSchoolID && parsedBusID && parsedTripID && parsedStudentID) {
        setSchoolID(parsedSchoolID);
        setBusID(parsedBusID);
        setTripID(parsedTripID);
        setStudentID(parsedStudentID);
      } else {
        console.error('IDs not found in AsyncStorage.');
      }
    } catch (error) {
      console.error('Error fetching IDs from AsyncStorage:', error);
    }
  };
  
  // Fetch locations from Firebase
  useEffect(() => {
    if (!schoolID || !busID || !tripID || !studentID) return; // Ensure IDs are loaded

    const fetchData = () => {
      try {
        const studentLocationRef = ref(database, `schools/${schoolID}/buses/${busID}/trips/${tripID}/students/${studentID}/pickupLocation`);
        const unsubscribeStudent = onValue(studentLocationRef, (snapshot) => {
          if (snapshot.exists()) {
            console.log("Student Pickup Location Snapshot:", snapshot.val());
            const [latitude, longitude] = snapshot.val().split(',').map(Number);
            setStudentPickupLocation({ latitude, longitude });
          }
        });

        const driverLocationRef = ref(
          database,
          `schools/${schoolID}/buses/${busID}/trips/${tripID}/location`
        );
        
        console.log('Driver Location Path:', `schools/${schoolID}/buses/${busID}/trips/${tripID}/location`);
        
        const unsubscribeDriver = onValue(driverLocationRef, (snapshot) => {
          if (snapshot.exists()) {
            const { latitude, longitude, heading, speed, accuracy, timestamp } = snapshot.val();
            console.log('Driver Location Data:', { latitude, longitude, heading, speed, accuracy, timestamp });
        
            const driverCoords = {
              latitude: parseFloat(latitude),
              longitude: parseFloat(longitude),
            };
        
            setDriverLocation(driverCoords);
            setBusHeading(heading || 0);
            setBusSpeed(speed || 0);
        
            console.log('Processed Driver Coordinates:', driverCoords);
          } else {
            console.warn('No driver location data found at the path.');
            console.log('Snapshot Data:', snapshot.val()); // Log the snapshot data to see if it's returning anything.
          }
        });
        
        return () => {
          unsubscribeStudent();
          unsubscribeDriver();
        };
      } catch (error) {
        console.error('Error fetching location data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [schoolID, busID, tripID, studentID]);

  useEffect(() => {
    fetchIDs();
  }, []);

  useEffect(() => {
    if (driverLocation && studentPickupLocation) {
      fetchRoute(driverLocation.latitude, driverLocation.longitude, studentPickupLocation.latitude, studentPickupLocation.longitude);
    }
  }, [driverLocation, studentPickupLocation]);

  // Calculate adjusted driver position
  const adjustDriverLocation = (latitude, longitude, heading) => {
    const R = 6371; // Radius of Earth in km
    const distance = 0.001; // Small distance to shift (about 1 meter)

    // Convert heading to radians
    const headingRadians = (heading * Math.PI) / 180;

    // Calculate adjusted coordinates
    const deltaLat = (distance / R) * (180 / Math.PI);
    const deltaLon = (distance / R) * (180 / Math.PI) / Math.cos((latitude * Math.PI) / 180);

    // Adjust coordinates based on the heading
    const adjustedLatitude = latitude - deltaLat * Math.cos(headingRadians);
    const adjustedLongitude = longitude - deltaLon * Math.sin(headingRadians);

    return { latitude: adjustedLatitude, longitude: adjustedLongitude };
  };

  if (loading) {
    return <Loader />;
  }

  const adjustedDriverLocation = driverLocation
    ? adjustDriverLocation(driverLocation.latitude, driverLocation.longitude, busHeading)
    : null;

  return (
    <View style={styles.container}>
     <MapView
  ref={mapRef} 
  style={styles.map}
  initialRegion={{
    latitude: driverLocation ? driverLocation.latitude : 17.385044, // Use driver location or default
    longitude: driverLocation ? driverLocation.longitude : 78.486671, // Use driver location or default
    latitudeDelta: 0.05, // Adjust this value based on zoom level
    longitudeDelta: 0.05, // Adjust this value based on zoom level
  }}
  showsUserLocation={false} // Optionally show the user's location
>
        {adjustedDriverLocation && (
  <Marker
    coordinate={adjustedDriverLocation}
    title="Bus Location"
    anchor={{ x: 0.5, y: 0.5 }} // You can adjust this to move the marker as needed
  >
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


{studentPickupLocation && (
  <Marker coordinate={studentPickupLocation} title="Pickup Location">
    <Image
      source={require('../../../../assets/icons/home.png')} // Custom marker image
      style={{ width: 40, height: 40 }} // Adjust size as needed
    />
  </Marker>
)}


        {route.length > 0 && <Polyline coordinates={route} strokeColor="#2A73E8" strokeWidth={5} />}
      </MapView>

      <View style={tw`h-8 w-24 bg-green-500 rounded-lg absolute top-5 left-5 flex items-center justify-center`}>
        <Text style={tw`font-bold text-lg text-white`}>
          {eta !== null && eta !== Infinity ? `🕒 ${eta} Min` : '🕒 Load...'}
        </Text>
      </View>

      {/* <View style={tw`h-8 w-32 bg-blue-500 rounded-lg absolute bottom-5 right-5 flex items-center justify-center`}>
        <Text style={tw`font-bold text-lg text-white`}>{`🚗 ${busSpeed} km/h`}</Text>
      </View> */}
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
