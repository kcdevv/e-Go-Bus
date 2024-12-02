import React, { useEffect, useState, useRef, useCallback } from "react";
import { StyleSheet, Alert, Animated, Easing, Platform } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { Magnetometer } from "expo-sensors";
import { database } from "../../../../../firebase.config";
import {
  loadStoredData,
  getLocationAsync,
  updateFirebaseData,
} from "../services/locationService";

const MapScreen = () => {
  const [userLocation, setUserLocation] = useState(null); // User's location
  const [magnetometerData, setMagnetometerData] = useState({ x: 0, y: 0, z: 0 }); // Magnetometer data
  const [heading, setHeading] = useState(0); // Current heading
  const [busId, setBusId] = useState(null);
  const [schoolId, setSchoolId] = useState(null);
  const [driverId, setDriverId] = useState(null);
  const [tripNumber, setTripNumber] = useState(null);

  const rotationValue = useRef(new Animated.Value(0)).current; // Rotation animation
  const mapRef = useRef(null);
  const locationIntervalRef = useRef(null);

  // Calculate heading using arctangent
  const calculateHeading = useCallback(() => {
    const { x, y } = magnetometerData;
    let angle = Math.atan2(y, x) * (180 / Math.PI);
    if (angle < 0) angle += 360; // Normalize angle to 0-360
    return angle;
  }, [magnetometerData]);

  // Handle location update
  const handleLocationUpdate = useCallback(async () => {
    if (!busId || !schoolId || !tripNumber) {
      console.warn("Missing trip details for location update");
      return;
    }

    try {
      const location = await getLocationAsync();
      const currentHeading = calculateHeading();
      const updatedLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };

      setUserLocation(updatedLocation);
      setHeading(currentHeading);

      // Animate rotation based on heading
      Animated.timing(rotationValue, {
        toValue: currentHeading,
        duration: 300,
        useNativeDriver: Platform.OS !== "web",
        easing: Easing.linear,
      }).start();

      if (mapRef.current) {
        mapRef.current.animateToRegion(updatedLocation, 1000);
      }

      await updateFirebaseData(database, {
        busId,
        schoolId,
        driverId,
        tripNumber,
        location,
        heading: currentHeading,
      });
    } catch (error) {
      console.error("Location update failed:", error);
      Alert.alert("Location Error", error.message);
    }
  }, [busId, schoolId, tripNumber, calculateHeading, driverId]);

  // Initialize trip data and set up location tracking
  useEffect(() => {
    const initializeTracking = async () => {
      try {
        const storedData = await loadStoredData();
        if (storedData) {
          setBusId(storedData.busId);
          setSchoolId(storedData.schoolId);
          setDriverId(storedData.driverId);
          setTripNumber(storedData.tripNumber);
        } else {
          Alert.alert("Error", "Unable to load trip information");
          return;
        }

        locationIntervalRef.current = setInterval(handleLocationUpdate, 3000);
      } catch (error) {
        console.error("Tracking initialization error:", error);
      }
    };

    initializeTracking();

    return () => {
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
      }
      Magnetometer.removeAllListeners();
    };
  }, [handleLocationUpdate]);

  // Magnetometer heading listener
  useEffect(() => {
  Magnetometer.setUpdateInterval(100);
  const headingListener = Magnetometer.addListener((data) => {
    console.log("Magnetometer Data:", data); // Debugging line
    setMagnetometerData(data); // Update magnetometer data dynamically
  });

  return () => headingListener.remove();
}, []);


  // Interpolate rotation for marker
  const rotate = rotationValue.interpolate({
    inputRange: [0, 360],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <MapView
      ref={mapRef}
      style={styles.map}
      initialRegion={
        userLocation || {
          latitude: 17.385044,
          longitude: 78.486671,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }
      }
      showsUserLocation // Show user location on the map
      zoomEnabled // Enable zooming
      showsCompass // Show compass for orientation
      showsScale // Show scale
      pitchEnabled // Allow tilting
      onRegionChangeComplete={(region) => setUserLocation(region)} // Update location when map moves
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
            source={require("../../../../assets/icons/bus.png")}
            style={[
              styles.markerImage,
              {
                transform: [{ rotate }],
              },
            ]}
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
    width: 50,
    height: 50,
    resizeMode: "contain",
  },
});

export default MapScreen;
