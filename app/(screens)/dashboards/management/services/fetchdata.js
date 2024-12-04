// services/firebaseService.js
import { ref, get } from "firebase/database";
import { database } from "../../../../../firebase.config";

// Function to fetch buses for a specific school
export const fetchSchoolBuses = async (schoolID) => {
    const sanitizedSchoolID = schoolID.replace(/['"]/g, "").trim();
    console.log("Sanitized School ID:", sanitizedSchoolID);

    const db = database;
    const schoolRef = ref(db, `schools/${sanitizedSchoolID}/buses`);

    try {
        const snapshot = await get(schoolRef);
        if (snapshot.exists()) {
            // console.log("Buses data:", snapshot.val());
            return snapshot.val();
        } else {
            console.log(`No buses found for schoolID: ${sanitizedSchoolID}`);
            return {}; // Return an empty object instead of null
        }

    } catch (error) {
        console.error("Error fetching school buses:", error);
        throw error;
    }
};

