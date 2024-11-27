import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getDatabase, ref as dbRef, get, update } from 'firebase/database';
import { Alert } from 'react-native';
import { storage, database } from '../../../firebase.config'; // Import the initialized Firebase app

// Function to upload image to Firebase Storage and get the URL
export const uploadProfileImage = async (uri, studentID, schoolID) => {
  const response = await fetch(uri);
  const blob = await response.blob();

  // Create a reference to the Firebase Storage location
  const imageRef = ref(storage, `${schoolID}/profileImages/${studentID}.jpg`);

  try {
    // Upload the image
    await uploadBytes(imageRef, blob);

    // Get the download URL
    const imageUrl = await getDownloadURL(imageRef);

    return imageUrl; // Return the image URL
  } catch (error) {
    console.error("Error uploading image:", error);
    throw new Error("Error uploading image");
  }
};

// Function to validate the data against Firebase Realtime Database
export const validateFields = async (schoolID, busID, studentID, tripID) => {
  const db = getDatabase();

  try {
    // Get references to the required data in the database
    const schoolRef = dbRef(db, `schools/${schoolID}`);
    const busRef = dbRef(db, `schools/${schoolID}/buses/${busID}`);
    const studentRef = dbRef(db, `schools/${schoolID}/buses/${busID}/trips/${tripID}/students/${studentID}`);
    const tripRef = dbRef(db, `schools/${schoolID}/buses/${busID}/trips/${tripID}`);

    // Fetch data for each reference
    const schoolSnapshot = await get(schoolRef);
    const busSnapshot = await get(busRef);
    const studentSnapshot = await get(studentRef);
    const tripSnapshot = await get(tripRef);

    // Check if data exists
    if (!schoolSnapshot.exists()) {
      return "School ID does not exist";
    }
    if (!busSnapshot.exists()) {
      return "Bus ID does not exist";
    }
    if (!studentSnapshot.exists()) {
      return "Student ID does not exist";
    }
    if (!tripSnapshot.exists()) {
      return "Trip ID does not exist";
    }

    // Return true if all fields are valid
    return true;
  } catch (error) {
    console.error("Error validating data:", error);
    throw new Error("Error validating data");
  }
};

// Function to update the profilePic URL in Firebase Realtime Database
export const updateProfilePic = async (schoolID, busID, tripID, studentID, profilePicUrl) => {
  const db = getDatabase();

  // Reference to the student's data
  const studentRef = dbRef(db, `schools/${schoolID}/buses/${busID}/trips/${tripID}/students/${studentID}`);

  try {
    // Update the profilePic field with the new image URL
    await update(studentRef, {
      profilePic: profilePicUrl,
    });

    Alert.alert("Profile Updated", "Profile picture has been updated successfully");
  } catch (error) {
    console.error("Error updating profilePic:", error);
    Alert.alert("Error", "Failed to update profile picture");
  }
};
