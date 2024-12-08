import React, { useState, useEffect, useRef } from "react";
import { StyleSheet, View, Text } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import * as Location from 'expo-location';
import axios from 'axios';
import Constants from 'expo-constants';

const GOOGLE_MAPS_API_KEY = Constants.expoConfig.android.config.googleMaps.apiKey;

const MapScreen = () => {
  const [driverLocation, setDriverLocation] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [eta, setEta] = useState(null);
  const [busSpeed, setBusSpeed] = useState(0);
  const [pickupPoints] = useState([
    { latitude: 17.3387, longitude: 78.5486, priority: 1 },
    { latitude: 17.3693, longitude: 78.5560, priority: 2 },
    { latitude: 17.3706, longitude: 78.5472, priority: 3 },
    { latitude: 17.3658, longitude: 78.5355, priority: 5 },
    { latitude: 17.3637, longitude: 78.5539, priority: 4 },
  ]);
  const [prevLocation, setPrevLocation] = useState(null);
  const [prevTimestamp, setPrevTimestamp] = useState(null);
  const mapRef = useRef(null);

  useEffect(() => {
    const fetchDriverLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.log('Permission to access location was denied');
          return;
        }

        const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        const currentLocation = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        setDriverLocation(currentLocation);
        await fetchRoute(currentLocation, pickupPoints); // Fetch route once location is updated
      } catch (error) {
        console.log('Error fetching location: ', error);
      }
    };

    fetchDriverLocation();
    const locationInterval = setInterval(fetchDriverLocation, 5000); // Reduce interval to 5 seconds

    return () => clearInterval(locationInterval);
  }, []);

  useEffect(() => {
    if (driverLocation && prevLocation && prevTimestamp) {
      const distance = haversineDistance(prevLocation, driverLocation);
      const timeElapsed = (Date.now() - prevTimestamp) / 3600000; // Time in hours
      const speed = (distance / timeElapsed).toFixed(2);
      setBusSpeed(speed);
    }
    setPrevLocation(driverLocation);
    setPrevTimestamp(Date.now());
  }, [driverLocation]);

  const haversineDistance = (start, end) => {
    const R = 6371; // Radius of Earth in km
    const lat1 = start.latitude, lon1 = start.longitude;
    const lat2 = end.latitude, lon2 = end.longitude;

    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  const fetchRoute = async (startLocation, pickupPoints) => {
    try {
      const sortedPickupPoints = [...pickupPoints].sort((a, b) => a.priority - b.priority);
      const waypoints = sortedPickupPoints.map(
        (point) => `${point.latitude},${point.longitude}`
      ).join('|');
      
      const origin = `${startLocation.latitude},${startLocation.longitude}`;
      const destination = `${sortedPickupPoints[sortedPickupPoints.length - 1].latitude},${sortedPickupPoints[sortedPickupPoints.length - 1].longitude}`;

      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&waypoints=${waypoints}&key=${GOOGLE_MAPS_API_KEY}`;
      const response = await axios.get(url);
      console.log(response.data);

      if (response.data.routes && response.data.routes[0] && response.data.routes[0].overview_polyline) {
        const polyline = response.data.routes[0].overview_polyline.points;
        const points = decodePolyline(polyline);
        setRouteCoordinates(points);
        setEta(Math.round(response.data.routes[0].legs[0].duration.value / 60)); // ETA in minutes
      } else {
        console.log("No polyline data found in the response.");
      }
    } catch (error) {
      console.log('Error fetching route: ', error);
    }
  };

  // Helper function to decode polyline
  const decodePolyline = (encodedPolyline) => {
    let points = [];
    let index = 0, len = encodedPolyline.length;
    let lat = 0, lng = 0;

    while (index < len) {
      let b, shift = 0, result = 0;
      do {
        b = encodedPolyline.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      let deltaLat = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
      lat += deltaLat;

      shift = 0;
      result = 0;
      do {
        b = encodedPolyline.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      let deltaLng = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
      lng += deltaLng;

      points.push({
        latitude: lat / 1e5,
        longitude: lng / 1e5
      });
    }

    return points;
  };

  // Ensure we have a valid driver location for the map initial region
  const initialRegion = driverLocation ? {
    latitude: driverLocation.latitude,
    longitude: driverLocation.longitude,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  } : {
    latitude: 17.3693,
    longitude: 78.5560,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation={true}
        followUserLocation={true}
      >
        {driverLocation && (
          <Marker coordinate={driverLocation} title="Driver Location" description="Current location of the bus driver">
            <View style={styles.driverMarkerContainer}>
              <Text style={styles.driverMarkerText}>🚍</Text>
            </View>
          </Marker>
        )}

        {pickupPoints.map((point, index) => (
          <Marker
            key={index}
            coordinate={{ latitude: point.latitude, longitude: point.longitude }}
            title={`Pickup Point ${index + 1}`}
            description={`Priority: ${point.priority}`}
          />
        ))}

        {routeCoordinates.length > 0 && (
          <Polyline coordinates={routeCoordinates} strokeColor="#2A73E8" strokeWidth={4} />
        )}
      </MapView>

      <View style={styles.etaContainer}>
        <Text style={styles.etaText}>{eta !== null ? `ETA: ${eta} Min` : 'Calculating ETA...'}</Text>
      </View>

      <View style={styles.speedContainer}>
        <Text style={styles.speedText}>{busSpeed !== null ? `Speed: ${busSpeed} km/h` : 'Calculating Speed...'}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: "100%",
    height: "100%",
  },
  driverMarkerContainer: {
    backgroundColor: "lightblue",
    padding: 5,
    borderRadius: 5,
  },
  driverMarkerText: {
    fontSize: 20,
    fontWeight: "bold",
  },
  etaContainer: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 10,
    borderRadius: 5,
  },
  etaText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  speedContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 10,
    borderRadius: 5,
  },
  speedText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default MapScreen;
