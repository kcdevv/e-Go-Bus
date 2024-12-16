import { View, Text } from "react-native";
import React, { useEffect } from "react";
import { Stack } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const DriverLayout = () => {
  useEffect(() => {
    // Define async logic inside the effect
    const fetchData = async () => {
      try {
        const schoolID = await AsyncStorage.getItem("schoolID");
        const busID = await AsyncStorage.getItem("busID");
        const tripID = await AsyncStorage.getItem("tripID");
        const studentID = await AsyncStorage.getItem("studentID");
        const driverID = await AsyncStorage.getItem("driverID");
        const isManagement = await AsyncStorage.getItem("isManagement") === "true";

        // console.log("SchoolID:", schoolID);
        // console.log("BusID:", busID);
        // console.log("TripID:", tripID);
        // console.log("StudentID:", studentID);
        // console.log("DriverID:", driverID);
        // console.log("IsManagement:", isManagement);
      } catch (error) {
        console.error("Error fetching async storage data:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
};

export default DriverLayout;
