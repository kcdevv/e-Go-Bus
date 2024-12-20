import { ref as dbRef, get, set, update } from 'firebase/database';
import { database } from '../../../../../firebase.config'; // Adjust the path as needed

// Function to update student attendance status
// Function to update student attendance status
export const updateAttendanceStatus = async (schoolID, busID, tripID, studentID, status) => {
  const db = database;
  const tripRef = dbRef(db, `schools/${schoolID}/buses/${busID}/trips/${tripID}/pickupPoints`);

  try {
    // Retrieve pickupPoints to find the matching studentID
    const snapshot = await get(tripRef);
    if (snapshot.exists()) {
      const pickupPoints = snapshot.val();

      // Find the pickup point and student
      for (const [pickupPointID, data] of Object.entries(pickupPoints)) {
        if (data?.students) {
          for (const [key, student] of Object.entries(data?.students)) {
            if (student?.studentID === studentID) {
              // Update attendanceStatus for the matched student
              const studentRef = dbRef(db, `schools/${schoolID}/buses/${busID}/trips/${tripID}/pickupPoints/${pickupPointID}/students/${key}`);
              await update(studentRef, {
                attendanceStatus: status,
              });

              console.log("Attendance status updated:", status);
              return;
            }
          }
        }
      }
    }

    console.error("Student not found in any pickup point");
    throw new Error("Student not found");
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
  const tripRef = dbRef(db, `schools/${schoolID}/buses/${busID}/trips/${tripID}/pickupPoints`);

  try {
    const snapshot = await get(tripRef);

    if (snapshot.exists()) {
      const pickupPoints = snapshot.val();

      for (const [pickupPointID, data] of Object.entries(pickupPoints)) {
        for (const [key, student] of Object.entries(data.students)) {
          if (student.studentID === studentID) {
            // Found the student
            return student.attendanceStatus || true;
          }
        }
      }
      return null; // Student not found
    } else {
      return null; // No data for this trip
    }
  } catch (error) {
    console.error("Error fetching attendance status:", error);
    throw new Error('Error fetching attendance status');
  }
};

