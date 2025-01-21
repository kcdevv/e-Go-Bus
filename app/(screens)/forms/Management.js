import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity,
  Alert,
} from "react-native";
import tw from "tailwind-react-native-classnames";
import { useNavigation } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Loader from "../../components/Loader";

// **Import the login function from authService**
import { login } from "../services/managementAuth";

const Management = () => {
  const [schoolID, setSchoolID] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation();

  /**
   * Handles the submission of the login form.
   */
  const handleSubmit = async () => {
    try {
      if (!schoolID || !password) {
        Alert.alert("Validation Error", "Please enter both School ID and Password.");
        return;
      }

      setIsLoading(true);

      // Call the login function from authService
      const authenticatedSchoolID = await login(schoolID, password);
      
      // If successful, store the schoolID locally and navigate to the dashboard
      await AsyncStorage.setItem("schoolID", authenticatedSchoolID);
      navigation.reset({ index: 0, routes: [{ name: "dashboards/management" }] });

    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const disabled = schoolID.length === 0 || password.length === 0;

  if (isLoading) {
    return <Loader text="Authenticating..." color="#FFFFFF" backgroundColor="#FCD32D" />;
  }

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
        secureTextEntry
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
        disabled={disabled || isLoading}
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