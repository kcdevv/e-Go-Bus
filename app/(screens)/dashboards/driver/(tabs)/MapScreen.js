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
import Loader from "../../../../components/Loader";

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
  const calculateHeading = useCallback(() => {
    const { x, y } = magnetometerData;

    // Calculate angle from magnetometer data
    let angle = Math.atan2(y, x) * (180 / Math.PI);
    angle = angle < 0 ? angle + 360 : angle; // Ensure positive angle
    console.log("Calculated Heading:", angle);
    return angle;
  }, [magnetometerData]);

  // Function to rotate the marker smoothly
  const rotateMarker = useCallback((currentHeading) => {
    Animated.timing(rotationValue, {
      toValue: currentHeading - 90, // Correct the heading for orientation
      duration: 300,
      useNativeDriver: Platform.OS !== "web",
      easing: Easing.linear,
    }).start();
  }, []);

  // Function to fetch the user's location
  const fetchUserLocation = useCallback(async () => {
    try {
      const location = await getLocationAsync();
      const updatedLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setUserLocation(updatedLocation); // Update location without animating the map
      return location;
    } catch (error) {
      console.error("Failed to fetch location:", error);
      throw error;
    }
  }, []);

  // Function to update Firebase with location and heading
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
      const currentHeading = calculateHeading();

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

        locationIntervalRef.current = setInterval(handleUpdates, 100);
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

    return () => headingListener.remove();
  }, [userLocation]);

  // Interpolate rotation for marker
  const rotate = rotationValue.interpolate({
    inputRange: [0, 360],
    outputRange: ["0deg", "360deg"],
  });

  if (!userLocation) {
    return <Loader />;
  }

  return (
    <MapView
      ref={mapRef}
      style={styles.map}
      initialRegion={userLocation || {
        latitude: 17.385044,
        longitude: 78.486671,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      }}
      showsUserLocation
      zoomEnabled
      showsCompass
      showsScale
      pitchEnabled
    >
      {userLocation && (
        <Marker
          coordinate={{
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
          }}
          title="Your Location"
          style={styles.markerImageFence}
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
  markerImageFence: {
    width: 85,
    height: 85,
  },
  markerImage: {
    width: 45,
    height: 45,
    resizeMode: "contain",
    position: "absolute",
  },
});

export default MapScreen;
