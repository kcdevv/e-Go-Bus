import React, { useEffect, useState, useRef } from "react";
import { StyleSheet, Alert, Animated, Easing } from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import { Magnetometer } from "expo-sensors";
import { ref, set } from "firebase/database";
import { database } from "../../../../../firebase.config"; // Adjust the path as necessary
import AsyncStorage from '@react-native-async-storage/async-storage'; // Import AsyncStorage

const MapScreen = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [heading, setHeading] = useState(0); // Compass heading
  const [busId, setBusId] = useState(null);
  const [schoolId, setSchoolId] = useState(null);
  const [driverId, setDriverId] = useState(null);
  const [tripNumber, setTripNumber] = useState(null);
  const rotation = useRef(new Animated.Value(90)).current; // Set initial rotation to 90 degrees
  const mapRef = useRef(null); // Reference for MapView

  useEffect(() => {
    // Function to retrieve busId, schoolId, driverId, and tripNumber from AsyncStorage
    const loadStoredData = async () => {
      try {
        const storedBusId = await AsyncStorage.getItem('busID');
        const storedSchoolId = await AsyncStorage.getItem('schoolID');
        const storedDriverId = await AsyncStorage.getItem('driverID');
        const storedTripNumber = await AsyncStorage.getItem('tripNumber');

        if (storedBusId) setBusId(storedBusId);
        if (storedSchoolId) setSchoolId(storedSchoolId);
        if (storedDriverId) setDriverId(storedDriverId);
        if (storedTripNumber) setTripNumber(storedTripNumber);

        console.log("Loaded stored data:", {
          busId: storedBusId,
          schoolId: storedSchoolId,
          driverId: storedDriverId,
          tripNumber: storedTripNumber,
        });
      } catch (error) {
        console.error("Error retrieving data from AsyncStorage:", error);
      }
    };

    // Load stored data when the component is mounted
    loadStoredData();

    // Set the location and heading interval to 3 seconds
    const locationInterval = setInterval(() => {
      getLocation();
    }, 3000);

    // Cleanup on unmount
    return () => {
      clearInterval(locationInterval); // Clear interval when component unmounts
      Magnetometer.removeAllListeners(); // Clean up the magnetometer listener
    };
  }, []); // Empty dependency array to run once when the component mounts

  // Function to fetch location and send data to Firebase
  const getLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "Allow location access to use this feature.");
      return;
    }

    try {
      const location = await Location.getCurrentPositionAsync({});
      const updatedLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };

      // Update state only if location has changed
      setUserLocation(updatedLocation);

      // Zoom to the user's location on the map
      if (mapRef.current) {
        mapRef.current.animateToRegion(updatedLocation, 1000);
      }

      console.log("Location updated:", updatedLocation);

      // Send location and heading data to Firebase Realtime Database
      if (busId && schoolId && tripNumber) {
        const dbRef = ref(database, `schools/${schoolId}/buses/${busId}/trips/${tripNumber}`);
        await set(dbRef, {
          busId,
          schoolId,
          driverId,
          tripNumber,
          location: {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          },
          heading, // Send the heading along with the location
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error("Error fetching or updating location:", error);
      Alert.alert("Error", "Failed to fetch or update location.");
    }
  };

  // Function to get heading (direction) - Now in useEffect only once
  useEffect(() => {
    const headingListener = Magnetometer.addListener((data) => {
      const { x, y } = data;
      let angle = Math.atan2(y, x) * (180 / Math.PI); // Convert radians to degrees
      if (angle < 0) angle += 360; // Normalize to 0-360
      setHeading(angle);

      // Smoothly animate the rotation of the marker
      Animated.timing(rotation, {
        toValue: angle + 90, // Add 90 degrees to the rotation for correct direction
        duration: 500, // Set duration for slow rotation
        useNativeDriver: true,
        easing: Easing.out(Easing.ease), // Apply easing function
      }).start();

      console.log("Heading updated:", angle); // Log heading updates
    });

    // Cleanup the heading listener when component unmounts
    return () => headingListener.remove();
  }, []); // Empty dependency array ensures it runs once when the component mounts

  // Interpolation for marker rotation
  const rotate = rotation.interpolate({
    inputRange: [0, 360],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <MapView
      ref={mapRef}
      style={styles.map}
      initialRegion={userLocation || {
        latitude: 17.385044, // Default to Hyderabad
        longitude: 78.486671,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      }}
    >
      {userLocation && (
        <Marker
          coordinate={{
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
          }}
          title="Your Location"
        >
          <Animated.Image
            source={require("../../../../assets/images/bus.png")}
            style={[styles.markerImage, { transform: [{ rotate: rotate }] }]} // Apply rotation based on heading
          />
        </Marker>
      )}
    </MapView>
  );
};

const styles = StyleSheet.create({
  map: {
    width: "100%",
    height: "100%",
  },
  markerImage: {
    width: 30,
    height: 30,
  },
});

export default MapScreen;
