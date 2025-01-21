import { View, Text } from "react-native-web";

const PickupConfirmationOverlay = ({ onDone }) => {
  return (
    <View style={styles.overlayContainer}>
      <View style={styles.overlayContent}>
        <Text style={styles.overlayText}>
          Childrens are ready at pickup point
        </Text>
        <TouchableOpacity style={styles.doneButton} onPress={onDone}>
          <Text style={styles.doneButtonText}>Arrived</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlayContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2000,
  },
  overlayContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  overlayText: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: "center",
  },
  doneButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 5,
  },
  doneButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default PickupConfirmationOverlay;
