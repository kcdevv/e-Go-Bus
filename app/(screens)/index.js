import { StyleSheet, Text, View, Animated } from "react-native";
import React, { useEffect, useRef } from "react";
import { useRouter } from "expo-router";
import tw from "tailwind-react-native-classnames";
import LottieView from "lottie-react-native";
import registerDeviceToken from "./services/fetchTokenAndSaveRDB";

const Index = () => {
  const router = useRouter();
  const loadingBarWidth = useRef(new Animated.Value(0)).current;

  // Start the loading bar animation and navigate after 3 seconds
  useEffect(() => {
    // Register the device token
    // 'ST004', 'stshashyd1234', 'B001', 'T001'
    registerDeviceToken().catch((err) =>
      console.error("Failed to register device token:", err)
    );
    // Animate the loading bar width over 3 seconds
    Animated.timing(loadingBarWidth, {
      toValue: 150,        // Final width of the loading bar
      duration: 3000,      // Duration in milliseconds
      useNativeDriver: false,
    }).start();

    // Redirect to "WhoYouAre" page after 4 seconds, using replace to prevent going back to the splash screen
    const timer = setTimeout(() => {
      router.replace("/WhoYouAre");
    }, 4000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <View style={tw`flex-1 justify-center items-center`}>
      <LottieView
        style={{ width: 340, height: 200 }}
        source={require("../assets/animations/splashScreenAnimation.json")}
        autoPlay
        loop
        speed={2.5} // Increase speed for faster animation
      />
      <Text style={{ fontSize: 25, fontWeight: "bold" }}>
        <Text style={{ fontSize: 30, fontWeight: "bold", color: "#FCD32D" }}>- </Text>
        EGO BUS
        <Text style={{ fontSize: 30, fontWeight: "bold", color: "#FCD32D" }}> -</Text>
      </Text>

      {/* Animated Loading Bar */}
      <Animated.View style={[styles.loadingBar, { width: loadingBarWidth }]} />
    </View>
  );
};

export default Index;

const styles = StyleSheet.create({
  loadingBar: {
    height: 6,                // Height of the loading bar
    backgroundColor: "#FCD32D", // Color of the loading bar
    borderRadius: 3,          // Round the edges
    marginTop: 16,
  },
});
