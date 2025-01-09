import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, Alert } from 'react-native';
import tw from 'tailwind-react-native-classnames';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDriverContext } from "../context/driver.context";
import { getPickupPointsData } from './getPickUpPoints';

const TripSelectionComponent = ({
  tripEnabled,
  setTripEnabled,
  tripDetails,
  tripSelected,
  setTripSelected,
}) => {
  const [tripOptions, setTripOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tripType, setTripType] = useState("Pickup");
  const { tripStarted, setTripStarted } = useDriverContext();

  useEffect(() => {
    setTripEnabled(false);
  }, []);

  // Fetch trip data and update trip options
  useEffect(() => {
    const fetchTrips = async () => {
      try {
        setLoading(true);
        const noOfTrips = JSON.parse(await AsyncStorage.getItem('noOfTrips'));

        if (noOfTrips) {
          const options = Array.from({ length: noOfTrips }, (_, i) => `T00${i + 1}`);
          setTripOptions(options);

          if (options.length === 1) {
            setTripSelected(options[0]);
          }
        } else {
          console.warn("No trip details available.");
        }
      } catch (error) {
        console.error("Error fetching trip data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrips();
  }, [tripDetails, setTripSelected]);

  const handleTripStart = async () => {
    try {
      if (tripSelected) {
        // Save tripSelected and tripType to AsyncStorage
        await AsyncStorage.setItem("tripSelected", tripSelected);
        await AsyncStorage.setItem("tripType", tripType);

        const pickupPoints = await getPickupPointsData(tripSelected);
        console.log("Pickup Points for Trip:", pickupPoints);

        setTripEnabled(true);
        setTripStarted(true);

        Alert.alert("Trip Started", `Trip: ${tripSelected}\nType: ${tripType}`);
      } else {
        Alert.alert("Select a Trip", "Please select a trip before starting.");
      }
    } catch (error) {
      console.error("Error starting trip:", error);
      Alert.alert("Error", "Unable to start trip. Please try again.");
    }
  };

  if (loading) {
    return (
      <View style={tw`flex-1 justify-center items-center`}>
        <Text style={tw`text-xl`}>Loading trips...</Text>
      </View>
    );
  }

  return (
    <View style={tw`flex-1 justify-center items-center p-4`}>
      <Image
        source={require("../../../../assets/images/map.png")}
        style={tw`w-32 h-32 mb-6`}
      />
      <Text style={tw`text-2xl font-semibold mb-4`}>
        {tripEnabled ? "Trip Started" : "Select and Start Your Trip"}
      </Text>

      {tripOptions.length > 1 ? (
        <View style={tw`w-full px-4 mb-6`}>
          <Picker
            selectedValue={tripSelected}
            onValueChange={(itemValue) => setTripSelected(itemValue)}
            style={tw`bg-gray-200 rounded-lg p-2`}
          >
            <Picker.Item label="Select Trip" value="" />
            {tripOptions.map((trip) => (
              <Picker.Item key={trip} label={trip} value={trip} />
            ))}
          </Picker>
        </View>
      ) : null}

      <View style={tw`flex-row justify-center items-center mb-6`}>
        <TouchableOpacity
          style={tw`flex-row items-center mr-4`}
          onPress={() => setTripType("Pickup")}
        >
          <View
            style={[
              tw`w-5 h-5 rounded-full border-2 border-blue-500 mr-2`,
              tripType === "Pickup" ? tw`bg-blue-500` : tw`bg-white`,
            ]}
          />
          <Text style={tw`text-lg`}>Pickup</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={tw`flex-row items-center`}
          onPress={() => setTripType("Dropping")}
        >
          <View
            style={[
              tw`w-5 h-5 rounded-full border-2 border-blue-500 mr-2`,
              tripType === "Dropping" ? tw`bg-blue-500` : tw`bg-white`,
            ]}
          />
          <Text style={tw`text-lg`}>Dropping</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={handleTripStart}
        style={[tw`py-3 px-6 rounded-full`, tripSelected ? tw`bg-blue-500` : tw`bg-gray-400`]}
        disabled={!tripSelected}
      >
        <Text style={tw`text-white text-lg font-bold`}>
          {tripEnabled ? "End Trip" : "Start Trip"}
        </Text>
      </TouchableOpacity>

      <Text style={tw`text-sm text-gray-500 mt-4 text-center`}>
        {tripOptions.length > 1
          ? "Please select a trip and start to enable map features and begin tracking."
          : "A single trip is pre-selected. Start the trip to enable map features and begin tracking."}
      </Text>
    </View>
  );
};

export default TripSelectionComponent;
