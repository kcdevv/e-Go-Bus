import React, { useEffect, useState, useRef, useCallback } from "react";
import { StyleSheet, Alert, Animated } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { Magnetometer } from "expo-sensors";
import { database } from "../../../../../firebase.config";
import { loadStoredData, getLocationAsync } from "../services/locationService";
import Loader from "../../../../components/Loader";
import { calculateHeading, rotateMarker, updateFirebase } from "../utils/locationUtils";

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

  // Fetch the user's location
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

  // Master function to handle all updates
  const handleUpdates = useCallback(async () => {
    try {
      const location = await fetchUserLocation();

      if (!magnetometerData || magnetometerData.x === undefined || magnetometerData.y === undefined) {
        console.warn("Magnetometer data not yet available");
        return;
      }

      const currentHeading = calculateHeading(magnetometerData);

      if (currentHeading === null) {
        console.warn("Invalid heading value. Skipping Firebase update.");
        return;
      }

      setHeading(currentHeading);
      rotateMarker(rotationValue, currentHeading);
      await updateFirebase(database, busId, schoolId, driverId, tripNumber, location, currentHeading);
    } catch (error) {
      Alert.alert("Update Error", error.message);
    }
  }, [fetchUserLocation, magnetometerData, busId, schoolId, driverId, tripNumber]);

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

        locationIntervalRef.current = setInterval(handleUpdates, 1000);
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
    Magnetometer.setUpdateInterval(1000);
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
