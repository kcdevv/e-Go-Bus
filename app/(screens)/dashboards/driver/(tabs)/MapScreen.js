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

const PickupConfirmationOverlay = ({ onDone }) => {
    return (
        <View style={styles.overlayContainer}>
            <View style={styles.overlayContent}>
                <Text style={styles.overlayText}>You have reached the pickup point</Text>
                <TouchableOpacity style={styles.doneButton} onPress={onDone}>
                    <Text style={styles.doneButtonText}>Done</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const MapScreen = () => {
    const [userLocation, setUserLocation] = useState(null);
    const [heading, setHeading] = useState(0);
    const [tripEnabled, setTripEnabled] = useState(false);
    const [tripDetails, setTripDetails] = useState(null);
    const [tripSelected, setTripSelected] = useState(null);
    const [pickupPoints, setPickupPoints] = useState([]);
    const [currentPickupIndex, setCurrentPickupIndex] = useState(0);
    const [directions, setDirections] = useState([]);
    const [showPickupConfirmation, setShowPickupConfirmation] = useState(false);
    const rotationValue = useRef(new Animated.Value(0)).current;
    const mapRef = useRef(null);
    const locationIntervalRef = useRef(null);
    const watchPositionRef = useRef(null);
    const lastFirebaseUpdateRef = useRef(0);
    const lastHeadingRef = useRef(0);
    const pickupPointsFetchedRef = useRef(false);

    // Fetch and store pick up points
    const storePickupPoints = useCallback(async ({ tripID }) => {
        try {
            // Only fetch if not already fetched for this trip
            if (!pickupPointsFetchedRef.current) {
                const pickupPoints = await getPickupPointsData(tripID);
                const pickupLocations = pickupPoints.map(point => point?.pickupLocation);
                if (pickupLocations.length > 0) {
                    const points = pickupLocations.map(location => {
                        const [latitude, longitude] = location.split(',').map(Number);
                        return { latitude, longitude };
                    });
                    setPickupPoints(points);
                    setCurrentPickupIndex(0);
                    pickupPointsFetchedRef.current = true;
                } else {
                    console.warn("No pickup locations available for this trip");
                }
            }
        } catch (error) {
            console.error("Error fetching pickup points from AsyncStorage:", error);
        }
    }, []);

    // Reset pickup points fetch flag when trip is disabled
    useEffect(() => {
        if (!tripEnabled) {
            pickupPointsFetchedRef.current = false;
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
        Alert.alert(
            "Confirm End Trip",
            "Are you sure you want to end the trip?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Yes, End Trip",
                    onPress: async () => {
                        try {
                            if (watchPositionRef.current) {
                                await watchPositionRef.current.remove();
                                watchPositionRef.current = null;
                            }
                            if (locationIntervalRef.current) {
                                clearInterval(locationIntervalRef.current);
                                locationIntervalRef.current = null;
                            }
                            setUserLocation(null);
                            setHeading(0);
                            setDirections([]);
                            setCurrentPickupIndex(0);
                            lastHeadingRef.current = 0;
                            lastFirebaseUpdateRef.current = 0;
                            setTripEnabled(false);
                            pickupPointsFetchedRef.current = false;
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

            if (location.coords.heading !== null) {
                setHeading(location.coords.heading);
                lastHeadingRef.current = location.coords.heading;
                rotateMarker(rotationValue, location.coords.heading);
            } else {
                setHeading(lastHeadingRef.current);
            }

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
            if (data.status === 'OK' && data.routes.length) {
                const points = polyline.decode(data.routes[0].overview_polyline.points);
                const coords = points.map(point => ({
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

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        return distance;
    };

    const moveToNextPickupPoint = useCallback(() => {
        setCurrentPickupIndex(prevIndex => {
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
        if (!tripEnabled || !tripDetails) return;
        try {
            const location = await fetchUserLocation();
            if (!location) return;
        } catch (error) {
            Alert.alert("Update Error", error.message);
        }
    }, [fetchUserLocation, tripEnabled, tripDetails]);

    const handlePickupConfirmation = () => {
        setShowPickupConfirmation(false);
        moveToNextPickupPoint();
    };

    useEffect(() => {
        if (userLocation && pickupPoints && pickupPoints.length > currentPickupIndex) {
            fetchDirections(userLocation, pickupPoints[currentPickupIndex]);
        }
    }, [userLocation, pickupPoints, currentPickupIndex, fetchDirections]);

    useEffect(() => {
        let locationInterval;
        let watchPosition;

        const initializeTracking = async () => {
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
                            distanceInterval: 10,
                            timeInterval: 1000,
                        },
                        async (location) => {
                            if (!tripEnabled) return;

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
                                        longitude: location.coords.longitude 
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
                                rotateMarker(rotationValue, location.coords.heading);
                            }

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

        if (tripEnabled) {
            initializeTracking();
        }

        return () => {
            if (locationInterval) {
                clearInterval(locationInterval);
            }
            if (watchPosition) {
                watchPosition.remove();
            }
            locationIntervalRef.current = null;
            watchPositionRef.current = null;
        };
    }, [tripEnabled, tripSelected, pickupPoints, currentPickupIndex]);

    const rotate = rotationValue.interpolate({
        inputRange: [0, 360],
        outputRange: ["0deg", "360deg"],
    });

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
                showsUserLocation={false}
                showsCompass
                zoomEnabled
                maxZoomLevel={18}
                pitchEnabled
                followsUserLocation
            >
                <Marker coordinate={userLocation} title="Your Location" anchor={{ x: 0.5, y: 0.5 }}>
                    <Animated.Image
                        source={require("../../../../assets/icons/bus.png")}
                        style={[styles.markerImage, { transform: [{ rotate }] }]}
                    />
                </Marker>
                {pickupPoints && pickupPoints.length > currentPickupIndex && (
                    <Marker coordinate={pickupPoints[currentPickupIndex]} title="Pickup Point" />
                )}
                {directions.length > 0 && (
                    <Polyline
                        coordinates={directions}
                        strokeWidth={4}
                        strokeColor="blue"
                        zIndex={1000}
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
    overlayContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2000,
    },
    overlayContent: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
        alignItems: 'center',
    },
    overlayText: {
        fontSize: 18,
        marginBottom: 20,
        textAlign: 'center',
    },
    doneButton: {
        backgroundColor: '#4CAF50',
        paddingVertical: 10,
        paddingHorizontal: 30,
        borderRadius: 5,
    },
    doneButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    }
});

export default MapScreen;