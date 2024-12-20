import React, { useState } from "react";
import { StyleSheet, Text, TextInput, View, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import tw from "tailwind-react-native-classnames";
import { useNavigation } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import firebaseConfig from "../../../firebase.config";

// **Initialize Firebase if not already initialized**
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
}

const db = getFirestore(app);

const Management = () => {
  const [schoolID, setSchoolID] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false); 
  const navigation = useNavigation();

  const handleSubmit = async () => {
    if (!schoolID || !password) {
      Alert.alert("Validation Error", "Please enter both School ID and Password.");
      return;
    }

    setIsLoading(true); 

    try {
      // **Step 1: Get the School Data (includes password)**
      const schoolPath = doc(db, "admin", "MmwTJpDWtFzHxd7zj2Vv", "schoolsRegistered", schoolID);
      const schoolSnapshot = await getDoc(schoolPath);

      if (!schoolSnapshot.exists()) {
        Alert.alert("School Not Found", "The School ID you entered does not exist.");
        setIsLoading(false);
        return;
      }

      // **Step 2: Extract the password from the document**
      const schoolData = schoolSnapshot.data();
      const storedPassword = schoolData.password; // ✅ Access password directly as a field

      if (!storedPassword) {
        Alert.alert("Authentication Failed", "Password not found for this school.");
        setIsLoading(false);
        return;
      }

      // **Step 3: Check if the input password matches the stored password**
      if (storedPassword === password) {
        await AsyncStorage.setItem("schoolID", schoolID); // Store schoolID in local storage
        navigation.reset({ index: 0, routes: [{ name: "dashboards/management" }] });
      } else {
        Alert.alert("Authentication Failed", "Invalid School ID or Password.");
      }
    } catch (error) {
      console.error("Error during authentication:", error);
      Alert.alert("Error", "An error occurred while logging in. Please try again later.");
    } finally {
      setIsLoading(false); 
    }
  };

  const disabled = schoolID.length === 0 || password.length === 0;

  return (
    <View style={[tw`flex-1 h-full justify-center items-center w-full px-7`, { gap: 10 }]}>
      <Text style={tw`font-extrabold text-2xl mb-10`}>Management Login</Text>

      <TextInput
        style={[tw`w-full px-3 py-3 mb-4 rounded-lg border-2 border-yellow-200`, { backgroundColor: "#F9F3F3" }]}
        placeholder="School ID"
        value={schoolID}
        onChangeText={setSchoolID}
      />

      <TextInput
        style={[tw`w-full px-2 py-3 mb-4 rounded-lg border-2 border-yellow-200`, { backgroundColor: "#F9F3F3" }]}
        placeholder="Password"
        value={password}
        secureTextEntry 
        onChangeText={setPassword}
      />

      <TouchableOpacity
        style={[tw`py-3 px-7 rounded-xl border border-gray-400 ${disabled ? "opacity-40" : "opacity-100"}`, { backgroundColor: "#FCD32D" }]}
        onPress={handleSubmit}
        disabled={disabled || isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#000" />
        ) : (
          <Text style={tw`text-black text-base font-bold text-center`}>Login</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default Management;

const styles = StyleSheet.create({});
