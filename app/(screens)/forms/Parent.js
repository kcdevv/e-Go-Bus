import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, Alert, StyleSheet } from 'react-native';
import tw from 'tailwind-react-native-classnames';
import { useNavigation } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { uploadProfileImage, validateFields, updateProfilePic } from '../services/parentAuth.service'; // Import the service

const Parent = () => {
  const [schoolID, setSchoolID] = useState('');
  const [busID, setBusID] = useState('');
  const [studentID, setStudentID] = useState('');
  const [trip, setTrip] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);  // Initially no image selected
  const navigation = useNavigation();

  const handleSubmit = async () => {
    // Validate the fields first
    const validationResult = await validateFields(schoolID, busID, studentID, trip);

    if (validationResult !== true) {
      Alert.alert('Validation Failed', validationResult);
      return;
    }

    // Upload the profile image if it is selected
    let profilePicUrl = selectedImage;
    if (selectedImage) {
      try {
        profilePicUrl = await uploadProfileImage(selectedImage, studentID, schoolID);
      } catch (error) {
        Alert.alert('Error', 'Failed to upload profile image');
        return;
      }
    }

    // Update the profilePic field in Firebase Database
    await updateProfilePic(schoolID, busID, trip, studentID, profilePicUrl);

    // Proceed with the rest of the form submission (you can also store other info if needed)

    // Navigate to the next screen
    navigation.reset({
      index: 0,
      routes: [{ name: 'dashboards/parent' }],
    });
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission Denied', 'You need to allow access to your media library to select an image.');
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

      {/* Circular Image Picker with Camera Icon */}
      <TouchableOpacity
        onPress={pickImage} // Image or camera click to pick a new one
        style={[tw`mb-8 justify-center items-center relative`, {
          width: 120,
          height: 120,
          borderRadius: 60,
          backgroundColor: '#FCD32D',
          borderWidth: 2,
          borderColor: '#dadada',
          overflow: 'hidden',
        }]}
      >
        {selectedImage ? (
          <Image
            source={{ uri: selectedImage }} // Display selected image
            style={[{ width: '100%', height: '100%' }]}
            resizeMode="cover" // Ensures the image fits perfectly in the circle
          />
        ) : (
          <Ionicons name="camera" size={30} color="black" /> // Show camera icon if no image selected
        )}
      </TouchableOpacity>

      {/* Input Fields */}
      <TextInput style={[tw`w-full px-3 py-3 mb-4 rounded-lg border-2 border-yellow-200`, { backgroundColor: '#F9F3F3' }]} placeholder="School ID" value={schoolID} onChangeText={setSchoolID} />
      <TextInput style={[tw`w-full px-3 py-3 mb-4 rounded-lg border-2 border-yellow-200`, { backgroundColor: '#F9F3F3' }]} placeholder="Bus Number" value={busID} onChangeText={setBusID} />
      <TextInput style={[tw`w-full px-3 py-3 mb-4 rounded-lg border-2 border-yellow-200`, { backgroundColor: '#F9F3F3' }]} placeholder="Trip Number" value={trip} onChangeText={setTrip} />
      <TextInput style={[tw`w-full px-3 py-3 mb-4 rounded-lg border-2 border-yellow-200`, { backgroundColor: '#F9F3F3' }]} placeholder="Student ID" value={studentID} onChangeText={setStudentID} />

      {/* Submit Button */}
      <TouchableOpacity style={[tw`py-3 px-7 rounded-xl border border-gray-400 opacity-100`, { backgroundColor: '#FCD32D' }]} onPress={handleSubmit}>
        <Text style={tw`text-black text-base font-bold text-center`}>Login</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Parent;

const styles = StyleSheet.create({});
