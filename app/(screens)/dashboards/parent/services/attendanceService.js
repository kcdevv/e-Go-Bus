import { ref as dbRef, get, set, update } from 'firebase/database';
import { database } from '../../../../../firebase.config'; // Adjust the path as needed

// Function to update student attendance status
export const updateAttendanceStatus = async (schoolID, busID, tripID, studentID, status) => {
  const db = database;
  const studentRef = dbRef(db, `schools/${schoolID}/buses/${busID}/trips/${tripID}/students/${studentID}`);

  try {
    await update(studentRef, {
      present: status,
    });

    console.log("Attendance status updated:", status);
  } catch (error) {
    console.error("Error updating attendance status:", error);
    throw new Error('Error updating attendance status');
  }
};


// this should be in the driver services
// Function to reset attendance for all students when the driver ends the trip
// export const resetAttendanceStatus = async (schoolID, busID, tripID) => {
//   const db = database;
//   const tripRef = dbRef(db, `schools/${schoolID}/buses/${busID}/trips/${tripID}/students`);

//   try {
//     const snapshot = await get(tripRef);

//     if (snapshot.exists()) {
//       const students = snapshot.val();
//       for (let studentID in students) {
//         await set(dbRef(db, `schools/${schoolID}/buses/${busID}/trips/${tripID}/students/${studentID}`), {
//           present: true, // Set to present for the next day
//         });
//       }
//     } else {
//       console.log('No students found for this trip.');
//     }
//   } catch (error) {
//     console.error("Error resetting attendance:", error);
//     throw new Error('Error resetting attendance');
//   }
// };

// Fetch attendance status for a student
export const fetchStudentAttendance = async (schoolID, busID, tripID, studentID) => {
  const db = database;
  const attendanceRef = dbRef(db, `schools/${schoolID}/buses/${busID}/trips/${tripID}/students/${studentID}`);

  try {
    const snapshot = await get(attendanceRef);

    if (snapshot.exists()) {
      return snapshot.val()?.present;
    } else {
      return null; // No data for this student
    }
  } catch (error) {
    console.error("Error fetching attendance status:", error);
    throw new Error('Error fetching attendance status');
  }
};
