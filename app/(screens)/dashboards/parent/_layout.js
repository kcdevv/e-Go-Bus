import { StyleSheet, Text, View } from "react-native";
import React from "react";
import { Stack } from "expo-router";
// import * as Location from 'expo-location';

const ParentLayout = () => {

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
};

export default ParentLayout;

