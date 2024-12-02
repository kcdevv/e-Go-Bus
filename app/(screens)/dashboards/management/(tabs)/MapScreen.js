import { StyleSheet, Image, View, ActivityIndicator, Alert } from "react-native";
import React, { useState, useEffect } from "react";
import MapView from "react-native-maps";
import { Marker } from "react-native-maps";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { get, ref } from "firebase/database";
import { database } from "../../../../../firebase.config";

const MapScreen = () => {
  const [schoolID, setSchoolID] = useState(null);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch schoolID from AsyncStorage
  useEffect(() => {
    const fetchSchoolID = async () => {
      try {
        const storedSchoolID = await AsyncStorage.getItem("schoolID");
        if (storedSchoolID) {
          setSchoolID(storedSchoolID);
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
  const fetchBusLocations = async () => {
    if (!schoolID) return;

    try {
      const busesRef = ref(database, `schools/${schoolID}/buses`);
      const snapshot = await get(busesRef);

      if (!snapshot.exists()) {
        Alert.alert("No Data", "No buses found for this school.");
        setLocations([]);
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
                accuracy: tripDetails.location.accuracy,
                timestamp: tripDetails.location.timestamp,
              });
            }
          });
        }
      });

      setLocations(fetchedLocations);
    } catch (error) {
      console.error("Error fetching bus locations:", error);
      Alert.alert("Error", "Failed to fetch bus locations");
    }
  };

  // Set up interval to fetch bus locations every 3 seconds
  useEffect(() => {
    if (!schoolID) return;

    const intervalId = setInterval(() => {
      fetchBusLocations();
    }, 3000);

    // Clear interval on component unmount
    return () => clearInterval(intervalId);
  }, [schoolID]);

  // Initial fetch when schoolID changes
  useEffect(() => {
    if (schoolID) {
      fetchBusLocations();
      setLoading(false);
    }
  }, [schoolID]);

  // Render loading state
  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#FCD32D" />
      </View>
    );
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
        <Marker
          key={location.id}
          coordinate={{
            latitude: location.latitude,
            longitude: location.longitude,
          }}
          title={location.title}
        >
          <Image
            source={require("../../../../assets/icons/bus.png")}
            style={{ width: 40, height: 40 }}
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
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default MapScreen;
