import {
  Text,
  TextInput,
  View,
  TouchableOpacity,
  Alert,
} from "react-native";
import React, { useState } from "react";
import tw from "tailwind-react-native-classnames";
import { useNavigation } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { countTripsAndStore, storeDriverDetails, updateDriverToken, validateDriver, registerDriverToken } from '../services/driverAuth';
import Loader from "../../components/Loader";

const Driver = () => {
  const [schoolID, setSchoolID] = useState("");
  const [busID, setBusID] = useState("");
  const [driverID, setDriverID] = useState("");
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // Validate driver credentials
      const isValid = await validateDriver(schoolID, busID);
      if (!isValid) {
        setLoading(false);
        return;
      }

      // Get device token for notifications
      const deviceToken = await registerDriverToken(schoolID, driverID, busID);
      await updateDriverToken(schoolID, busID, driverID, deviceToken);

      // Store driver details
      await storeDriverDetails(schoolID, busID, driverID);

      // Store basic credentials
      await AsyncStorage.setItem('schoolID', schoolID);
      await AsyncStorage.setItem('busID', busID);
      await AsyncStorage.setItem('driverID', driverID);

      // Count and store trips
      await countTripsAndStore(schoolID, busID);

      // Navigate to dashboard
      navigation.reset({
        index: 0,
        routes: [
          {
            name: "dashboards/driver",
          },
        ],
      });
    } catch (error) {
      console.error("Error in driver authentication:", error);
      Alert.alert("Error", "Failed to authenticate driver");
    } finally {
      setLoading(false);
    }
  };
  

  const disabled = schoolID.length === 0 || driverID.length === 0 || busID.length === 0;

  if (loading) {
    return <Loader text="Authenticating..."color="#FFFFFF" backgroundColor="#FCD32D" />;
  }

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