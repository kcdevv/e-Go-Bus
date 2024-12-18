import React, { useEffect, useState, useRef, useCallback } from "react";
import { StyleSheet, Alert, Animated, View, Text, Image, TouchableOpacity } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import * as Location from "expo-location";
import { database } from "../../../../../firebase.config";
import { loadStoredData, getLocationAsync } from "../services/locationService";
import Loader from "../../../../components/Loader";
import { rotateMarker, updateFirebase } from "../utils/locationUtils";
import tw from "tailwind-react-native-classnames";
import polyline from '@mapbox/polyline';
import Constants from "expo-constants";
import { getPickupPointsData } from '../utils/getPickUpPoints'
import TripSelectionComponent from '../utils/TripSelectionComponent';

const MapScreen = () => {
    const [userLocation, setUserLocation] = useState(null);
    const [heading, setHeading] = useState(0);
    const [tripEnabled, setTripEnabled] = useState(false);
    const [tripDetails, setTripDetails] = useState(null);
    const [tripSelected, setTripSelected] = useState(null);
    const [pickupPoints, setPickupPoints] = useState([]);
    const [directions, setDirections] = useState([]);
    const [showPickupConfirmation, setShowPickupConfirmation] = useState(false);
    const rotationValue = useRef(new Animated.Value(0)).current;
    const mapRef = useRef(null);
    const locationIntervalRef = useRef(null);
    const watchPositionRef = useRef(null);
    const lastFirebaseUpdateRef = useRef(0);
    const lastHeadingRef = useRef(0);

    // Fetch and store pick up points
    const storePickupPoints = useCallback(async ({ tripID }) => {
        try {
            // Fetch pickup points data
            const pickupPoints = await getPickupPointsData(tripID);
            const pickupLocations = pickupPoints.map(point => point?.pickupLocation);
            // Split pickup locations and map them
            if (pickupLocations.length > 0) {
                const points = pickupLocations.map(location => {
                    const [latitude, longitude] = location.split(',').map(Number);
                    return { latitude, longitude };
                });
                setPickupPoints(points);
            } else {
                console.warn("No pickup locations available for this trip");
            }
        } catch (error) {
            console.error("Error fetching pickup points from AsyncStorage:", error);
        }
    }, []);

    // store schoolId, busId, no.of.trips for the bus
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
                        try {
                            // Stop location watching
                            if (watchPositionRef.current) {
                                await watchPositionRef.current.remove();
                                watchPositionRef.current = null;
                            }

                            // Clear update interval
                            if (locationIntervalRef.current) {
                                clearInterval(locationIntervalRef.current);
                                locationIntervalRef.current = null;
                            }

                            // Reset all location-related state
                            setUserLocation(null);
                            setHeading(0);
                            setDirections([]);
                            lastHeadingRef.current = 0;
                            lastFirebaseUpdateRef.current = 0;

                            // Finally disable the trip
                            setTripEnabled(false);
                            
                            console.log("Trip ended and all tracking stopped");
                        } catch (error) {
                            console.error("Error stopping trip:", error);
                            Alert.alert("Error", "Failed to properly end trip");
                        }
                    }
                },
            ]
        );
    };

    // Fetch the user's location
    const fetchUserLocation = useCallback(async () => {
        if (!tripEnabled) return;
        
        try {
            const location = await getLocationAsync();
            const updatedLocation = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            };
            setUserLocation(updatedLocation);

            // Update heading from location
            if (location.coords.heading !== null) {
                setHeading(location.coords.heading);
                lastHeadingRef.current = location.coords.heading;
                rotateMarker(rotationValue, location.coords.heading);
            } else {
                setHeading(lastHeadingRef.current);
            }

            // Update Firebase with location and heading
            const now = Date.now();
            if (now - lastFirebaseUpdateRef.current >= 2000) {
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

            // Animate map to follow the user
            if (mapRef.current) {
                mapRef.current.animateToRegion(updatedLocation, 2000);
            }
            return location;
        } catch (error) {
            console.error("Failed to fetch location:", error);
            throw error;
        }
    }, [tripEnabled, tripDetails, tripSelected]);

    // Fetch directions from user location to a pickup point
    const fetchDirections = useCallback(async (origin, destination) => {
        if (!origin || !destination) return;
        
        try {
            const response = await fetch(`https://maps.googleapis.com/maps/api/directions/json?origin=${origin?.latitude},${origin?.longitude}&destination=${destination?.latitude},${destination?.longitude}&key=${Constants.expoConfig.android.config.googleMaps.apiKey}`);
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
        const EARTH_RADIUS_METERS = 6371e3; // Earth's radius in meters

        // Convert latitude and longitude from degrees to radians
        const lat1Radians = coord1.latitude * Math.PI / 180;
        const lat2Radians = coord2.latitude * Math.PI / 180;
        const deltaLatRadians = (coord2.latitude - coord1.latitude) * Math.PI / 180;
        const deltaLonRadians = (coord2.longitude - coord1.longitude) * Math.PI / 180;

        // Apply the Haversine formula
        const a = Math.sin(deltaLatRadians / 2) * Math.sin(deltaLatRadians / 2) +
            Math.cos(lat1Radians) * Math.cos(lat2Radians) *
            Math.sin(deltaLonRadians / 2) * Math.sin(deltaLonRadians / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        // Calculate the distance
        const distance = EARTH_RADIUS_METERS * c; // Distance in meters
        return distance;
    };

    // Master function to handle all updates
    const handleUpdates = useCallback(async () => {
        if (!tripEnabled || !tripDetails) return;
        try {
            const location = await fetchUserLocation();

            // Check if user is near the current pickup point
            if (pickupPoints && pickupPoints.length > 0 && location?.coords) {
                const distance = getDistance(location.coords, pickupPoints[0]);
                if (distance <= 20) {
                    setShowPickupConfirmation(true);
                }
            }

        } catch (error) {
            Alert.alert("Update Error", error.message);
        }
    }, [fetchUserLocation, tripEnabled, tripDetails, pickupPoints]);

    // Effect to update directions when userLocation or pickupPoints change
    useEffect(() => {
        if (userLocation && pickupPoints && pickupPoints.length > 0) {
            fetchDirections(userLocation, pickupPoints[0]);
        }
    }, [userLocation, pickupPoints, fetchDirections]);

    // Initialize trip data and set up location tracking
    useEffect(() => {
        let locationInterval;
        let watchPosition;

        const initializeTracking = async () => {
            // Only initialize if trip is enabled and we have a selected trip
            if (!tripEnabled || !tripSelected) {
                return;
            }

            try {
                await storePickupPoints({ tripID: tripSelected });
                
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status === 'granted') {
                    watchPosition = await Location.watchPositionAsync(
                        {
                            accuracy: Location.Accuracy.BestForNavigation,
                            distanceInterval: 20,
                            timeInterval: 1000,
                        },
                        async (location) => {
                            // Double check trip is still enabled before processing location
                            if (!tripEnabled) {
                                return;
                            }

                            const updatedLocation = {
                                latitude: location?.coords?.latitude,
                                longitude: location?.coords?.longitude,
                                latitudeDelta: 0.01,
                                longitudeDelta: 0.01,
                            };
                            setUserLocation(updatedLocation);

                            if (location.coords.heading !== null) {
                                lastHeadingRef.current = location.coords.heading;
                                setHeading(location.coords.heading);
                                rotateMarker(rotationValue, location.coords.heading);
                            }
                        }
                    );
                    watchPositionRef.current = watchPosition;

                    locationInterval = setInterval(handleUpdates, 2000);
                    locationIntervalRef.current = locationInterval;
                }
            } catch (error) {
                console.error('Tracking initialization error:', error);
                Alert.alert("Error", "Failed to initialize location tracking");
            }
        };

        // Start tracking when trip is enabled
        if (tripEnabled) {
            initializeTracking();
        }

        // Cleanup function
        return () => {
            if (locationInterval) {
                clearInterval(locationInterval);
            }
            if (watchPosition) {
                watchPosition.remove();
            }
            // Reset refs
            locationIntervalRef.current = null;
            watchPositionRef.current = null;
        };
    }, [tripEnabled, tripSelected]);

    // Interpolate rotation for marker
    const rotate = rotationValue.interpolate({
        inputRange: [0, 360],
        outputRange: ["0deg", "360deg"],
    });

    // Render early return if trip is not enabled
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

    // Show loader if user location is not available
    if (!userLocation && tripEnabled) {
        return <Loader text="Fetching Location" />;
    }

    // Handle pickup confirmation
    const handlePickupConfirmation = (confirmed) => {
        if (confirmed) {
            // Move to the next pickup point
            setPickupPoints(prevPoints => {
                const remainingPoints = prevPoints.slice(1);
                if (remainingPoints.length === 0) {
                    // End the trip if all pickup points are completed
                    handleEndTrip();
                }
                return remainingPoints;
            });
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