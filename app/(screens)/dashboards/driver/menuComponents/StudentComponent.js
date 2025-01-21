import { View, Text, Image } from "react-native";
import React from "react";
import tw from "tailwind-react-native-classnames";

const StudentComponent = ({student}) => {
  return (
    <View
      key={student.id}
      style={[tw`bg-yellow-50 py-4 mr-4 rounded-lg shadow-sm`, { width: 220 }]}
    >
      <View style={tw`items-center mb-4`}>
        <Image
          source={
            student.profilePic
              ? { uri: student.profilePic }
              : require("../../../../assets/images/student.png")
          }
          style={[
            tw`rounded-full border-2 border-gray-300`,
            { width: 120, height: 120 },
          ]} // Increased image size
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
  );
};

export default StudentComponent;
