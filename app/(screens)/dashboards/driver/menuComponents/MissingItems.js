import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Image, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { getDownloadURL, ref as storageRef, uploadBytes } from "firebase/storage";
import { push, ref, get, set } from "firebase/database";
import { storage, database } from "../../../../../firebase.config";
import tw from "tailwind-react-native-classnames";
import { useRouter } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage'; // Import AsyncStorage

// Function to get details from AsyncStorage
const getDetails = async () => {
  try {
    const schoolID = await AsyncStorage.getItem('schoolID');
    const busID = await AsyncStorage.getItem('busID');

    if (!schoolID || !busID) {
      throw new Error('Missing data in AsyncStorage');
    }

    return { schoolID, busID };
  } catch (error) {
    Alert.alert("Error fetching data from AsyncStorage", error.message);
    return null;
  }
};

const MissingItems = () => {
  const [title, setTitle] = useState("Lost Item Found");
  const [message, setMessage] = useState("A missing item was found on the bus. Please check and respond.");
  const [photo, setPhoto] = useState(null);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  // Function to pick image from gallery
  const pickImageFromLibrary = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setPhoto(result.assets[0].uri);
    }
  };

  // Function to capture image using the camera
  const captureImageWithCamera = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert("Permission Denied", "You need to enable camera permissions to use this feature.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setPhoto(result.assets[0].uri);
    }
  };

  // Function to open options for uploading images
  const openImagePickerOptions = () => {
    Alert.alert(
      "Upload Photo",
      "Choose an option:",
      [
        { text: "Gallery", onPress: pickImageFromLibrary },
        { text: "Camera", onPress: captureImageWithCamera },
        { text: "Cancel", style: "cancel" },
      ],
      { cancelable: true }
    );
  };

  const uploadMissingItem = async () => {
    if (!title.trim() || !photo) {
      Alert.alert(
        "Incomplete Details",
        `Please provide ${!title.trim() ? "a title" : ""} ${
          !title.trim() && !photo ? "and" : ""
        } ${!photo ? "a photo" : ""} for the missing item.`
      );
      return;
    }
  
    try {
      setUploading(true);
  
      // Get details from AsyncStorage
      const details = await getDetails();
      if (!details) return;
  
      const { schoolID, busID } = details;
  
      // Upload photo to Firebase Storage
      const imageRef = storageRef(storage, `missingItems/${Date.now()}.jpg`);
      const response = await fetch(photo);
      const blob = await response.blob();
      await uploadBytes(imageRef, blob);
  
      // Get the uploaded image's URL
      const photoURL = await getDownloadURL(imageRef);
  
      // Prepare the missing item data
      const newItem = {
        title,
        message,
        image: photoURL,
        date: new Date().toISOString(),
      };
  
      // Construct the dynamic path
      const path = `schools/${schoolID}/buses/${busID}/missingItemNotification`;
  
      // Get the current data to check the last uploaded number (if any)
      const snapshot = await get(ref(database, path));
      const currentData = snapshot.val();
  
      // Calculate the next number (based on existing data)
      const itemCount = currentData ? Object.keys(currentData).length + 1 : 1;
  
      // Create a new item with the incremented number as the key
      await push(ref(database, path), {
        ...newItem,
        number: itemCount, // Add a "number" field for the unique number
      });
  
      // Increment the missingItemsCount manually
      const schoolCountRef = ref(database, `schools/${schoolID}/missingItemsCount`);
      const countSnapshot = await get(schoolCountRef);
      const currentCount = countSnapshot.val() || 0;
  
      // Update the count
      await set(schoolCountRef, currentCount + 1);
  
      Alert.alert("Item Uploaded", `The item "${title}" has been successfully uploaded.`);
  
      // Reset the form
      setTitle("Lost Item Found");
      setMessage("A missing item was found on the bus. Please check and respond.");
      setPhoto(null);
    } catch (error) {
      console.error("Error uploading item:", error);
      Alert.alert("Upload Failed", "There was an error uploading the item. Please try again.");
    } finally {
      setUploading(false);
    }
  };
  


  return (
    <View style={tw`flex-1 bg-white`}>
      {/* Header */}
      <View style={[tw`pb-2 px-4 flex-row items-center pt-9`, { height: 75, backgroundColor: "#FCD32D" }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={tw`text-xl font-bold text-black ml-2`}>Report Missing Item</Text>
      </View>

      {/* Content */}
      <View style={tw`flex-1 p-5`}>
        {/* Title Input */}
        <Text style={tw`text-lg font-bold mb-2`}>Title:</Text>
        <TextInput
          style={tw`border border-gray-300 rounded-lg p-3 mb-4`}
          placeholder="Enter the title of the missing item"
          value={title}
          onChangeText={setTitle}
        />

        {/* Default Message */}
        <Text style={tw`text-lg font-bold mb-2`}>Message:</Text>
        <TextInput
          style={tw`border border-gray-300 rounded-lg p-3 mb-4`}
          placeholder="Write your custom message (optional)"
          value={message}
          onChangeText={setMessage}
          multiline
        />

        {/* Upload Photo */}
        <Text style={tw`text-lg font-bold mb-2`}>Photo:</Text>
        <TouchableOpacity onPress={openImagePickerOptions}>
          {photo ? (
            <Image source={{ uri: photo }} style={tw`w-full h-48 rounded-lg mb-4`} />
          ) : (
            <View style={tw`w-full h-48 border border-dashed border-gray-300 rounded-lg items-center justify-center`}>
              <FontAwesome name="photo" size={50} color="#ccc" />
              <Text style={tw`mt-2 text-gray-500`}>Tap to upload photo</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Upload Button */}
        <TouchableOpacity
          style={[tw`p-3 mt-4 rounded-lg items-center`, { backgroundColor: "#FCD32D" }]}
          onPress={uploadMissingItem}
          disabled={uploading}
        >
          <Text style={tw`text-black font-bold`}>{uploading ? "Uploading..." : "Upload Item"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default MissingItems;