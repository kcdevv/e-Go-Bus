import React, { useEffect, useState, useRef, useCallback } from "react";
import { StyleSheet, Alert, Animated, View, Text, Image, TouchableOpacity } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { Magnetometer } from "expo-sensors";
import { database } from "../../../../../firebase.config";
import { loadStoredData, getLocationAsync } from "../services/locationService";
import Loader from "../../../../components/Loader";
import { calculateHeading, updateFirebase } from "../utils/locationUtils";
import tw from "tailwind-react-native-classnames";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";

const LOCATION_TRACKING = "location-tracking";

TaskManager.defineTask(LOCATION_TRACKING, async ({ data, error }) => {
  if (error) {
    console.error("Location tracking error:", error);
    return;
  }
  if (data) {
    const { locations } = data;
    const location = locations[0];
    // Handle background location update
    try {
      const storedData = await loadStoredData();
      if (storedData) {
        // Get heading from location.coords.heading if available
        const heading = location.coords.heading;
        await updateFirebase(
          database,
          storedData.busId,
          storedData.schoolId,
          storedData.driverId,
          storedData.tripNumber,
          location,
          heading // Use actual heading from location
        );
      }
    } catch (err) {
      console.error("Background location update error:", err);
    }
  }
});

const MapScreen = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [magnetometerData, setMagnetometerData] = useState({ x: 0, y: 0, z: 0 });
  const [heading, setHeading] = useState(null);
  const [busId, setBusId] = useState(null);
  const [schoolId, setSchoolId] = useState(null);
  const [driverId, setDriverId] = useState(null);
  const [tripNumber, setTripNumber] = useState(null);
  const [tripEnabled, setTripEnabled] = useState(false);

  const rotationValue = useRef(new Animated.Value(0)).current;
  const mapRef = useRef(null);
  const locationIntervalRef = useRef(null);
  const headingBuffer = useRef([]);
  const locationBuffer = useRef([]);
  const animatedLocation = useRef(new Animated.ValueXY()).current;

  // Handle End Trip Confirmation
  const handleEndTrip = () => {
    Alert.alert(
      "Confirm End Trip",
      "Are you sure you want to end the trip?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Yes, End Trip",
          onPress: async () => {
            await Location.stopLocationUpdatesAsync(LOCATION_TRACKING);
            setTripEnabled(false);
          },
        },
      ]
    );
  };

  // Start location tracking
  const startLocationTracking = async () => {
    try {
      const { status } = await Location.requestBackgroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Background location access is required for trip tracking");
        return;
      }

      await Location.startLocationUpdatesAsync(LOCATION_TRACKING, {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 1000,
        distanceInterval: 0,
        foregroundService: {
          notificationTitle: "Trip in Progress",
          notificationBody: "Location tracking is active",
        },
        // Enable heading updates in background
        showsBackgroundLocationIndicator: true,
      });

      setTripEnabled(true);
    } catch (err) {
      console.error("Error starting location tracking:", err);
      Alert.alert("Error", "Failed to start location tracking");
    }
  };

  // Fetch the user's location
  const fetchUserLocation = useCallback(async () => {
    if (!tripEnabled) return null;
    
    try {
      const location = await getLocationAsync();
      const updatedLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };

      // Smooth location updates using buffer
      locationBuffer.current.push(updatedLocation);
      if (locationBuffer.current.length > 5) {
        locationBuffer.current.shift();
      }

      // Calculate average location
      const avgLocation = {
        latitude: locationBuffer.current.reduce((acc, loc) => acc + loc.latitude, 0) / locationBuffer.current.length,
        longitude: locationBuffer.current.reduce((acc, loc) => acc + loc.longitude, 0) / locationBuffer.current.length,
        latitudeDelta: updatedLocation.latitudeDelta,
        longitudeDelta: updatedLocation.longitudeDelta
      };

      // Animate to new location smoothly
      Animated.spring(animatedLocation, {
        toValue: { x: avgLocation.longitude, y: avgLocation.latitude },
        useNativeDriver: true,
        friction: 6,
        tension: 30
      }).start();

      setUserLocation(avgLocation);
      return location;
    } catch (error) {
      console.error("Failed to fetch location:", error);
      throw error;
    }
  }, [tripEnabled]);

  // Calculate smoothed heading using moving average
  const calculateSmoothedHeading = (newHeading) => {
    const BUFFER_SIZE = 5; // Number of readings to average
    
    headingBuffer.current.push(newHeading);
    if (headingBuffer.current.length > BUFFER_SIZE) {
      headingBuffer.current.shift();
    }

    // Calculate average heading
    const sum = headingBuffer.current.reduce((acc, val) => acc + val, 0);
    return sum / headingBuffer.current.length;
  };

  // Master function to handle all updates
  const handleUpdates = useCallback(async () => {
    if (!tripEnabled) return;

    try {
      const location = await fetchUserLocation();
      if (!location) return;

      let currentHeading;

      // Try to get heading from location first
      if (location.coords.heading !== null) {
        currentHeading = location.coords.heading;
      } else if (magnetometerData && magnetometerData.x !== undefined && magnetometerData.y !== undefined) {
        // Fall back to magnetometer if location heading not available
        const rawHeading = calculateHeading(magnetometerData);
        if (rawHeading !== null) {
          currentHeading = rawHeading;
        } else {
          console.warn("Invalid heading value. Skipping Firebase update.");
          return;
        }
      } else {
        console.warn("No heading data available");
        return;
      }

      const smoothedHeading = calculateSmoothedHeading(currentHeading);
      setHeading(smoothedHeading);
      
      // Use smooth easing for rotation animation
      Animated.spring(rotationValue, {
        toValue: smoothedHeading,
        useNativeDriver: true,
        friction: 7,
        tension: 40
      }).start();

      await updateFirebase(database, busId, schoolId, driverId, tripNumber, location, smoothedHeading);
    } catch (error) {
      Alert.alert("Update Error", error.message);
    }
  }, [fetchUserLocation, magnetometerData, busId, schoolId, driverId, tripNumber, tripEnabled]);

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

        if (tripEnabled) {
          locationIntervalRef.current = setInterval(handleUpdates, 1000);
        }
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
  }, [handleUpdates, tripEnabled]);

  // Magnetometer heading listener with increased update frequency
  useEffect(() => {
    if (tripEnabled) {
      Magnetometer.setUpdateInterval(100); // Increased frequency for smoother updates
      const headingListener = Magnetometer.addListener((data) => {
        setMagnetometerData(data);
      });

      return () => headingListener.remove();
    }
  }, [tripEnabled, userLocation]);

  // Interpolate rotation for marker with smoother transitions
  const rotate = rotationValue.interpolate({
    inputRange: [0, 360],
    outputRange: ["0deg", "360deg"],
    extrapolate: 'clamp'
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
          onPress={startLocationTracking}
          style={[
            tw`py-3 px-6 rounded-full`,
            tripEnabled ? tw`bg-green-500` : tw`bg-blue-500`,
          ]}
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
  if (!userLocation && tripEnabled) {
    return <Loader text="Fetching Location" />;
  }

  return (
    <View style={tw`flex-1`}>
      <TouchableOpacity
        onPress={handleEndTrip}
        style={styles.endTripButton}
      >
        <Text style={styles.endTripButtonText}>End Trip</Text>
      </TouchableOpacity>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={userLocation ? {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        } : {
          latitude: 17.385044,
          longitude: 78.486671,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
        showsUserLocation={false}
        zoomEnabled
        maxZoomLevel={18}
        minZoomLevel={7}
        followsUserLocation
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
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <Animated.Image
              source={require("../../../../assets/icons/bus.png")}
              style={[styles.markerImage, { transform: [{ rotate }] }]}
            />
          </Marker>
        )}
      </MapView>
    </View>
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