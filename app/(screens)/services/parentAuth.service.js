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
export const updateProfilePic = async (schoolID, busID, tripID, studentID, profilePicUrl, deviceToken='sfafafaaf') => {
  const db = database;
  const studentRef = dbRef(db, `schools/${schoolID}/buses/${busID}/trips/${tripID}/students/${studentID}`);
  const tripTokensRef = dbRef(db, `schools/${schoolID}/buses/${busID}/trips/${tripID}/tokens`);

  try {
    // Ensure the student path exists; if not, create it
    const studentSnapshot = await get(studentRef);
    if (!studentSnapshot.exists()) {
      await set(studentRef, {
        profilePic: '',
        token: '', // Initialize with default values
      });
    }

    // Update student data
    await update(studentRef, {
      profilePic: profilePicUrl,
      token: deviceToken,
    });

    

    // Push the token to the tokens array under the trip
    await push(tripTokensRef, deviceToken);

    // Fetch additional data
    const schoolSnapshot = await get(dbRef(db, `schools/${schoolID}`));
    const busSnapshot = await get(dbRef(db, `schools/${schoolID}/buses/${busID}`));
    const studentSnapshotAfterUpdate = await get(studentRef);

    const schoolName = schoolSnapshot.val()?.name;
    const driverDetails = busSnapshot.val()?.driver;
    const studentDetails = studentSnapshotAfterUpdate.val();

    const responseData = {
      schoolName,
      driverDetails,
      studentDetails,
    };

    Alert.alert('Profile Updated', 'Profile picture has been updated successfully');
    return responseData;
  } catch (error) {
    console.error('Error updating profile:', error);
    Alert.alert('Error', 'Failed to update profile');
    throw error;
  }
};
