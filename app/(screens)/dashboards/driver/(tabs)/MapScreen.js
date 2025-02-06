import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";
import {
  StyleSheet,
  Alert,
  View,
  Text,
  TouchableOpacity,
} from "react-native";
import tw from "tailwind-react-native-classnames";
import MapView, { Marker, Polyline } from "react-native-maps";
import * as Location from "expo-location";
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import { database } from "../../../../../firebase.config";
import { loadStoredData, getLocationAsync } from "../services/locationService";
import Loader from "../../../../components/Loader";
import { updateFirebase } from "../utils/locationUtils";
import polyline from "@mapbox/polyline";
import Constants from "expo-constants";
import { getPickupPointsData } from "../utils/getPickUpPoints";
import { notificationsSchemaData } from "../utils/notificationData";
import TripSelectionComponent from "../utils/TripSelectionComponent";
import { useDriverContext } from "../context/driver.context";

const LOCATION_TASK_NAME = 'background-location-task';
const BACKGROUND_FETCH_TASK = 'background-fetch';

// Define the background location task
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data: { locations }, error }) => {
  if (error) {
    console.error(error);
    return;
  }
  if (locations && locations.length > 0) {
    const location = locations[locations.length - 1];
    try {
      const tripDetails = await loadStoredData();
      if (tripDetails?.busId && tripDetails?.schoolId && tripDetails?.tripEnabled) {
        await updateFirebase(
          database,
          tripDetails.busId,
          tripDetails.schoolId,
          tripDetails.tripSelected,
          location,
          location.coords.heading || 0
        );
      }
    } catch (error) {
      console.error("Background location update failed:", error);
    }
  }
});

