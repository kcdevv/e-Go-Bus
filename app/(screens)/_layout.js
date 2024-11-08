import { Stack } from "expo-router";

export default function HomeLayout() {
  return (
    <Stack
      screenOptions={{
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
    </Stack>
  );
}
