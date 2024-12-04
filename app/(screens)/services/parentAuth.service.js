import AsyncStorage from '@react-native-async-storage/async-storage';
import { storage, database } from '../../../firebase.config';  // Adjust the path as needed
import { ref as dbRef, get, update, push, set } from 'firebase/database';  // Import `set` to create data if needed
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Alert } from 'react-native';


// Upload profile image to Firebase Storage
export const uploadProfileImage = async (uri, studentID, schoolID) => {
  const response = await fetch(uri);
  const blob = await response.blob();
  const imageRef = ref(storage, `${schoolID}/profileImages/${studentID}.jpg`);

  try {
    await uploadBytes(imageRef, blob);
    const imageUrl = await getDownloadURL(imageRef);
    return imageUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw new Error('Error uploading image');
  }
};

// Validate fields against Firebase Database
export const validateFields = async (schoolID, busID, studentID, tripID) => {
  const db = database;
  try {
    const schoolSnapshot = await get(dbRef(db, `schools/${schoolID}`));
    const busSnapshot = await get(dbRef(db, `schools/${schoolID}/buses/${busID}`));
    const tripSnapshot = await get(dbRef(db, `schools/${schoolID}/buses/${busID}/trips/${tripID}`));
    const studentSnapshot = await get(
      dbRef(db, `schools/${schoolID}/buses/${busID}/trips/${tripID}/students/${studentID}`)
    );

    if (!schoolSnapshot.exists()) return 'School ID does not exist';
    if (!busSnapshot.exists()) return 'Bus ID does not exist';
    if (!tripSnapshot.exists()) return 'Trip ID does not exist';
    if (!studentSnapshot.exists()) return 'Student ID does not exist';


    return true;
  } catch (error) {
    console.error('Error validating data:', error);
    throw new Error('Error validating data');
  }
};

// Update profile picture and device token in Firebase
export const updateProfilePic = async (schoolID, busID, tripID, studentID, profilePicUrl, deviceToken) => {
  const db = database;
  const studentRef = dbRef(db, `schools/${schoolID}/buses/${busID}/trips/${tripID}/students/${studentID}`);
  const tripTokensRef = dbRef(db, `schools/${schoolID}/buses/${busID}/trips/${tripID}/tokens`);

  try {
    // Fetch existing student data
    const studentSnapshot = await get(studentRef);
    if (!studentSnapshot.exists()) {
      await set(studentRef, {
        profilePic: profilePicUrl || "",
        token: deviceToken || "",
      });
    } else {
      // Update only provided fields
      await update(studentRef, {
        ...(profilePicUrl && { profilePic: profilePicUrl }),
        ...(deviceToken && { token: deviceToken }),
      });
    }

    // Push the token to the tokens array under the trip if it's valid
    if (deviceToken) {
      await push(tripTokensRef, deviceToken);
    }
    
    // Fetch additional data
    const schoolSnapshot = await get(dbRef(db, `schools/${schoolID}`));
    const busSnapshot = await get(dbRef(db, `schools/${schoolID}/buses/${busID}`));
    const studentSnapshotAfterUpdate = await get(studentRef);
    
    const schoolName = schoolSnapshot.val()?.schoolName;
    const driverDetails = busSnapshot.val();
    const { trips, ...filteredDriverDetails } = driverDetails || {};
    const studentDetails = studentSnapshotAfterUpdate.val();
    
    const responseData = {
      schoolName,
      filteredDriverDetails,
      studentDetails,
    };
    console.log('Saving student details:', studentDetails);
    await AsyncStorage.setItem('driverDetails', JSON.stringify(filteredDriverDetails));
    await AsyncStorage.setItem('schoolName', JSON.stringify(schoolName.replace(/"/g, "")));
    await AsyncStorage.setItem('studentDetails', JSON.stringify(studentDetails));
    Alert.alert("Login Successfull", "Welcome to e-GO Bus! we are ready to serve you.");
    return responseData;
  } catch (error) {
    console.error("Error updating profile:", error);
    Alert.alert("Error", "Failed to update profile");
    throw error;
  }
};

