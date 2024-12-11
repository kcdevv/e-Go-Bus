import React, { useEffect, useState, useRef, useCallback } from "react";
import { StyleSheet, Alert, Animated, View, Text, Image, TouchableOpacity, Platform, Linking } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { Magnetometer } from "expo-sensors";
import { database } from "../../../../../firebase.config";
import { loadStoredData, getLocationAsync } from "../services/locationService";
import Loader from "../../../../components/Loader";
import { calculateHeading, updateFirebase } from "../utils/locationUtils";
import tw from "tailwind-react-native-classnames";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import * as IntentLauncher from 'expo-intent-launcher';

const LOCATION_TRACKING = "location-tracking";

TaskManager.defineTask(LOCATION_TRACKING, async ({ data, error }) => {
  if (error) {
    console.error("Location tracking error:", error);
    return;
  }
  if (data) {
    const { locations } = data;
    const location = locations[0];
    try {
      const storedData = await loadStoredData();
      if (storedData) {
        const heading = location.coords.heading || 90; // Default to East if heading is 0/null
        await updateFirebase(
          database,
          storedData.busId,
          storedData.schoolId,
          storedData.driverId,
          storedData.tripNumber,
          location,
          heading
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
  const [heading, setHeading] = useState(90); // Default to East instead of null
  const [busId, setBusId] = useState(null);
  const [schoolId, setSchoolId] = useState(null);
  const [driverId, setDriverId] = useState(null);
  const [tripNumber, setTripNumber] = useState(null);
  const [tripEnabled, setTripEnabled] = useState(false);
  const [locationPermission, setLocationPermission] = useState(false);
  const [lastValidHeading, setLastValidHeading] = useState(90); // Default to East

  const rotationValue = useRef(new Animated.Value(90)).current; // Default to East
  const mapRef = useRef(null);
  const locationIntervalRef = useRef(null);
  const headingIntervalRef = useRef(null);
  const headingBuffer = useRef([]);
  const locationBuffer = useRef([]);
  const lastLocationRef = useRef(null);

  useEffect(() => {
    const checkLocationPermission = async () => {
      const { status } = await Location.getForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');
    };
    checkLocationPermission();
  }, []);

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
            if (headingIntervalRef.current) {
              clearInterval(headingIntervalRef.current);
            }
            await Location.stopLocationUpdatesAsync(LOCATION_TRACKING);
            setTripEnabled(false);
          },
        },
      ]
    );
  };

  const requestLocationPermissions = async () => {
    try {
      // Request foreground permissions first
      const foregroundStatus = await Location.requestForegroundPermissionsAsync();
      if (foregroundStatus.status !== 'granted') {
        Alert.alert(
          'Location Permission Required',
          'Location access is required for trip tracking. Please grant permission.',
          [{ text: 'OK' }]
        );
        return false;
      }

      // Then request background permissions
      const backgroundStatus = await Location.requestBackgroundPermissionsAsync();
      if (backgroundStatus.status !== 'granted') {
        Alert.alert(
          'Background Location Required',
          'Background location access is required for continuous trip tracking. Please grant permission.',
          [{ text: 'OK' }]
        );
        return false;
      }

      // If both permissions are granted
      if (foregroundStatus.status === 'granted' && backgroundStatus.status === 'granted') {
        // Enable location services
        const locationEnabled = await Location.hasServicesEnabledAsync();
        if (!locationEnabled) {
          Alert.alert(
            'Location Services Disabled',
            'Please enable location services to use this feature.',
            [{ text: 'OK' }]
          );
          return false;
        }
        return true;
      }

      return false;
    } catch (error) {
      Alert.alert('Permission Error', error.message);
      return false;
    }
  };

  const startLocationTracking = async () => {
    try {
      const permissionsGranted = await requestLocationPermissions();
      if (!permissionsGranted) return;

      // Configure high accuracy location tracking
      const locationConfig = {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: Platform.select({
          ios: 300,  // iOS handles background updates differently
          android: 1000 // Android needs a slightly longer interval to save battery
        }),
        distanceInterval: 1, // Update every 1 meter
        foregroundService: {
          notificationTitle: "Trip in Progress",
          notificationBody: "Location tracking is active",
          notificationColor: "#FCD32D",
        },
        // Ensure reliable background updates
        pausesUpdatesAutomatically: false,
        activityType: Location.ActivityType.AutomotiveNavigation,
        showsBackgroundLocationIndicator: true, // iOS only
      };

      await Location.startLocationUpdatesAsync(LOCATION_TRACKING, locationConfig);

      // Start heading updates every 100ms
      headingIntervalRef.current = setInterval(async () => {
        try {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.BestForNavigation
          });
          
          let currentHeading = location.coords.heading;
          
          // Use magnetometer as backup or if heading is 0
          if (!currentHeading && magnetometerData) {
            currentHeading = calculateHeading(magnetometerData);
          }

          // If still no valid heading, use last valid or default to East
          currentHeading = currentHeading || lastValidHeading || 90;

          const smoothedHeading = calculateSmoothedHeading(currentHeading);
          setHeading(smoothedHeading);

          // Animate the rotation
          Animated.timing(rotationValue, {
            toValue: smoothedHeading,
            duration: 100,
            useNativeDriver: true
          }).start();
          
        } catch (err) {
          console.error("Error updating heading:", err);
        }
      }, 100);

      setTripEnabled(true);
      setLocationPermission(true);
    } catch (err) {
      console.error("Error starting location tracking:", err);
      Alert.alert(
        "Location Tracking Error",
        "Failed to start location tracking. Please ensure location services are enabled and try again."
      );
    }
  };

  const calculateBearingBetweenLocations = (lat1, lon1, lat2, lon2) => {
    const toRad = (degree) => degree * Math.PI / 180;
    const toDeg = (rad) => rad * 180 / Math.PI;

    const dLon = toRad(lon2 - lon1);
    const lat1Rad = toRad(lat1);
    const lat2Rad = toRad(lat2);

    const y = Math.sin(dLon) * Math.cos(lat2Rad);
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
              Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
    let bearing = toDeg(Math.atan2(y, x));
    
    return (bearing + 360) % 360;
  };

  const fetchUserLocation = useCallback(async () => {
    if (!tripEnabled || !locationPermission) return null;
    
    try {
      const location = await getLocationAsync();
      const updatedLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };

      // Calculate heading from consecutive locations if speed is above threshold
      if (lastLocationRef.current && location.coords.speed > 1) {
        const calculatedBearing = calculateBearingBetweenLocations(
          lastLocationRef.current.latitude,
          lastLocationRef.current.longitude,
          location.coords.latitude,
          location.coords.longitude
        );
        location.coords.heading = calculatedBearing || 90; // Default to East if calculation fails
      }

      lastLocationRef.current = updatedLocation;

      locationBuffer.current.push(updatedLocation);
      if (locationBuffer.current.length > 3) {
        locationBuffer.current.shift();
      }

      const avgLocation = {
        latitude: locationBuffer.current.reduce((acc, loc) => acc + loc.latitude, 0) / locationBuffer.current.length,
        longitude: locationBuffer.current.reduce((acc, loc) => acc + loc.longitude, 0) / locationBuffer.current.length,
        latitudeDelta: updatedLocation.latitudeDelta,
        longitudeDelta: updatedLocation.longitudeDelta
      };

      setUserLocation(avgLocation);
      return location;
    } catch (error) {
      console.error("Failed to fetch location:", error);
      throw error;
    }
  }, [tripEnabled, locationPermission]);

  const calculateSmoothedHeading = (newHeading) => {
    if (!newHeading || isNaN(newHeading)) {
      return lastValidHeading || 90; // Default to East if no valid heading
    }

    const BUFFER_SIZE = 5;
    const MAX_HEADING_CHANGE = 45; // Maximum allowed heading change in degrees
    
    // Remove outliers
    if (lastValidHeading !== null) {
      const headingDiff = Math.abs(newHeading - lastValidHeading);
      if (headingDiff > MAX_HEADING_CHANGE && headingDiff < (360 - MAX_HEADING_CHANGE)) {
        return lastValidHeading;
      }
    }
    
    headingBuffer.current.push(newHeading);
    if (headingBuffer.current.length > BUFFER_SIZE) {
      headingBuffer.current.shift();
    }

    // Median filter
    const sortedHeadings = [...headingBuffer.current].sort((a, b) => a - b);
    const medianHeading = sortedHeadings[Math.floor(sortedHeadings.length / 2)];
    
    setLastValidHeading(medianHeading);
    return medianHeading;
  };

  const handleUpdates = useCallback(async () => {
    if (!tripEnabled || !locationPermission) return;

    try {
      const location = await fetchUserLocation();
      if (!location) return;

      const currentHeading = heading || lastValidHeading || 90; // Default to East if no heading
      await updateFirebase(database, busId, schoolId, driverId, tripNumber, location, currentHeading);
    } catch (error) {
      Alert.alert("Update Error", error.message);
    }
  }, [fetchUserLocation, heading, busId, schoolId, driverId, tripNumber, tripEnabled, locationPermission]);

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

        if (tripEnabled && locationPermission) {
          locationIntervalRef.current = setInterval(handleUpdates, 300);
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
      if (headingIntervalRef.current) {
        clearInterval(headingIntervalRef.current);
      }
      Magnetometer.removeAllListeners();
    };
  }, [handleUpdates, tripEnabled, locationPermission]);

  useEffect(() => {
    if (tripEnabled && locationPermission) {
      Magnetometer.setUpdateInterval(50);
      const headingListener = Magnetometer.addListener((data) => {
        setMagnetometerData(data);
      });

      return () => headingListener.remove();
    }
  }, [tripEnabled, locationPermission, userLocation]);

  const rotate = rotationValue.interpolate({
    inputRange: [0, 360],
    outputRange: ["0deg", "360deg"],
    extrapolate: 'clamp'
  });

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