import { initializeApp, getApps } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import firebaseConfig from "../../../firebase.config";

let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
}

const db = getFirestore(app);

/**
 * Authenticates the user by checking the school ID and password.
 * @param {string} schoolID - The school ID entered by the user.
 * @param {string} password - The password entered by the user.
 * @returns {Promise<string|null>} - Returns the school ID if authentication is successful, or null if it fails.
 */
export const login = async (schoolID, password) => {
  if (!schoolID || !password) {
    throw new Error("Please enter both School ID and Password.");
  }

  const schoolPath = doc(
    db,
    "admin",
    "MmwTJpDWtFzHxd7zj2Vv",
    "schoolsRegistered",
    schoolID
  );
  
  const schoolSnapshot = await getDoc(schoolPath);

  if (!schoolSnapshot.exists()) {
    throw new Error("The School ID you entered does not exist.");
  }

  const schoolData = schoolSnapshot.data();
  const storedPassword = schoolData.password;

  if (!storedPassword) {
    throw new Error("Password not found for this school.");
  }

  if (storedPassword !== password) {
    throw new Error("Invalid School ID or Password.");
  }

  return schoolID;
};
