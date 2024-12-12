import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, SafeAreaView, Platform, View } from "react-native";

export default function HomeLayout() {
  return (
    <>
      {/* StatusBar for proper background color */}
      <StatusBar style="dark" backgroundColor="transparent" />
      
      {/* SafeAreaView ensures content starts below status bar */}
      <SafeAreaView style={styles.safeArea}>
        {/* <View style={styles.container}> */}
          <Stack
            screenOptions={{
              headerShown: false, // Show the header properly
              headerStyle: { backgroundColor: "#FCD32D" },
              headerTintColor: "black",
            }}
          >
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="WhoYouAre" options={{ headerShown: false }} />
            <Stack.Screen
              name="forms/Management"
              options={{ title: "Management Login" }}
            />
            <Stack.Screen
              name="forms/Parent"
              options={{ title: "Parent Login" }}
            />
            <Stack.Screen
              name="forms/Driver"
              options={{ title: "Driver Login" }}
            />
            <Stack.Screen
              name="dashboards/management"
              options={{ title: "e-Go Bus" }}
            />
            <Stack.Screen
              name="dashboards/driver"
              options={{ title: "e-Go Bus" }}
            />
            <Stack.Screen
              name="dashboards/parent"
              options={{ title: "e-Go Bus" }}
            />
          </Stack>
        {/* </View> */}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "transparent",
  },
  container: {
    flex: 1,
  },
});
