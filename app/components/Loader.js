import React from "react";
import { StyleSheet, View, ActivityIndicator } from "react-native";

const Loader = ({ size = "large", color = "#FCD32D" }) => {
  return (
    <View style={styles.loader}>
      <ActivityIndicator size={size} color={color} />
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
