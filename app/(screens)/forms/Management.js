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

const Management = () => {
  const [schoolID, setSchoolID] = useState("");
  const [password, setPassword] = useState("");
  const navigation = useNavigation();

  const handleSubmit = async () => {
    try {

      // authenticate the school

      // Store schoolID in AsyncStorage
      await AsyncStorage.setItem("schoolID", schoolID);

      // Navigate to the dashboard
      navigation.reset({
        index: 0,
        routes: [{ name: "dashboards/management" }],
      });
    } catch (error) {
      console.error("Error saving school ID:", error);
    }
  };

  const disabled = schoolID.length === 0 || password.length === 0;

  return (
    <View
      style={[
        tw`flex-1 h-full justify-center items-center w-full px-7`,
        { gap: 10 },
      ]}
    >
      <Text style={tw`font-extrabold text-2xl mb-10`}>Management Login</Text>
      <TextInput
        style={[
          tw`w-full px-3 py-3 mb-4 rounded-lg border-2 border-yellow-200`,
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
        placeholder="Password"
        value={password}
        secureTextEntry // Ensures password input is hidden
        onChangeText={setPassword}
      />
      <TouchableOpacity
        style={[
          tw`py-3 px-7 rounded-xl border border-gray-400 ${
            disabled ? "opacity-40" : "opacity-100"
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

export default Management;

const styles = StyleSheet.create({});
