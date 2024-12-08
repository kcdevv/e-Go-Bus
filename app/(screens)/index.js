import { StyleSheet, Text, View, Animated } from "react-native";
import React, { useEffect, useRef } from "react";
import { useRouter } from "expo-router";
import tw from "tailwind-react-native-classnames";
import LottieView from "lottie-react-native";
import registerDeviceToken from "./services/fetchTokenAndSaveRDB";
import AsyncStorage from "@react-native-async-storage/async-storage";

const Index = () => {
  const router = useRouter();
  const loadingBarWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const setupTokenAndNavigate = async () => {
      try {
        const schoolID = await AsyncStorage.getItem("schoolID");
        const busID = await AsyncStorage.getItem("busID");
        const tripID = await AsyncStorage.getItem("tripID");
        const studentID = await AsyncStorage.getItem("studentID");
        const driverName = await AsyncStorage.getItem("driverName");
        const isManagement = await AsyncStorage.getItem("isManagement") === true;

        // console.log("SchoolID:", schoolID);
        // console.log("BusID:", busID);
        // console.log("TripID:", tripID);
        // console.log("StudentID:", studentID);
        // console.log("driverName:", driverName);
        // console.log("IsManagement:", isManagement);

        // Wait for the animation to complete (3 seconds)
        setTimeout(async () => {
          if (schoolID && studentID && busID && tripID) {
            await registerDeviceToken(schoolID, studentID, busID, tripID);
            router.replace("dashboards/parent"); // Navigate to Parent Dashboard
          } else if (schoolID && driverName && busID && tripID) {
            router.replace("dashboards/driver"); // Navigate to Driver Dashboard
          } else if (isManagement) {
            router.replace("dashboards/management"); // Navigate to Management Dashboard
          } else {
            console.warn("No valid user type found. Redirecting to WhoYouAre.");
            router.replace("/WhoYouAre"); // Default route
          }
        }, 3000); // Animation duration in milliseconds
      } catch (error) {
        console.error("Error during setup:", error);
        router.replace("/WhoYouAre"); // Navigate to a safe fallback
      }
    };

    setupTokenAndNavigate();

    // Animate the loading bar
    Animated.timing(loadingBarWidth, {
      toValue: 150,
      duration: 3000,
      useNativeDriver: false,
    }).start();
  }, [router]);

  return (
    <View style={tw`flex-1 justify-center items-center`}>
      <LottieView
        style={{ width: 340, height: 200 }}
        source={require("../assets/animations/splashScreenAnimation.json")}
        autoPlay
        loop
        speed={2.5}
      />
      <Text style={{ fontSize: 25, fontWeight: "bold" }}>
        <Text style={{ fontSize: 30, fontWeight: "bold", color: "#FCD32D" }}>
          -{" "}
        </Text>
        EGO BUS
        <Text style={{ fontSize: 30, fontWeight: "bold", color: "#FCD32D" }}>
          {" "}
          -
        </Text>
      </Text>
      <Animated.View style={[styles.loadingBar, { width: loadingBarWidth }]} />
    </View>
  );
};

export default Index;

const styles = StyleSheet.create({
  loadingBar: {
    height: 6,
    backgroundColor: "#FCD32D",
    borderRadius: 3,
    marginTop: 16,
  },
});
