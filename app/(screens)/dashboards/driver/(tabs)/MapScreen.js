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
import tw from "tailwind-react-native-classnames";

const MapScreen = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [magnetometerData, setMagnetometerData] = useState({ x: 0, y: 0, z: 0 });
  const [heading, setHeading] = useState(null);
  const [busId, setBusId] = useState(null);
  const [schoolId, setSchoolId] = useState(null);
  const [driverId, setDriverId] = useState(null);
  const [tripNumber, setTripNumber] = useState(null);

  const rotationValue = useRef(new Animated.Value(0)).current; // Rotation animation
  const mapRef = useRef(null);
  const locationIntervalRef = useRef(null);

  // Function to calculate heading
  // Updated calculateHeading function
  const calculateHeading = useCallback(() => {
    const { x, y } = magnetometerData;
  
    // Directly use x and y without normalizing
    let angle = Math.atan2(y, x) * (180 / Math.PI);
    angle < 0 ? angle = (angle + 360) : (angle);
    console.log("Angle:",angle);
    return angle;
  }, [magnetometerData]);
  

// Updated rotateMarker function
const rotateMarker = useCallback((currentHeading) => {
  Animated.timing(rotationValue, {
    toValue: currentHeading,
    duration: 300,
    useNativeDriver: Platform.OS !== "web",
    easing: Easing.linear,
  }).start();
}, []);


  // Function to get user location
  const fetchUserLocation = useCallback(async () => {
    try {
      const location = await getLocationAsync();
      const updatedLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setUserLocation(updatedLocation);

      if (mapRef.current) {
        mapRef.current.animateToRegion(updatedLocation, 1000);
      }

      return location;
    } catch (error) {
      console.error("Failed to fetch location:", error);
      throw error;
    }
  }, []);

  // Function to update data in Firebase
  const updateFirebase = useCallback(
    async (location, currentHeading) => {
      if (!busId || !schoolId || !tripNumber) {
        console.warn("Missing trip details for Firebase update");
        return;
      }

      try {
        await updateFirebaseData(database, {
          busId,
          schoolId,
          driverId,
          tripNumber,
          location,
          heading: currentHeading,
        });
        console.log("Firebase updated successfully");
      } catch (error) {
        console.error("Failed to update Firebase:", error);
        throw error;
      }
    },
    [busId, schoolId, tripNumber, driverId]
  );

  // Master function to handle all updates
  const handleUpdates = useCallback(async () => {
    try {
      const location = await fetchUserLocation();
      let currentHeading = calculateHeading();

      if (currentHeading === null) {
        console.warn("Invalid heading value. Skipping Firebase update.");
        return;
      }

      setHeading(currentHeading);
      rotateMarker(currentHeading);
      await updateFirebase(location, currentHeading);
    } catch (error) {
      Alert.alert("Update Error", error.message);
    }
  }, [fetchUserLocation, calculateHeading, rotateMarker, updateFirebase]);

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

        locationIntervalRef.current = setInterval(handleUpdates, 3000);
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
  }, [handleUpdates]);

  // Magnetometer heading listener
  useEffect(() => {
    Magnetometer.setUpdateInterval(100);
    const headingListener = Magnetometer.addListener((data) => {
      setMagnetometerData(data);
    });
    console.log("MAgnetometer data:",magnetometerData);
    
    return () => headingListener.remove();
  }, [userLocation]);

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
          style={tw`w-80 h-80`}
        >
          <Animated.Image
            source={require("../../../../assets/icons/bus.png")}
            style={[styles.markerImage, { transform: [{ rotate }] }]}
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
    width: 45,
    height: 45,
    resizeMode: "cover",
  },
});

export default MapScreen;
