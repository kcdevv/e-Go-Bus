import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import tw from "tailwind-react-native-classnames";
import { getDatabase, ref, onValue } from "firebase/database";
import AsyncStorage from "@react-native-async-storage/async-storage";

const Attendance = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [schoolID, setSchoolID] = useState("");
  const [busID, setBusID] = useState("");
  const [tripID, setTripID] = useState("");
  const db = getDatabase();

  const loadData = async () => {
    try {
      const storedSchoolID = await AsyncStorage.getItem("schoolID");
      const storedBusID = await AsyncStorage.getItem("busID");
      const storedTripID = await AsyncStorage.getItem("tripID");
       console.log(storedTripID);
      if (storedSchoolID) setSchoolID(storedSchoolID);
      if (storedBusID) setBusID(storedBusID);
      if (storedTripID) {
        // const decodedTripID = decodeURIComponent(storedTripID).replace(/"/g, "");
        setTripID(storedTripID);
      }
    } catch (error) {
      console.error("Error loading data from AsyncStorage:", error);
    }
  };

  useEffect(() => {
    const getStudents = async () => {
      try {
        await loadData();

        if (schoolID && busID && tripID) {
          const studentsRef = ref(
            db,
            `schools/${schoolID}/buses/${busID}/trips/${tripID}/students/`
          );
          console.log(studentsRef);
          const unsubscribe = onValue(
            studentsRef,
            (snapshot) => {
              const data = snapshot.val();
              console.log(data);
              if (data) {
                const studentList = Object.keys(data).map((key) => ({
                  id: key,
                  ...data[key],
                }));
                setStudents(studentList);
              }
              setLoading(false);
            },
            (error) => {
              console.error("Error fetching students:", error);
              setLoading(false);
            }
          );

          return () => unsubscribe(); // Cleanup on unmount
        }
      } catch (error) {
        console.error("Error in getStudents:", error);
      }
    };

    getStudents();
  }, [schoolID, busID, tripID]);
 

  if (loading) {
    return (
      <View style={tw`flex-1 justify-center items-center`}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <View style={tw`flex-1 bg-white py-6 px-4`}>
      <Text style={tw`text-2xl font-bold text-center text-black mb-6`}>
        Attendance
      </Text>

      <ScrollView>
        {students.map((student) => (
          <View
            key={student.id}
            style={tw`bg-yellow-50 p-4 mb-4 rounded-lg shadow-sm`}
          >
            <View style={tw`flex-row items-center mb-4`}>
              <Image
                source={require("../../../../assets/images/student.png")}
                style={[
                  tw`rounded-full border-2 border-gray-300`,
                  { width: 48, height: 48 },
                ]}
              />
              <View style={tw`justify-center ml-4`}>
                <Text style={tw`text-lg font-semibold text-black`}>
                  {student.studentName}
                </Text>
              </View>
            </View>

            <View style={tw`flex-row justify-around items-center`}>
              <TouchableOpacity style={tw`flex-row items-center`}>
                <Text style={tw`text-red-500 text-2xl font-bold mr-2`}>✗</Text>
                <Text style={tw`text-red-500 text-sm`}>Absent</Text>
              </TouchableOpacity>

              <TouchableOpacity style={tw`flex-row items-center`}>
                <Text style={tw`text-green-500 text-2xl font-bold mr-2`}>✓</Text>
                <Text style={tw`text-green-500 text-sm`}>Present</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default Attendance;
