import React, { useState } from "react";
import { Tabs, Link } from "expo-router";
import { Image, View, Text, TouchableOpacity, Animated, Dimensions } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import tw from "tailwind-react-native-classnames"
import { LinearGradient } from "expo-linear-gradient";


const screenWidth = Dimensions.get("window").width;

export default function ManagementDashboardLayout() {
  const [activeTab, setActiveTab] = useState("MapScreen");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuAnimation] = useState(new Animated.Value(screenWidth));

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    Animated.timing(menuAnimation, {
      toValue: isMenuOpen ? screenWidth : 0,
      duration: 600,
      useNativeDriver: false,
    }).start();
  };

  const renderTabIcon = (source, focused) => (
    <Image
      source={source}
      style={{
        marginBottom: 50,
        backgroundColor: "#FCD32D",
        width: focused ? 60 : 50, // Increase size if active
        height: focused ? 60 : 50, // Increase size if active
        borderRadius: 30, // Circular shape
        borderColor: focused ? "white" : "transparent", // Optional border for active tab
        borderWidth: focused ? 4 : 0,
      }}
    />
  );

  return (


    <View style={tw`flex-1 shadow-2xl`}>
      {/* Header with Hamburger Menu */}
      <View style={[tw`flex-row items-center justify-between p-4 pt-10`, { backgroundColor: "#FCD32D" }]}>
        <Text style={tw`text-lg font-bold`}>e-Go Bus</Text>
        <TouchableOpacity onPress={toggleMenu}>
          <FontAwesome name="bars" size={24} color="black" />
        </TouchableOpacity>
      </View>

      {/* Main Content (Tab Navigator and Menu) */}
      <View style={tw`flex-1`}>
        <Tabs
          screenOptions={{
            initialRouteName: "MapScreen",
            tabBarActiveTintColor: "#000",
            tabBarShowLabel: false,
            tabBarStyle: {
              backgroundColor: "#FCD32D",
              height: 60,
            },
            tabBarLabelStyle: {
              color: "black",
            },
          }}
          onTabPress={({ route }) => setActiveTab(route.name)} // Track active tab
        >

          <Tabs.Screen
            name="DriverDetails"
            options={{
              headerShown: false,
              tabBarIcon: ({ focused }) =>
                renderTabIcon(require("../../../../assets/images/driver.png"), focused), // Replace with your image path
            }}
          />
          <Tabs.Screen
            name="MapScreen"
            options={{
              headerShown: false,
              tabBarIcon: ({ focused }) =>
                renderTabIcon(require("../../../../assets/images/map.png"), focused), // Replace with your image path
            }}
          />
          <Tabs.Screen
            name="StudentDetails"
            options={{
              headerShown: false,
              tabBarIcon: ({ focused }) =>
                renderTabIcon(require("../../../../assets/images/student.png"), focused), // Replace with your image path
            }}
          />
        </Tabs>
      </View>

      {/* Conditional Rendering for Menu */}
      {isMenuOpen && (
        <Animated.View
          style={[
            tw`absolute top-0 right-0 bottom-0 w-64`,
            {
              transform: [{ translateX: menuAnimation }],
            },
          ]}
        >
          <View style={[tw`flex-1`, { backgroundColor: "#FCD32D" }]}>
            <LinearGradient
              colors={["#FCD32D", "white", "#FCD32D"]}
              style={tw`flex-1 p-5`}
              start={[0, 0]}
              end={[1, 1]}
            >
              <TouchableOpacity onPress={toggleMenu} style={tw`self-end mb-10 relative`}>
                <FontAwesome style={tw`relative mt-10 pr-5 `} name="times" size={24} color="black" />
              </TouchableOpacity>
              <View style={tw`flex-1 `}>
                <View style={tw``}>
                  <Text style={tw`text-lg mb-4 ml-10`}>
                    <Link href="/(screens)/dashboards/management/MenuComponents/FAQPage">FAQs</Link>
                  </Text>
                </View>
                <View style={tw`flex justify-center items-center absolute bottom-5 left-12 `}>
                  <TouchableOpacity style={tw`mt-auto bg-white p-3 w-28 rounded-lg`}>
                    <Text style={tw`text-center font-bold `}>Log out</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </LinearGradient>
          </View>
        </Animated.View>
      )}

    </View>




  );
}
