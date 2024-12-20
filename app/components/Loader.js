import React from "react";
import { StyleSheet, View, ActivityIndicator, Text } from "react-native";
import tw from "tailwind-react-native-classnames";

const Loader = ({ 
  size = "large", 
  color = "#FCD32D", 
  text = "Loading...", 
  backgroundColor = "#FFFFFF"
}) => {
  // Determine the text color based on the background color
  const textColor = backgroundColor === "#FFFFFF" ? "#000000" : "#FFFFFF";

  return (
    <View style={[styles.loader, { backgroundColor }]}>
      <ActivityIndicator size={size} color={color} />
      <Text style={[tw`text-center mt-2 text-lg font-bold`, { color: textColor }]}>{text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default Loader;
