import React, { useEffect, useState, useRef, useCallback } from "react";
import { StyleSheet, Alert, Animated, View, Text, Image, TouchableOpacity } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { Magnetometer } from "expo-sensors";
import * as Location from "expo-location"; // Added Location import
import { database } from "../../../../../firebase.config";
import { loadStoredData, getLocationAsync } from "../services/locationService";
import Loader from "../../../../components/Loader";
import { calculateHeading, rotateMarker, updateFirebase } from "../utils/locationUtils";
import tw from "tailwind-react-native-classnames";
import AsyncStorage from "@react-native-async-storage/async-storage";
import polyline from '@mapbox/polyline';
import Constants from "expo-constants";

const MapScreen = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [magnetometerData, setMagnetometerData] = useState({ x: 0, y: 0, z: 0 });
  const [heading, setHeading] = useState(null);
  const [tripEnabled, setTripEnabled] = useState(false);
  const [tripDetails, setTripDetails] = useState(null);
  const [pickupPoints, setPickupPoints] = useState([]);
  const [directions, setDirections] = useState([]);
  const [showPickupConfirmation, setShowPickupConfirmation] = useState(false);

  const rotationValue = useRef(new Animated.Value(0)).current;
  const mapRef = useRef(null);
  const locationIntervalRef = useRef(null);
  const watchPositionRef = useRef(null);

  // Load trip details and pickup points on mount
  useEffect(() => {
    const loadTripData = async () => {
      const data = await loadStoredData();
      setTripDetails(data);

      try {
        // Fetch pickup points from AsyncStorage
        const pickupLocationsStr = await AsyncStorage.getItem('pickupLocations');
        if (pickupLocationsStr) {
          const points = JSON.parse(pickupLocationsStr).map(point => {
            const [latitude, longitude] = point.split(',').map(Number);
            return { latitude, longitude };
          });
          setPickupPoints(points);
          console.log('Retrieved Pickup Points from AsyncStorage:', points);
        }
      } catch (error) {
        console.error("Error fetching pickup points from AsyncStorage:", error);
      }
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

  // Fetch directions from user location to first pickup point
  const fetchDirections = useCallback(async (origin, destination) => {
    try {
      const response = await fetch(`https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&key=${Constants.expoConfig.android.config.googleMaps.apiKey}`);
      const data = await response.json();
      if (data.routes.length) {
        const points = polyline.decode(data.routes[0].overview_polyline.points);
        const coords = points.map(point => ({
          latitude: point[0],
          longitude: point[1]
        }));
        setDirections(coords);
      }
    } catch (error) {
      console.error("Failed to fetch directions:", error);
    }
  }, []);

  // Function to calculate distance between two coordinates
  const getDistance = (coord1, coord2) => {
    const R = 6371e3; // metres
    const φ1 = coord1.latitude * Math.PI/180; // φ, λ in radians
    const φ2 = coord2.latitude * Math.PI/180;
    const Δφ = (coord2.latitude-coord1.latitude) * Math.PI/180;
    const Δλ = (coord2.longitude-coord1.longitude) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    const distance = R * c; // in metres
    return distance;
  };

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

      // Fetch directions to the first pickup point
      if (pickupPoints && pickupPoints.length > 0) {
        await fetchDirections(location.coords, pickupPoints[0]);

        // Check if user is near the first pickup point
        const distance = getDistance(location.coords, pickupPoints[0]);
        if (distance <= 50) {
          setShowPickupConfirmation(true);
        }
      }

    } catch (error) {
      Alert.alert("Update Error", error.message);
    }
  }, [fetchUserLocation, magnetometerData, tripEnabled, tripDetails, pickupPoints, fetchDirections]);

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

  // Handle pickup confirmation
  const handlePickupConfirmation = (confirmed) => {
    if (confirmed) {
      // Move to the next pickup point
      setPickupPoints(prevPoints => prevPoints.slice(1));
    }
    setShowPickupConfirmation(false);
  };

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
        showsUserLocation={false}
        showsCompass
        zoomEnabled
        pitchEnabled
        followsUserLocation
      >
        <Marker coordinate={userLocation} title="Your Location" anchor={{ x: 0.5, y: 0.5 }}>
          <Animated.Image
            source={require("../../../../assets/icons/bus.png")}
            style={[styles.markerImage, { transform: [{ rotate }] }]}
          />
        </Marker>
        {pickupPoints && pickupPoints.length > 0 && (
          <Marker coordinate={pickupPoints[0]} title="Pickup Point" />
        )}
        {directions.length > 0 && (
          <Polyline
            coordinates={directions}
            strokeWidth={4}
            strokeColor="blue"
          />
        )}
      </MapView>
      {showPickupConfirmation && (
        <View style={styles.confirmationContainer}>
          <Text style={styles.confirmationText}>Did you reach the pickup point?</Text>
          <View style={styles.confirmationButtons}>
            <TouchableOpacity onPress={() => handlePickupConfirmation(true)} style={styles.confirmationButton}>
              <Text style={styles.confirmationButtonText}>Yes</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handlePickupConfirmation(false)} style={styles.confirmationButton}>
              <Text style={styles.confirmationButtonText}>No</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
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
  confirmationContainer: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5,
  },
  confirmationText: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  confirmationButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  confirmationButton: {
    backgroundColor: "blue",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  confirmationButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default MapScreen;