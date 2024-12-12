import React, { useEffect, useState, useRef, useCallback } from "react";
import { StyleSheet, Alert, Animated, View, Text, Image, TouchableOpacity } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { Magnetometer } from "expo-sensors";
import * as Location from "expo-location"; // Added Location import
import { database } from "../../../../../firebase.config";
import { loadStoredData, getLocationAsync } from "../services/locationService";
import Loader from "../../../../components/Loader";
import { calculateHeading, rotateMarker, updateFirebase } from "../utils/locationUtils";
import tw from "tailwind-react-native-classnames";

const MapScreen = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [magnetometerData, setMagnetometerData] = useState({ x: 0, y: 0, z: 0 });
  const [heading, setHeading] = useState(null);
  const [tripEnabled, setTripEnabled] = useState(false);
  const [tripDetails, setTripDetails] = useState(null);

  const rotationValue = useRef(new Animated.Value(0)).current;
  const mapRef = useRef(null);
  const locationIntervalRef = useRef(null);
  const watchPositionRef = useRef(null);

  // Load trip details on mount
  useEffect(() => {
    const loadTripData = async () => {
      const data = await loadStoredData();
      setTripDetails(data);
    };
    loadTripData();
  }, []);

  const handleEndTrip = () => {
    Alert.alert(
      "Confirm End Trip",
      "Are you sure you want to end the trip?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Yes, End Trip", 
          onPress: async () => {
            // Ensure the watcher exists before attempting to remove it
            if (watchPositionRef.current) {
              try {
                // Remove the location watch subscription
                watchPositionRef.current.remove();
                console.log("Location watching stopped");
              } catch (error) {
                console.error("Error stopping location watch:", error);
              }
            }
            setTripEnabled(false); // Disable trip
          }
        },
      ]
    );
  };
  

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
      setUserLocation(updatedLocation);

      // Animate map to follow the user
      if (mapRef.current) {
        mapRef.current.animateToRegion(updatedLocation, 1000);
      }
      return location;
    } catch (error) {
      console.error("Failed to fetch location:", error);
      throw error;
    }
  }, []);

  // Master function to handle all updates
  const handleUpdates = useCallback(async () => {
    if (!tripEnabled || !tripDetails) return;

    try {
      const location = await fetchUserLocation();

      if (!magnetometerData || magnetometerData.x === undefined || magnetometerData.y === undefined) {
        console.warn("Magnetometer data not yet available");
        return;
      }

      // Use device heading if available, fallback to magnetometer
      let currentHeading;
      if (location.coords.heading !== null && location.coords.heading !== undefined) {
        currentHeading = location.coords.heading;
      } else {
        currentHeading = calculateHeading(magnetometerData);
      }

      if (currentHeading === null) {
        console.warn("Invalid heading value. Skipping Firebase update.");
        return;
      }

      setHeading(currentHeading);
      rotateMarker(rotationValue, currentHeading + 90); // Add 90 degrees to correct orientation

      // Update Firebase with location and heading
      await updateFirebase(
        database,
        tripDetails.busId,
        tripDetails.schoolId,
        tripDetails.driverId,
        tripDetails.tripNumber,
        location,
        currentHeading
      );

    } catch (error) {
      Alert.alert("Update Error", error.message);
    }
  }, [fetchUserLocation, magnetometerData, tripEnabled, tripDetails]);

  // Initialize trip data and set up location tracking
  useEffect(() => {
    let locationInterval;
    const initializeTracking = async () => {
      try {
        if (tripEnabled) {
          // Set up high accuracy location watching
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === 'granted') {
            watchPositionRef.current = await Location.watchPositionAsync(
              {
                accuracy: Location.Accuracy.BestForNavigation,
                distanceInterval: 1, // Update every 1 meter
                timeInterval: 1000, // Update every second
              },
              async (location) => {
                const updatedLocation = {
                  latitude: location.coords.latitude,
                  longitude: location.coords.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                };
                setUserLocation(updatedLocation);
                
                // Update heading from GPS if available
                if (location.coords.heading !== null) {
                  setHeading(location.coords.heading);
                  rotateMarker(rotationValue, location.coords.heading + 90);
                  
                  // Update Firebase when location changes
                  if (tripDetails) {
                    await updateFirebase(
                      database,
                      tripDetails.busId,
                      tripDetails.schoolId,
                      tripDetails.driverId,
                      tripDetails.tripNumber,
                      location,
                      heading
                    );
                  }
                }
              }
            );
          }
          
          locationInterval = setInterval(handleUpdates, 1000);
          locationIntervalRef.current = locationInterval;
        }
      } catch (error) {
        console.error("Tracking initialization error:", error);
      }
    };

    initializeTracking();

    return () => {
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
        locationIntervalRef.current = null;
      }
      if (watchPositionRef.current) {
        watchPositionRef.current.remove();
      }
      Magnetometer.removeAllListeners();
    };
  }, [handleUpdates, tripEnabled]);

  // Magnetometer heading listener
  useEffect(() => {
    Magnetometer.setUpdateInterval(100); // Increased frequency
    const headingListener = Magnetometer.addListener((data) => setMagnetometerData(data));
    return () => headingListener.remove();
  }, []);

  // Interpolate rotation for marker
  const rotate = rotationValue.interpolate({
    inputRange: [0, 360],
    outputRange: ["0deg", "360deg"],
  });

  // Render early return if trip is not enabled
  if (!tripEnabled) {
    return (
      <View style={tw`flex-1 justify-center items-center p-4`}>
        <Image
          source={require("../../../../assets/images/map.png")}
          style={tw`w-32 h-32 mb-6`}
        />
        <Text style={tw`text-2xl font-semibold mb-4`}>
          {tripEnabled ? "Trip Started" : "Start Your Trip"}
        </Text>
        <TouchableOpacity
          onPress={() => setTripEnabled(true)}
          style={[tw`py-3 px-6 rounded-full bg-blue-500`]}
        >
          <Text style={tw`text-white text-lg font-bold`}>
            {tripEnabled ? "End Trip" : "Start Trip"}
          </Text>
        </TouchableOpacity>
        <Text style={tw`text-sm text-gray-500 mt-4 text-center`}>
          Please start the trip to enable map features and begin tracking.
        </Text>
      </View>
    );
  }

  // Show loader if user location is not available
  if (!userLocation) {
    return <Loader text="Fetching Location" />;
  }

  return (
    <View style={tw`flex-1`}>
      <TouchableOpacity onPress={handleEndTrip} style={styles.endTripButton}>
        <Text style={styles.endTripButtonText}>End Trip</Text>
      </TouchableOpacity>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation
        showsCompass
        zoomEnabled
        pitchEnabled
        followsUserLocation
      >
        <Marker coordinate={userLocation} title="Your Location">
          <Animated.Image
            source={require("../../../../assets/icons/bus.png")}
            style={[styles.markerImage, { transform: [{ rotate }] }]}
          />
        </Marker>
      </MapView>
    </View>
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
    resizeMode: "contain",
    position: "absolute",
  },
  endTripButton: {
    position: "absolute",
    top: 10,
    left: "55%",
    transform: [{ translateX: -75 }],
    backgroundColor: "red",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    zIndex: 1000,
  },
  endTripButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
    textAlign: "center",
  },
});

export default MapScreen;