// Define background fetch task
TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    const tripDetails = await loadStoredData();
    if (tripDetails?.tripEnabled) {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });
      
      if (tripDetails?.busId && tripDetails?.schoolId) {
        await updateFirebase(
          database,
          tripDetails.busId,
          tripDetails.schoolId,
          tripDetails.tripSelected,
          location,
          location.coords.heading || 0
        );
      }
      return BackgroundFetch.BackgroundFetchResult.NewData;
    }
    return BackgroundFetch.BackgroundFetchResult.NoData;
  } catch (error) {
    console.error("Background fetch failed:", error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

const PickupConfirmationOverlay = ({ onDone }) => {
  return (
    <View style={styles.overlayContainer}>
      <View style={styles.overlayContent}>
        <Text style={styles.overlayText}>
          Childrens are ready at pickup point
        </Text>
        <TouchableOpacity style={styles.doneButton} onPress={onDone}>
          <Text style={styles.doneButtonText}>Arrived</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const MapScreen = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [heading, setHeading] = useState(null);
  const [tripEnabled, setTripEnabled] = useState(false);
  const [tripDetails, setTripDetails] = useState(null);
  const [tripSelected, setTripSelected] = useState(null);
  const [pickupPoints, setPickupPoints] = useState([]);
  const [currentPickupIndex, setCurrentPickupIndex] = useState(0);
  const [directions, setDirections] = useState([]);
  const [showPickupConfirmation, setShowPickupConfirmation] = useState(false);
  const mapRef = useRef(null);
  const locationIntervalRef = useRef(null);
  const watchPositionRef = useRef(null);
  const lastFirebaseUpdateRef = useRef(0);
  const lastHeadingRef = useRef(0);
  const pickupPointsFetchedRef = useRef(false);
  const isTripActiveRef = useRef(true);

  const { tripStarted, setTripStarted } = useDriverContext();

  const startBackgroundLocationUpdates = async () => {
    try {
      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      if (backgroundStatus === 'granted') {
        await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 10000,
          distanceInterval: 10,
          foregroundService: {
            notificationTitle: "Trip Active",
            notificationBody: "Your trip is in progress. Location tracking enabled.",
            notificationColor: "#4CAF50",
            notificationPriority: "high",
            notificationChannelId: 'location-tracking',
            notificationId: 1,
            notificationOngoing: true,
            notificationSticky: true, // Make the notification non-dismissible
          },
          showsBackgroundLocationIndicator: true,
        });

        // Register background fetch
        await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
          minimumInterval: 60, // 1 minute
          stopOnTerminate: false,
          startOnBoot: true,
        });

        // Store trip enabled status
        await loadStoredData({
          ...tripDetails,
          tripEnabled: true,
          tripSelected
        });
      }
    } catch (error) {
      console.error("Error starting background location:", error);
    }
  };

  const stopBackgroundLocationUpdates = async () => {
    try {
      const isTaskRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
      if (isTaskRegistered) {
        await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
      }
      
      const isBackgroundFetchRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);
      if (isBackgroundFetchRegistered) {
        await BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
      }

      // Update stored trip status
      await loadStoredData({
        ...tripDetails,
        tripEnabled: false
      });
    } catch (error) {
      console.error("Error stopping background location:", error);
    }
  };

  // Fetch pickup points from Firebase
  const fetchPickupPoints = useCallback(
    async ({ tripID }) => {
      if (!tripEnabled) return;
      try {
        if (!pickupPointsFetchedRef.current) {
          const pickupPoints = await getPickupPointsData(tripID);
          const notificationData = await notificationsSchemaData(tripID);
          
          if (pickupPoints && pickupPoints.length > 0) {
            const points = pickupPoints
              .map((point) => {
                if (!point?.pickupLocation) {
                  console.warn("Missing pickup location for point:", point);
                  return null;
                }
                const [latitude, longitude] = point.pickupLocation
                  .split(",")
                  .map((coord) => Number(coord.trim()));
                if (isNaN(latitude) || isNaN(longitude)) {
                  console.warn("Invalid coordinates:", point.pickupLocation);
                  return null;
                }
                return { latitude, longitude };
              })
              .filter((point) => point !== null);

            if (points.length > 0) {
              setPickupPoints(points);
              setCurrentPickupIndex(0);
              pickupPointsFetchedRef.current = true;
            } else {
              console.warn("No valid pickup locations found");
            }
          } else {
            console.warn("No pickup points available for this trip");
          }
        }
      } catch (error) {
        console.error("Error fetching pickup points:", error);
      }
    },
    [tripEnabled]
  );

  // Reset pickup points fetch flag when trip is disabled
  useEffect(() => {
    if (!tripEnabled) {
      setTripEnabled(false);
      console.log("Trip disabled, cleaning up...");
      stopBackgroundLocationUpdates();
      // Clear location tracking when trip is disabled
      if (watchPositionRef.current) {
        watchPositionRef.current.remove();
        watchPositionRef.current = null;
      }
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
        locationIntervalRef.current = null;
      }
      // Reset all location related states
      setUserLocation(null);
      setHeading(null);
      setDirections([]);
      lastHeadingRef.current = 0;
      lastFirebaseUpdateRef.current = 0;
      setTripSelected(null);
      pickupPointsFetchedRef.current = false;
      setPickupPoints([]);
      console.log("Cleanup completed, tripEnabled:", tripEnabled);
    } else {
      startBackgroundLocationUpdates();
    }
  }, [tripEnabled]);

  // store schoolId, busId, no.of.trips for the bus
  useEffect(() => {
    const loadTripData = async () => {
      const data = await loadStoredData();
      setTripDetails(data);
    };
    loadTripData();
  }, []);

  const handleEndTrip = () => {
    Alert.alert("Confirm End Trip", "Are you sure you want to end the trip?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Yes, End Trip",
        onPress: async () => {
          try {
            // First stop background tasks
            await stopBackgroundLocationUpdates();
            
            // Then stop watch position if active
            if (watchPositionRef.current) {
              watchPositionRef.current.remove();
              watchPositionRef.current = null;
            }

            // Clear interval if active  
            if (locationIntervalRef.current) {
              clearInterval(locationIntervalRef.current);
              locationIntervalRef.current = null;
            }

            // Update state and refs after stopping services
            isTripActiveRef.current = false;
            setTripEnabled(false);
            setTripStarted(false);
            setTripSelected(null);
            setUserLocation(null);
            setHeading(null);
            setDirections([]);
            setCurrentPickupIndex(0);
            lastHeadingRef.current = 0;
            lastFirebaseUpdateRef.current = 0;
            pickupPointsFetchedRef.current = false;
            setPickupPoints([]);

            console.log("Trip ended and all tracking/updates stopped");
          } catch (error) {
            console.error("Error stopping trip:", error);
            Alert.alert("Error", "Failed to properly end trip. Please try again.");
          }
        },
      },
    ]);
  };

  const fetchUserLocation = useCallback(async () => {
    if (!isTripActiveRef.current || !tripEnabled || !tripSelected) return;
    try {
      
      console.log("fetchUserLocation called, tripEnabled:", tripEnabled);
      const location = await getLocationAsync();
      const updatedLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setUserLocation(updatedLocation);

      if (location.coords.heading !== null) {
        setHeading(location.coords.heading);
        lastHeadingRef.current = location.coords.heading;
      }

      const now = Date.now();
      if (tripEnabled && now - lastFirebaseUpdateRef.current >= 2000) {
        await updateFirebase(
          database,
          tripDetails?.busId,
          tripDetails?.schoolId,
          tripSelected,
          location,
          lastHeadingRef.current
        );
        lastFirebaseUpdateRef.current = now;
      }

      if (mapRef.current) {
        mapRef.current.animateToRegion(updatedLocation, 2000);
      }
      return location;
    } catch (error) {
      console.error("Failed to fetch location:", error);
      throw error;
    }
  }, [tripEnabled, tripDetails, tripSelected]);

  const fetchDirections = useCallback(async (origin, destination) => {
    if (!origin || !destination) {
      console.log("Missing origin or destination coordinates");
      return;
    }

    try {
      const apiKey = Constants.expoConfig?.android?.config?.googleMaps?.apiKey;
      if (!apiKey) {
        console.error("Google Maps API key is missing");
        return;
      }

      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&key=${apiKey}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.status === "OK" && data.routes.length) {
        const points = polyline.decode(data.routes[0].overview_polyline.points);
        const coords = points.map((point) => ({
          latitude: point[0],
          longitude: point[1],
        }));
        setDirections(coords);
      } else {
        console.warn("No routes found in directions response:", data.status);
        setDirections([]);
      }
    } catch (error) {
      console.error("Failed to fetch directions:", error);
      setDirections([]);
    }
  }, []);

  const getDistance = (coord1, coord2) => {
    if (!coord1 || !coord2) return Infinity;

    const R = 6371e3; // Earth's radius in meters
    const φ1 = (coord1.latitude * Math.PI) / 180;
    const φ2 = (coord2.latitude * Math.PI) / 180;
    const Δφ = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
    const Δλ = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance;
  };

  const moveToNextPickupPoint = useCallback(() => {
    setCurrentPickupIndex((prevIndex) => {
      const nextIndex = prevIndex + 1;
      if (nextIndex >= pickupPoints.length) {
        handleEndTrip();
        return prevIndex;
      }
      console.log("Moving to next pickup point:", pickupPoints[nextIndex]);

      if (userLocation) {
        fetchDirections(userLocation, pickupPoints[nextIndex]);
      }

      return nextIndex;
    });
  }, [pickupPoints, userLocation, fetchDirections]);

  const handleUpdates = useCallback(async () => {
    if (!tripEnabled || !tripDetails || !tripSelected) return;
    try {
      const location = await fetchUserLocation();
      if (!location) return;
    } catch (error) {
      Alert.alert("Update Error", error.message);
    }
  }, [fetchUserLocation, tripEnabled, tripDetails, tripSelected]);

  const handlePickupConfirmation = () => {
    setShowPickupConfirmation(false);
    moveToNextPickupPoint();
  };

  useEffect(() => {
    if (!tripEnabled || !tripSelected) return;
    if (
      userLocation &&
      pickupPoints &&
      pickupPoints.length > currentPickupIndex
    ) {
      fetchDirections(userLocation, pickupPoints[currentPickupIndex]);
    }
  }, [userLocation, pickupPoints, currentPickupIndex, fetchDirections]);

  useEffect(() => {
    if (tripEnabled) {
      let locationInterval;
      let watchPosition;

      const initializeTracking = async () => {
        try {
          await fetchPickupPoints({ tripID: tripSelected });

          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === "granted") {
            watchPosition = await Location.watchPositionAsync(
              {
                accuracy: Location.Accuracy.BestForNavigation,
                distanceInterval: 10,
                timeInterval: 1000,
              },
              async (location) => {
                if (!tripEnabled || !tripSelected) return;

                const updatedLocation = {
                  latitude: location?.coords?.latitude,
                  longitude: location?.coords?.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                };
                setUserLocation(updatedLocation);

                if (pickupPoints && pickupPoints.length > currentPickupIndex) {
                  const currentDistance = getDistance(
                    {
                      latitude: location.coords.latitude,
                      longitude: location.coords.longitude,
                    },
                    pickupPoints[currentPickupIndex]
                  );

                  if (currentDistance <= 20) {
                    setShowPickupConfirmation(true);
                  }
                }

                if (location.coords.heading !== null) {
                  lastHeadingRef.current = location.coords.heading;
                  setHeading(location.coords.heading);
                }

                const now = Date.now();
                if (
                  now - lastFirebaseUpdateRef.current >= 2000 &&
                  tripEnabled &&
                  tripSelected
                ) {
                  await updateFirebase(
                    database,
                    tripDetails?.busId,
                    tripDetails?.schoolId,
                    tripSelected,
                    location,
                    lastHeadingRef.current
                  );
                  lastFirebaseUpdateRef.current = now;
                }
              }
            );
            watchPositionRef.current = watchPosition;

            locationInterval = setInterval(handleUpdates, 2000);
            locationIntervalRef.current = locationInterval;
          }
        } catch (error) {
          console.error("Tracking initialization error:", error);
          Alert.alert("Error", "Failed to initialize location tracking");
        }
      };

      if (tripEnabled) {
        console.log("Initializing tracking...");
        initializeTracking();
      }

      return () => {
        console.log("Cleaning up tracking...");
        if (locationInterval) {
          clearInterval(locationInterval);
        }
        if (watchPosition) {
          watchPosition.remove();
        }
        locationIntervalRef.current = null;
        watchPositionRef.current = null;
      };
    }
  }, [tripEnabled, tripSelected, pickupPoints, currentPickupIndex]);

  if (!tripEnabled) {
    return (
      <TripSelectionComponent
        tripEnabled={tripEnabled}
        setTripEnabled={setTripEnabled}
        tripDetails={tripDetails}
        tripSelected={tripSelected}
        setTripSelected={setTripSelected}
      />
    );
  }

  if (!userLocation && tripEnabled) {
    return <Loader text="Fetching Location" />;
  }

  return (
    <View style={tw`flex-1`}>
      {showPickupConfirmation && (
        <PickupConfirmationOverlay onDone={handlePickupConfirmation} />
      )}
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
        showsUserLocation={true}
        showsCompass
        zoomEnabled
        maxZoomLevel={18}
        pitchEnabled
        followsUserLocation
      >
        {pickupPoints && pickupPoints.length > currentPickupIndex && (
          <Marker
            coordinate={pickupPoints[currentPickupIndex]}
            title="Pickup Point"
          />
        )}
        {directions.length > 0 && (
          <Polyline
            coordinates={directions}
            strokeWidth={4}
            strokeColor="blue"
          />
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
  overlayContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2000,
  },
  overlayContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  overlayText: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: "center",
  },
  doneButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 5,
  },
  doneButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default MapScreen;