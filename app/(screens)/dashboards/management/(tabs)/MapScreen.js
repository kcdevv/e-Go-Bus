import { StyleSheet, Image, Alert } from "react-native";
import React, { useState, useEffect, useCallback } from "react";
import MapView from "react-native-maps";
import { Marker } from "react-native-maps";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { get, ref } from "firebase/database";
import { database } from "../../../../../firebase.config";
import Loader from "../../../../components/Loader";

// Memoized Marker component to avoid unnecessary re-renders
const MemoizedMarker = React.memo(({ location }) => {
  return (
    <Marker
      coordinate={{
        latitude: location.latitude,
        longitude: location.longitude,
      }}
      title={location.title}
    >
      <Image
        source={require("../../../../assets/images/bus.png")}
        style={[
          styles.busIcon,
          { transform: [{ rotate: `${location.heading}deg` }] }, // Rotate the bus icon
        ]}
      />
    </Marker>
  );
}, (prevProps, nextProps) => {
  // Only re-render if the location properties change
  return (
    prevProps.location.latitude === nextProps.location.latitude &&
    prevProps.location.longitude === nextProps.location.longitude &&
    prevProps.location.heading === nextProps.location.heading
  );
});

const MapScreen = () => {
  const [schoolID, setSchoolID] = useState(null);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Fetch schoolID from AsyncStorage
  useEffect(() => {
    const fetchSchoolID = async () => {
      try {
        const storedSchoolID = await AsyncStorage.getItem("schoolID");
        const sanitizedSchoolID = storedSchoolID.replace(/['"]/g, "").trim();
        // console.log(sanitizedSchoolID)
        if (sanitizedSchoolID) {
          setSchoolID(sanitizedSchoolID);
        } else {
          Alert.alert("Error", "School ID not found in storage");
        }
      } catch (error) {
        console.error("Error retrieving School ID:", error);
        Alert.alert("Error", "Failed to retrieve School ID");
      }
    };

    fetchSchoolID();
  }, []);

  // Function to fetch bus locations from Firebase
  const fetchBusLocations = useCallback(async () => {
    if (!schoolID) return;

    try {
      const busesRef = ref(database, `schools/${schoolID}/buses`);
      const snapshot = await get(busesRef);

      if (!snapshot.exists()) {
        setLocations([]); // Clear the locations
        return;
      }

      const busesData = snapshot.val();
      const fetchedLocations = [];

      // Process trips inside buses
      Object.entries(busesData).forEach(([busId, busInfo]) => {
        if (busInfo?.trips) {
          Object.entries(busInfo.trips).forEach(([tripId, tripDetails]) => {
            if (tripDetails?.location) {
              fetchedLocations.push({
                id: `${busId}-${tripId}`, // Unique ID for markers
                title: `Bus ${busId} - Trip ${tripId}`,
                latitude: tripDetails.location.latitude,
                longitude: tripDetails.location.longitude,
                heading: tripDetails.location.heading || 0, // Default heading to 0 if not provided
              });
            }
          });
        }
      });

      // Only update locations if there's a change in coordinates or heading
      setLocations((prevLocations) => {
        const updatedLocations = fetchedLocations.filter((newLocation) => {
          return !prevLocations.some((prevLocation) =>
            prevLocation.id === newLocation.id &&
            prevLocation.latitude === newLocation.latitude &&
            prevLocation.longitude === newLocation.longitude &&
            prevLocation.heading === newLocation.heading
          );
        });

        return updatedLocations.length > 0 ? fetchedLocations : prevLocations;
      });
    } catch (error) {
      console.error("Error fetching bus locations:", error);
      Alert.alert("Error", "Failed to fetch bus locations");
    }
  }, [schoolID]);

  // Set up interval to fetch bus locations every 3 seconds
  useEffect(() => {
    if (!schoolID) return;

    const intervalId = setInterval(() => {
      fetchBusLocations();
    }, 3000);

    // Clear interval on component unmount
    return () => clearInterval(intervalId);
  }, [schoolID, fetchBusLocations]);

  // Initial fetch when schoolID changes
  useEffect(() => {
    if (schoolID) {
      fetchBusLocations();
      setLoading(false);
    }
  }, [schoolID, fetchBusLocations]);

  // Render loading state
  if (loading) {
    return <Loader />;
  }

  return (
    <MapView
      style={styles.map}
      initialRegion={{
        latitude: 17.385044, // Default latitude
        longitude: 78.486671, // Default longitude
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      }}
    >
      {locations.map((location) => (
        <MemoizedMarker key={location.id} location={location} />
      ))}
    </MapView>
  );
};

const styles = StyleSheet.create({
  map: {
    width: "100%",
    height: "100%",
  },
  busIcon: {
    width: 40,
    height: 40,
    resizeMode: "contain",
  },
});

export default MapScreen;
