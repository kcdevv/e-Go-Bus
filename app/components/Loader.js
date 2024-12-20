import React from "react";
import { StyleSheet, View, ActivityIndicator, Text } from "react-native";
import tw from "tailwind-react-native-classnames";

const Loader = ({ 
  size = "large", 
  color = "#FCD32D", 
  text = "Loading...", 
  backgroundColor = "#FFFFFF"
}) => {
  return (
    <View style={[styles.loader, { backgroundColor }]}>
      <ActivityIndicator size={size} color={color} />
      <Text>{text}</Text>
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
