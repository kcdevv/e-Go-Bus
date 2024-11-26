import {
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import React, { useState } from 'react';
import tw from 'tailwind-react-native-classnames';
import { useNavigation } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

const Parent = () => {
  const [schoolID, setSchoolID] = useState('');
  const [busID, setBusID] = useState('');
  const [studentID, setStudentID] = useState('');
  const [trip, setTrip] = useState('');
  const [selectedImage, setSelectedImage] = useState(
    'https://via.placeholder.com/120.png?text=Profile' // Default image URL
  );
  const navigation = useNavigation();

  const handleSubmit = () => {
    console.log('School ID:', schoolID);
    console.log('Bus ID:', busID);
    console.log('Student ID:', studentID);
    console.log('Selected Image URI:', selectedImage);
    navigation.reset({
      index: 0,
      routes: [{ name: 'dashboards/parent' }],
    });
  };

  const disabled =
    schoolID.length === 0 || busID.length === 0 || studentID.length === 0 || !selectedImage;

  const pickImage = async () => {
    // Request media library permissions
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert(
        'Permission Denied',
        'You need to allow access to your media library to select an image.'
      );
      return;
    }

    // Open the image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1], // Crop the image to a square
      quality: 1, // High-quality images
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri); // Save the selected image URI
    }
  };

  return (
    <View style={[tw`flex-1 h-full justify-center items-center w-full px-7`, { gap: 10 }]}>
      <Text style={tw`font-extrabold text-2xl mb-10`}>Parent Login</Text>

      {/* Circular Image Picker with Text */}
      <TouchableOpacity
        onPress={pickImage}
        style={[
          tw`mb-8 justify-center items-center relative`,
          {
            width: 120,
            height: 120,
            borderRadius: 60,
            backgroundColor: '#F9F3F3',
            borderWidth: 2,
            borderColor: '#FCD32D',
            overflow: 'hidden',
          },
        ]}
      >
        <Image
          source={{ uri: selectedImage }}
          style={[{ width: '100%', height: '100%' }]}
        />
        <View
          style={[
            tw`absolute top-0 left-0 right-0 bottom-0 justify-center items-center`,
            { backgroundColor: 'rgba(0, 0, 0, 0.1)' },
          ]}
        >
        </View>
      </TouchableOpacity>

      <TextInput
        style={[
          tw`w-full px-3 py-3 mb-4 rounded-lg border-2 border-yellow-200`,
          { backgroundColor: '#F9F3F3' },
        ]}
        placeholder="School ID"
        value={schoolID}
        onChangeText={setSchoolID}
      />
      <TextInput
        style={[
          tw`w-full px-3 py-3 mb-4 rounded-lg border-2 border-yellow-200`,
          { backgroundColor: '#F9F3F3' },
        ]}
        placeholder="Student ID"
        value={studentID}
        onChangeText={setStudentID}
      />
      <TextInput
        style={[
          tw`w-full px-3 py-3 mb-4 rounded-lg border-2 border-yellow-200`,
          { backgroundColor: '#F9F3F3' },
        ]}
        placeholder="Trip Number"
        value={trip}
        onChangeText={setTrip}
      />
      <TextInput
        style={[
          tw`w-full px-3 py-3 mb-4 rounded-lg border-2 border-yellow-200`,
          { backgroundColor: '#F9F3F3' },
        ]}
        placeholder="Bus ID"
        value={busID}
        onChangeText={setBusID}
      />
      
      <TouchableOpacity
        style={[
          tw`py-3 px-7 rounded-xl border border-gray-400 ${disabled ? 'opacity-40' : 'opacity-100'}`,
          { backgroundColor: '#FCD32D' },
        ]}
        onPress={handleSubmit}
        disabled={disabled}
      >
        <Text style={tw`text-black text-base font-bold text-center`}>Login</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Parent;

const styles = StyleSheet.create({});
