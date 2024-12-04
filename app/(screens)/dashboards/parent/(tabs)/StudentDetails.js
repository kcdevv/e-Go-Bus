import React, { useEffect, useState } from "react";
import { Text, View, Image, ScrollView, TouchableOpacity } from "react-native";
import tw from "tailwind-react-native-classnames";
import LottieView from "lottie-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { updateAttendanceStatus, fetchStudentAttendance } from "../services/attendanceService";

const StudentDetails = () => {
  const [studentData, setStudentData] = useState(null);
  const [attendanceStatus, setAttendanceStatus] = useState(null);
  const [tripID, setTripID] = useState('N/A');
  const [busID, setBusID] = useState('N/A');
  const [schoolID, setSchoolID] = useState('N/A');
  const [studentID, setStudentID] = useState('N/A');

  useEffect(() => {
    const fetchStudentDetails = async () => {
      try {
        const studentDetails = await AsyncStorage.getItem("studentDetails");
        const schoolName = await AsyncStorage.getItem("schoolName");

        if (studentDetails) {
          const parsedStudentDetails = JSON.parse(studentDetails);
          setStudentData({
            ...parsedStudentDetails,
            schoolName,
          });

          const trip = await AsyncStorage.getItem("tripID");
          const bus = await AsyncStorage.getItem("busID");
          const school = await AsyncStorage.getItem("schoolID");
          const student = await AsyncStorage.getItem("studentID");
          if (trip && bus && school && student) {
            setTripID(JSON.parse(trip));
            setBusID(JSON.parse(bus));
            setSchoolID(JSON.parse(school));
            setStudentID(JSON.parse(student));
          }

          const status = await fetchStudentAttendance(schoolID, busID, tripID, studentID);
          setAttendanceStatus(status);
        }
      } catch (error) {
        console.error("Error fetching student details:", error);
      }
    };

    fetchStudentDetails();
  }, []);

  const handleAttendanceUpdate = async (status) => {
    if (studentData) {
      await updateAttendanceStatus(schoolID, busID, tripID, studentID, status);
      setAttendanceStatus(status); // Update UI immediately
    }
  };

  if (!studentData) {
    return (
      <View style={tw`flex-1 items-center justify-center`}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView>
      <View style={tw`flex-1 items-center p-4 bg-white pb-16`}>
        {/* <LottieView
          style={{ width: 270, height: 150 }}
          source={require("../../../../assets/animations/bus.json")}
          autoPlay
          loop
          speed={1}
        /> */}
        <Image
          source={
            studentData.profilePic
              ? { uri: studentData.profilePic }
              : require('../../../../assets/images/student.png') // Default image
          }
          style={tw`w-20 h-20 rounded-full mb-2`}
        />

        <View style={tw`w-full p-4 bg-yellow-100 rounded-lg mb-2 mt-2`}>
          <Text style={tw`text-center text-lg font-bold mb-2`}>
            {studentData.standard} standard
          </Text>
          <Text style={tw`text-lg mb-2`}>Name: {studentData.studentName}</Text>
          <Text style={tw`text-lg mb-2`}>Roll No: {studentData.rollNo}</Text>
          <Text style={tw`text-lg mb-2`}>
            Parent Name: {studentData.parentName}
          </Text>
          <Text style={tw`text-lg mb-2`}>Phone No: {studentData.parentMobile}</Text>
          <Text style={tw`text-lg`}>School Name: {studentData.schoolName}</Text>
        </View>
        <View style={tw`w-full p-4 bg-yellow-100 rounded-lg mt-4`}>
          <Text style={tw`text-lg font-bold text-center mb-2`}>Today</Text>
          <View style={tw`flex-row justify-evenly`}>
            <TouchableOpacity
              onPress={() => handleAttendanceUpdate(true)}
              style={tw`p-2 bg-green-500 rounded-lg`}
            >
              <Text style={tw`text-white text-lg`}>✔️ Present</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleAttendanceUpdate(false)}
              style={tw`p-2 bg-red-500 rounded-lg`}
            >
              <Text style={tw`text-white text-lg`}>✖️ Absent</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={tw`w-full p-4 bg-yellow-100 rounded-lg mt-4`}>
          <Text style={tw`text-lg font-bold text-center mb-2`}>Current Status:{" "}
            {attendanceStatus ? (
              <Text style={tw`text-green-500`}>Present</Text>
            ) : (
              <Text style={tw`text-red-500`}>Absent</Text>
            )}
          </Text>
        </View>

      </View>
    </ScrollView>
  );
};

export default StudentDetails;
