import { StyleSheet, Image } from "react-native";
import React from "react";
import MapView from "react-native-maps";
import { Marker } from "react-native-maps";

const MapScreen = () => {
  const locations = [
    { id: 1, title: "Charminar", latitude: 17.3616, longitude: 78.4747 },
    { id: 6, title: "TS 07 UA 1577", latitude: 18.3616, longitude: 78.4747 },
    { id: 2, title: "HITEC City", latitude: 17.4483, longitude: 78.3915 },
    { id: 3, title: "Golconda Fort", latitude: 17.3833, longitude: 78.4011 },
    {
      id: 4,
      title: "Nehru Zoological Park",
      latitude: 17.352,
      longitude: 78.4521,
    },
    { id: 5, title: "Hussain Sagar", latitude: 17.4239, longitude: 78.4738 },
  ];

  return (
    <MapView
      style={styles.map}
      initialRegion={{
        latitude: 17.385044,
        longitude: 78.486671,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      }}
    >
      {locations.map((location) => (
        <Marker
          key={location.id}
          coordinate={{
            latitude: location.latitude,
            longitude: location.longitude,
          }}
          title={location.title}
        >
          <Image
            source={require("../../../../assets/images/bus.png")}
            style={{ width: 30, height: 30 }}
          />
        </Marker>
      ))}
    </MapView>
  );
};

const styles = StyleSheet.create({
  map: {
    width: "100%",
    height: "100%",
  },
});

export default MapScreen;
