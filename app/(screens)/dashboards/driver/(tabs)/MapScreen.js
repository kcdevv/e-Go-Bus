import React, { useEffect, useState, useRef } from "react";
import { StyleSheet, Alert, Animated, Easing } from "react-native"; // Import Easing here
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import { Magnetometer } from "expo-sensors";

const MapScreen = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [heading, setHeading] = useState(0); // Compass heading
  const rotation = useRef(new Animated.Value(90)).current; // Set initial rotation to 90 degrees
  const mapRef = useRef(null); // Reference for MapView

  useEffect(() => {
    const getLocation = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Allow location access to use this feature.");
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const updatedLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };

      setUserLocation(updatedLocation);

      // Zoom to the user's location
      if (mapRef.current) {
        mapRef.current.animateToRegion(updatedLocation, 1000);
      }
    };

    // Fetch initial location
    getLocation();

    // Update location every 3 seconds
    const locationInterval = setInterval(getLocation, 3000);

    // Magnetometer for compass heading
    const magnetometerSubscription = Magnetometer.addListener((data) => {
      const { x, y } = data;
      let angle = Math.atan2(y, x) * (180 / Math.PI); // Convert radians to degrees
      if (angle < 0) angle += 360; // Normalize to 0-360
      setHeading(angle);

      // Smoothly animate the rotation
      Animated.timing(rotation, {
        toValue: angle + 90, // Add 90 degrees to the rotation
        duration: 500, // Set the duration for slow rotation
        useNativeDriver: true,
        easing: Easing.out(Easing.ease), // Correct easing function
      }).start();
    });

    // Cleanup subscriptions on unmount
    return () => {
      clearInterval(locationInterval);
      magnetometerSubscription.remove();
    };
  }, []);

  // Convert heading to rotation interpolation
  const rotate = rotation.interpolate({
    inputRange: [0, 360],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <MapView
      ref={mapRef}
      style={styles.map}
      initialRegion={{
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
            style={[styles.markerImage, { transform: [{ rotate: rotate }] }]} // Apply rotation
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
