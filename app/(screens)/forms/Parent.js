import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Image, Alert, StyleSheet } from "react-native";
import tw from "tailwind-react-native-classnames";
import { useNavigation } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

import registerDeviceToken from "../services/fetchTokenAndSaveRDB";
import {
  uploadProfileImage,
  validateFields,
  updateProfilePic,
} from "../services/parentAuth.service";

const Parent = () => {
  const [schoolID, setSchoolID] = useState("");
  const [busID, setBusID] = useState("");
  const [studentID, setStudentID] = useState("");
  const [tripID, setTripID] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const navigation = useNavigation();

  const handleSubmit = async () => {
    try {
      const validationResult = await validateFields(schoolID, busID, studentID, tripID);

      if (validationResult !== true) {
        Alert.alert("Validation Failed", validationResult);
        return;
      }

      let profilePicUrl = null;
      if (selectedImage) {
        try {
          profilePicUrl = await uploadProfileImage(selectedImage, studentID, schoolID);
        } catch (error) {
          Alert.alert("Error", "Failed to upload profile image");
          return;
        }
      }


      try {
        const deviceToken = await registerDeviceToken(schoolID, studentID, busID, tripID);
        const response = await updateProfilePic(schoolID, busID, tripID, studentID, profilePicUrl, deviceToken);


        if (response) {
          await AsyncStorage.setItem('schoolID', JSON.stringify(schoolID));
          await AsyncStorage.setItem('busID', JSON.stringify(busID));
          await AsyncStorage.setItem('tripID', JSON.stringify(tripID));
          await AsyncStorage.setItem('studentID', JSON.stringify(studentID));

          const keys = await AsyncStorage.getAllKeys();
          console.log('All AsyncStorage keys:', keys);

          for (const key of keys) {
            const value = await AsyncStorage.getItem(key);
            
          }

          navigation.reset({
            index: 0,
            routes: [{ name: "dashboards/parent" }],
          });
        }
      } catch (error) {
        console.error("Error during submission:", error);
      }
    } catch (error) {
      console.error("Error in handleSubmit:", error);
    }
  };


  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permission Denied", "You need to allow access to your media library to select an image.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  return (
    <View style={[tw`flex-1 h-full justify-center items-center w-full px-7`, { gap: 10 }]}>
      <Text style={tw`font-extrabold text-2xl mb-10`}>Parent Login</Text>
      <TouchableOpacity
        onPress={pickImage}
        style={[
          tw`mb-8 justify-center items-center relative`,
          {
            width: 120,
            height: 120,
            borderRadius: 60,
            backgroundColor: "#FCD32D",
            borderWidth: 2,
            borderColor: "#dadada",
            overflow: "hidden",
          },
        ]}
      >
        {selectedImage ? (
          <Image source={{ uri: selectedImage }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
        ) : (
          <Ionicons name="camera" size={30} color="black" />
        )}
      </TouchableOpacity>
      <TextInput style={[tw`w-full px-3 py-3 mb-4 rounded-lg border-2 border-yellow-200`, { backgroundColor: "#F9F3F3" }]} placeholder="School ID" value={schoolID} onChangeText={setSchoolID} />
      <TextInput style={[tw`w-full px-3 py-3 mb-4 rounded-lg border-2 border-yellow-200`, { backgroundColor: "#F9F3F3" }]} placeholder="Bus Number" value={busID} onChangeText={setBusID} />
      <TextInput style={[tw`w-full px-3 py-3 mb-4 rounded-lg border-2 border-yellow-200`, { backgroundColor: "#F9F3F3" }]} placeholder="Trip Number" value={tripID} onChangeText={setTripID} />
      <TextInput style={[tw`w-full px-3 py-3 mb-4 rounded-lg border-2 border-yellow-200`, { backgroundColor: "#F9F3F3" }]} placeholder="Student ID" value={studentID} onChangeText={setStudentID} />
      <TouchableOpacity style={[tw`py-3 px-7 rounded-xl border border-gray-400 opacity-100`, { backgroundColor: "#FCD32D" }]} onPress={handleSubmit}>
        <Text style={tw`text-black text-base font-bold text-center`}>Login</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Parent;