import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text, Image } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import tw from 'tailwind-react-native-classnames';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ref, onValue } from 'firebase/database';
import { database } from '../../../../../firebase.config';
import axios from 'axios';
import Loader from '../../../../components/Loader';
import Constants from 'expo-constants';
import _ from 'lodash';

const MapScreen = () => {
  const [busLocation, setBusLocation] = useState(null);
  const [busHeading, setBusHeading] = useState(0);
  const [busSpeed, setBusSpeed] = useState(0); // Calculated speed
  const [busID, setBusID] = useState(null);
  const [schoolID, setSchoolID] = useState(null);
  const [tripID, setTripID] = useState(null);
  const [loading, setLoading] = useState(true);
  const [eta, setEta] = useState(null);
  const [route, setRoute] = useState(null);
  const [prevLocation, setPrevLocation] = useState(null);
  const [prevTimestamp, setPrevTimestamp] = useState(null); // For time difference calculation

  const mapRef = useRef(null);

  const tkrCollegeLocation = {
    latitude: 17.324011659596977,
    longitude: 78.53910916463558,
  };

  const googleMapsApiKey = Constants.expoConfig.android.config.googleMaps.apiKey;

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

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission to access location was denied');
      }
    })();
  }, []);

  const haversineDistance = (lat1, lon1, lat2, lon2) => {
    const toRad = (deg) => deg * (Math.PI / 180);
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); // Distance in km
  };

  const calculateSpeed = (newLocation, newTimestamp) => {
    if (prevLocation && prevTimestamp) {
      const distance = haversineDistance(
        prevLocation.latitude,
        prevLocation.longitude,
        newLocation.latitude,
        newLocation.longitude
      ); // Distance in km

      const timeElapsed = (newTimestamp - prevTimestamp) / 3600; // Time in hours
      const speed = timeElapsed > 0 ? (distance / timeElapsed) : 0; // Speed in km/h
      setBusSpeed(Math.round(speed)); // Update state with rounded speed
    }
    setPrevLocation(newLocation); // Update previous location
    setPrevTimestamp(newTimestamp); // Update previous timestamp
  };

  const fetchRoute = async (startLat, startLon, endLat, endLon) => {
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${startLat},${startLon}&destination=${endLat},${endLon}&key=${googleMapsApiKey}&mode=driving&departure_time=now&traffic_model=best_guess`;

    try {
      const response = await axios.get(url);
      if (response.data.routes.length > 0) {
        const polyline = response.data.routes[0].overview_polyline.points;
        setRoute(decodePolyline(polyline));

        const duration = response.data.routes[0].legs[0].duration;
        setEta(Math.round(duration.value / 60)); // Convert seconds to minutes
      }
    } catch (error) {
      console.error('Error fetching route:', error);
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

      let deltaLat = (result & 1) ? ~(result >> 1) : result >> 1;
      lat += deltaLat;

      result = 0;
      shift = 0;
      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);

      let deltaLng = (result & 1) ? ~(result >> 1) : result >> 1;
      lng += deltaLng;

      polyline.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
    }
    return polyline;
  };

  useEffect(() => {
    if (busID && schoolID && tripID) {
      const locationRef = ref(database, `schools/${schoolID}/buses/${busID}/trips/${tripID}/location`);

      const unsubscribe = onValue(locationRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          if (data.latitude && data.longitude) {
            const busCoords = { latitude: data.latitude, longitude: data.longitude };
            setBusLocation(busCoords);
            setBusHeading(data.heading || 0);

            const timestamp = Date.now() / 1000; // Timestamp in seconds
            calculateSpeed(busCoords, timestamp);

            fetchRoute(busCoords.latitude, busCoords.longitude, tkrCollegeLocation.latitude, tkrCollegeLocation.longitude);
          }
        }
        setLoading(false);
      });

      return () => unsubscribe();
    }
  }, [busID, schoolID, tripID]);

  if (loading) {
    return <Loader />;
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
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

        <Marker coordinate={tkrCollegeLocation} title="TKR College" />

        {route && (
          <Polyline coordinates={route} strokeColor="#2A73E8" strokeWidth={5} />
        )}
      </MapView>

      <View style={tw`h-8 w-24 bg-green-500 rounded-lg absolute top-5 left-5 flex items-center justify-center`}>
        <Text style={tw`font-bold text-lg text-white`}>
          {eta !== null && eta !== Infinity ? `🕒 ${eta} Min` : '🕒 Load...'}
        </Text>
      </View>

      <View style={tw`h-8 w-32 bg-blue-500 rounded-lg absolute bottom-5 right-5 flex items-center justify-center`}>
        <Text style={tw`font-bold text-lg text-white`}>{`🚗 ${busSpeed} km/h`}</Text>
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
