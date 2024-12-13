import {
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity,
} from "react-native";
import React, { useState } from "react";
import tw from "tailwind-react-native-classnames";
import { useNavigation } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getPickupPointsData } from '../services/driverAuth';

const Driver = () => {
  const [schoolID, setSchoolID] = useState("");
  const [busID, setBusID] = useState(null);
  const [driverID, setDriverID] = useState("");
  const [tripNumber, setTripNumber] = useState(""); // New state for trip number
  const navigation = useNavigation();

  const handleSubmit = async () => {
    try {
      // Store form data in AsyncStorage
      await AsyncStorage.setItem('schoolID', schoolID);
      await AsyncStorage.setItem('busID', busID);
      await AsyncStorage.setItem('driverID', driverID);
      await AsyncStorage.setItem('tripID', tripNumber);

      console.log("Form data stored in AsyncStorage from mapscreen");

      // Fetch pickup points data
      const pickupPoints = await getPickupPointsData();
      console.log("Fetched Pickup Points DRIVER: ", JSON.stringify(pickupPoints, null, 2));

      // Now, you can navigate or do something with the fetched data
      navigation.reset({
        index: 0,
        routes: [
          {
            name: "dashboards/driver",
          },
        ],
      });
    } catch (error) {
      console.error("Error storing data or fetching pickup points:", error);
    }
  };
  


  const disabled =
    schoolID.length === 0 || driverID.length === 0 || tripNumber.length === 0;

  return (
    <View
      style={[
        tw`flex-1 h-full justify-center items-center w-full px-7`,
        { gap: 10 },
      ]}
    >
      <Text style={tw`font-extrabold text-2xl mb-10`}>Driver Login</Text>
      <TextInput
        style={[
          tw`w-full px-2 py-3 mb-4 rounded-lg border-2 border-yellow-200`,
          { backgroundColor: "#F9F3F3" },
        ]}
        placeholder="School ID"
        value={schoolID}
        onChangeText={setSchoolID}
      />
      <TextInput
        style={[
          tw`w-full px-2 py-3 mb-4 rounded-lg border-2 border-yellow-200`,
          { backgroundColor: "#F9F3F3" },
        ]}
        placeholder="Driver ID"
        value={driverID}
        onChangeText={setDriverID}
      />
      <TextInput
        style={[
          tw`w-full px-2 py-3 mb-4 rounded-lg border-2 border-yellow-200`,
          { backgroundColor: "#F9F3F3" },
        ]}
        placeholder="Bus ID "
        value={busID}
        onChangeText={setBusID}
      />
      <TextInput
        style={[
          tw`w-full px-2 py-3 mb-4 rounded-lg border-2 border-yellow-200`,
          { backgroundColor: "#F9F3F3" },
        ]}
        placeholder="Trip ID"
        value={tripNumber}
        onChangeText={setTripNumber}
      />
      <TouchableOpacity
        style={[
          tw`py-3 px-7 rounded-xl border border-gray-400 ${disabled ? "opacity-40" : "opacity-100"
            }`,
          { backgroundColor: "#FCD32D" },
        ]}
        onPress={handleSubmit}
        disabled={disabled}
      >
        <Text style={tw`text-black text-base font-bold text-center`}>
          Login
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default Driver;

const styles = StyleSheet.create({});
