import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import tw from "tailwind-react-native-classnames";
import { getDatabase, ref, onValue } from "firebase/database";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDriverContext } from "../context/driver.context";


const Attendance = () => {
  const [students, setStudents] = useState([]);
  const [schoolID, setSchoolID] = useState("");
  const [busID, setBusID] = useState("");
  const [tripID, setTripID] = useState("");
  const [pickupPoints, setPickupPoints] = useState([]); // New state for Pickup Points
  const [isHorizontal, setIsHorizontal] = useState(false); // Toggle for horizontal/vertical layout
  const db = getDatabase();

  const { tripStarted } = useDriverContext();

  // Load IDs from AsyncStorage
  const loadData = async () => {
    try {
      const storedSchoolID = await AsyncStorage.getItem("schoolID");
      const storedBusID = await AsyncStorage.getItem("busID");
      const storedTripID = await AsyncStorage.getItem("tripID");
      if (storedSchoolID) setSchoolID(storedSchoolID);
      if (storedBusID) setBusID(storedBusID);
      if (storedTripID) setTripID(storedTripID);
    } catch (error) {
      console.error("Error loading data from AsyncStorage:", error);
    }
  };

  useEffect(() => {
    const getStudents = async () => {
      try {
        await loadData();
        if (schoolID && busID && tripID) {
          // Get Pickup Points
          const pickupPointsRef = ref(db, `schools/${schoolID}/buses/${busID}/trips/${tripID}/pickupPoints/`);
          const studentsRef = ref(db, `schools/${schoolID}/buses/${busID}/trips/${tripID}/students/`);

          // Fetch Pickup Points
          onValue(pickupPointsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
              const pointsList = Object.keys(data).map((key) => ({
                id: key,
                ...data[key],
              }));
              setPickupPoints(pointsList); // Store pickup points
            }
          });

          // Fetch Students
          const unsubscribe = onValue(
            studentsRef,
            (snapshot) => {
              const data = snapshot.val();
              if (data) {
                const studentList = Object.keys(data).map((key) => ({
                  id: key,
                  ...data[key],
                }));
                setStudents(studentList);
              }
            },
            (error) => {
              console.error("Error fetching students:", error);
              setLoading(false);
            }
          );

          return () => unsubscribe();
        }
      } catch (error) {
        console.error("Error in getStudents:", error);
      }
    };

    getStudents();
  }, [schoolID, busID, tripID, tripStarted]);

  // Handle attendance status updates
  const updateAttendanceStatus = (studentID, status) => {
    if (!schoolID || !busID || !tripID) {
      console.error("Missing IDs for updating attendance");
      return;
    }
    const attendanceRef = ref(
      db,
      `schools/${schoolID}/buses/${busID}/trips/${tripID}/students/${studentID}`
    );
    set(attendanceRef, { attendanceStatus: status })
      .then(() => console.log(`Updated attendance for ${studentID}: ${status}`))
      .catch((error) =>
        console.error("Error updating attendance:", error)
      );
  };

  if (!tripStarted) {
    return (
      <View style={tw`flex-1 justify-center items-center`}>
        <Image 
          source={require("../../../../assets/images/attendance.png")}
          style={tw`w-56 h-56 mb-2`}
          resizeMode="contain"
        />
        <Text style={tw`text-lg font-semibold text-gray-500`}>No trip started yet</Text>
      </View>
    )
  }

  return (
    <View style={tw`flex-1 bg-white py-6 px-4`}>
      <View style={tw`flex-row justify-center items-center mb-6`}>
        <Text style={tw`text-2xl font-bold text-black`}>Attendance</Text>
      </View>

      <ScrollView>
        {pickupPoints.map((pp) => (
          <View key={pp.id} style={tw`mb-6`}>
            <Text style={tw`text-xl font-bold text-black mb-4`}>
              Pickup Point: {pp.pickupPointID}
            </Text>
            {/* Horizontal ScrollView for students under each Pickup Point */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {students
                .filter((student) => student.pickupPointID === pp.pickupPointID)
                .map((student) => (
                  <View
                    key={student.id}
                    style={[tw`bg-yellow-50 py-4 mr-4 rounded-lg shadow-sm`, { width: 220 }]}
                  >
                    <View style={tw`items-center mb-4`}>
                      <Image
                        source={student.profilePic ? { uri: student.profilePic } : require("../../../../assets/images/student.png")}
                        style={[tw`rounded-full border-2 border-gray-300`, { width: 120, height: 120 }]} // Increased image size
                      />
                      <Text style={tw`text-lg font-semibold text-black mt-2`}>
                        {student.studentName}
                      </Text>
                    </View>
                    <View style={tw`flex-row justify-evenly items-center mt-2`}>
                      <TouchableOpacity
                        onPress={() => updateAttendanceStatus(student.id, "Absent")}
                        style={[
                          tw`bg-red-500 px-8 py-2 shadow-md`,
                          { marginRight: 16 }, // Adds space between buttons
                        ]}
                      >
                        <Text style={tw`text-white text-3xl font-bold`}>✗</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => updateAttendanceStatus(student.id, "Present")}
                        style={tw`bg-green-500 px-8 py-2 shadow-md`}
                      >
                        <Text style={tw`text-white text-3xl font-bold`}>✓</Text>
                      </TouchableOpacity>
                    </View>


                  </View>
                ))}
            </ScrollView>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default Attendance;
