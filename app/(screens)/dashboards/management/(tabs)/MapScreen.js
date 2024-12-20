import { StyleSheet, Alert, Image } from "react-native";
import React, { useState, useEffect, useCallback } from "react";
import MapView, { Marker } from "react-native-maps";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { get, ref } from "firebase/database";
import { database } from "../../../../../firebase.config";
import Loader from "../../../../components/Loader";

// Custom bus icon image
const busIcon = require("../../../../assets/icons/bus.png");

const MapScreen = () => {
  const [schoolID, setSchoolID] = useState(null);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mapRegion, setMapRegion] = useState(null);
  const [isCentroidSet, setIsCentroidSet] = useState(false);

  // Fetch schoolID from AsyncStorage
  useEffect(() => {
    const fetchSchoolID = async () => {
      try {
        const storedSchoolID = await AsyncStorage.getItem("schoolID");
        const sanitizedSchoolID = storedSchoolID.replace(/['"]/g, "").trim();
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

      // Calculate centroid for zooming when opening the map for the first time
      if (!isCentroidSet && fetchedLocations.length > 0) {
        const latitudes = fetchedLocations.map((loc) => loc.latitude);
        const longitudes = fetchedLocations.map((loc) => loc.longitude);

        const centroid = {
          latitude: latitudes.reduce((sum, lat) => sum + lat, 0) / latitudes.length,
          longitude: longitudes.reduce((sum, lon) => sum + lon, 0) / longitudes.length,
        };

        setMapRegion({
          ...centroid,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        });

        setIsCentroidSet(true);
      }

      setLocations(fetchedLocations);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching bus locations:", error);
      Alert.alert("Error", "Failed to fetch bus locations");
    }
  }, [schoolID, isCentroidSet]);

  // Set up interval to fetch bus locations every 3 seconds
  useEffect(() => {
    if (!schoolID) return;

    const intervalId = setInterval(() => {
      fetchBusLocations();
    }, 3000);

    return () => clearInterval(intervalId); // Clear interval on component unmount
  }, [schoolID, fetchBusLocations]);

  // Initial fetch when schoolID changes
  useEffect(() => {
    if (schoolID) {
      fetchBusLocations();
    }
  }, [schoolID, fetchBusLocations]);

  // Render loading state
  if (loading) {
    return <Loader />;
  }

  return (
    <MapView
      style={styles.map}
      region={mapRegion}
      onRegionChangeComplete={(region) => setMapRegion(region)}
    >
      {locations.map((location) => (
        <Marker
          key={location.id}
          coordinate={{
            latitude: location.latitude,
            longitude: location.longitude,
          }}
          title={location.title}
          rotation={location.heading} // Set heading for rotation
        >
          <Image
            source={busIcon} // Custom bus icon
            style={styles.markerImage} // Apply size adjustment here
          />
        </Marker>
      ))}
    </MapView>
  );
};

const styles = StyleSheet.create({
  map: {
    width: "100%",
    height: "100%",
  },
  markerImage: {
    width: 40,  // Adjust width as needed
    height: 40, // Adjust height as needed
  },
});

export default MapScreen;
