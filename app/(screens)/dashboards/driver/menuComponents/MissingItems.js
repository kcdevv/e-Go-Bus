import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Image, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons"; 
import * as ImagePicker from "expo-image-picker";
import tw from "tailwind-react-native-classnames";
import {useRouter} from 'expo-router'
import { FontAwesome } from "@expo/vector-icons";

const MissingItems = () => {
  const [title, setTitle] = useState("Lost Item Found");
  const [message, setMessage] = useState(
    "A missing item was found on the bus. Please check and respond."
  );
  const [photo, setPhoto] = useState(null);

  const router = useRouter();

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

  const uploadMissingItem = () => {
    if (!title.trim() || !photo) {
      Alert.alert(
        "Incomplete Details",
        `Please provide ${!title.trim() ? "a title" : ""} ${
          !title.trim() && !photo ? "and" : ""
        } ${!photo ? "a photo" : ""} for the missing item.`
      );
      return;
    }

    Alert.alert(
      "Item Uploaded",
      `The item "${title}" has been successfully uploaded with your message.`
    );

    setTitle("Lost Item Found");
    setMessage("A missing item was found on the bus. Please check and respond.");
    setPhoto(null);
  };

  return (
    <View style={tw`flex-1 bg-white`}>
      {/* Header */}
      <View
        style={[tw`py-4 px-4 flex-row items-center`, { backgroundColor: "#FCD32D" }]}
      >
        <TouchableOpacity onPress={() => { router.back() }}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={tw`text-xl font-bold text-black ml-2`}>Report Missing Item</Text>
      </View>

      {/* Content */}
      <View style={tw`flex-1 p-5`}>
        {/* Title */}
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
            <View
              style={tw`w-full h-48 border border-dashed border-gray-300 rounded-lg items-center justify-center`}
            >
              <FontAwesome name="photo" size={50} color="#ccc" />
              <Text style={tw`mt-2 text-gray-500`}>Tap to upload photo</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Upload Button */}
        <TouchableOpacity
          style={[tw`p-3 mt-4 rounded-lg items-center`, { backgroundColor: "#FCD32D" }]}
          onPress={openImagePickerOptions}
        >
          <Text style={tw`text-black font-bold`}>Upload Photo</Text>
        </TouchableOpacity>
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={tw`bg-black p-3 rounded-lg items-center shadow-md m-5`}
        onPress={uploadMissingItem}
      >
        <Text style={tw`text-white font-bold text-lg`}>Report Item</Text>
      </TouchableOpacity>
    </View>
  );
};

export default MissingItems;
