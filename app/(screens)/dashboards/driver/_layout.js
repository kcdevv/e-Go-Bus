import { View, Text } from "react-native";
import React from "react";
import { Stack } from "expo-router";

const DriverLayout = () => {
  return (
    <Stack screenOptions={{headerShown: false}}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
};

export default DriverLayout;
