import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Tabs } from "expo-router";

export default function ParentDashboardLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#000",
        tabBarStyle: {
          backgroundColor: "#FCD32D",
        },
        // tabBarIndicatorStyle: {
        //   backgroundColor: "#FF5733", // Active tab indicator color
        //   height: 4, // Height of the indicator
        //   transform: [{ scaleX: 1.5 }], // Scale the indicator horizontally
        // },
      }}
    >
      <Tabs.Screen
        name="MapScreen"
        options={{
          title: "Home",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <FontAwesome size={28} name="home" color={color} />
          ),
          tabBarLabelStyle: {
            color: "black",
          },
        }}
      />
      <Tabs.Screen
        name="DriverDetails"
        options={{
          title: "Driver",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <FontAwesome size={28} name="cog" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="StudentDetails"
        options={{
          title: "Student",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <FontAwesome size={28} name="cog" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
