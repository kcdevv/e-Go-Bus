import React from "react";
import { StyleSheet, View, ActivityIndicator, Text } from "react-native";

const Loader = ({ size = "large", color = "#FCD32D", text = "Loading.." }) => {
  return (
    <View style={styles.loader}>
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
