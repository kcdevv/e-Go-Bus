import { database } from "../../../../../firebase.config";
import { ref as dbRef, get } from "firebase/database";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getPickupPointsData } from "./getPickUpPoints";

const notificationsSchemaData = async (tripID) => {
    try {
      const schoolID = await AsyncStorage.getItem("schoolID");
      const busID = await AsyncStorage.getItem("busID");
  
      if (!schoolID || !busID || !tripID) {
        throw new Error("Missing schoolID, busID, or tripID in AsyncStorage");
      }
  
      // Fetch pickup points using getPickupPointsData
      const pickupPoints = await getPickupPointsData(tripID);
      if (!pickupPoints || Object.keys(pickupPoints).length === 0) {
        throw new Error("No pickup points found for this trip");
      }
      const schemaData = [];
  
      // Iterate over each pickup point
      for (const [pointKey, pickupPoint] of Object.entries(pickupPoints)) {
        const studentsRef = dbRef(
          database,
          `schools/${schoolID}/buses/${busID}/trips/${tripID}/pickupPoints/${pointKey}/students`
        );
        const studentsSnapshot = await get(studentsRef);
  
        const students = [];
  
        if (studentsSnapshot.exists()) {
          const studentDataArray = studentsSnapshot.val(); // This is an array of student objects
  
          // console.log("All students under this pickup point:", studentDataArray);
  
          // Fetch student data for each student ID
          for (const student of studentDataArray) {
            const studentDetails = await fetchStudentData(
              schoolID,
              student.studentID,  // Use student.studentID here
              busID,
              tripID
            );
  
            if (studentDetails) {
              students.push({
                ...studentDetails,
                studentID: student.studentID,  // Add studentID to the details
              });
            }
          }
        }
  
        // Push data into schema array
        schemaData.push({
          pickupPointID: pointKey,
          pickupLocation: pickupPoint.pickupLocation || "unknown",
          pickupTime: pickupPoint.pickupTime || "unknown",
          token: pickupPoint.token || [],
          students,
        });
      }
  
      // Log and return final schema data
    //   console.log(
    //     "Notification Schema Data:",
    //     JSON.stringify(schemaData, null, 2)
    //   );
      return schemaData;
    } catch (error) {
      console.error(
        "Error generating notifications schema data:",
        error.message || error
      );
      throw error;
    }
  };
  
  // Helper function to fetch student data by ID
  const fetchStudentData = async (schoolID, studentID, busID, tripID) => {
    try {
      const studentRef = dbRef(
        database,
        `schools/${schoolID}/buses/${busID}/trips/${tripID}/students/${studentID}`
      );
      const studentSnapshot = await get(studentRef);
  
      if (!studentSnapshot.exists()) {
        console.warn("Student data not found for ID:", studentID);
        return null; // Return null if the student data is missing
      }
  
      return studentSnapshot.val(); // Return the full student snapshot
    } catch (error) {
      console.error("Error fetching student data:", error);
      throw error;
    }
  };

  export { notificationsSchemaData };