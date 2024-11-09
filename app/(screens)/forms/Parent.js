import { StyleSheet, Text, TextInput, View , Button, TouchableOpacity} from 'react-native'
import React, { useState } from 'react'
import tw from 'tailwind-react-native-classnames'
import { useNavigation, useRouter } from 'expo-router'

const Parent = () => {
  const [schoolID, setSchoolID] = useState('')
  const [busID, setBusID] = useState('')
  const [studentID, setStudentID] = useState('')
  const navigation = useNavigation()
  const handleSubmit = ()=>{
    console.log("School ID:", schoolID);
    console.log("Bus ID:", busID);
    console.log("Student ID:", studentID);
    navigation.reset({
      index: 0,
      routes: [{ name: 'dashboards/parent' }],
    });    
    
  }

  const disabled = schoolID.length === 0 || busID.length === 0 || studentID.length===0;

  return (
    <View style={[tw`flex-1 h-full justify-center items-center w-full px-7`, {gap: 10}]}>
      <Text style={tw`font-extrabold text-2xl mb-10`}>Parent Login</Text>
      <TextInput
      style={[tw`w-full px-3 py-3 mb-4 rounded-lg border-2 border-yellow-200`, {backgroundColor: "#F9F3F3"}]}
      placeholder="School ID"
      value={schoolID}
      onChangeText={setSchoolID}
      />
      <TextInput
      style={[tw`w-full px-3 py-3 mb-4 rounded-lg border-2 border-yellow-200`, {backgroundColor: "#F9F3F3"}]}
      placeholder="Student ID"
      value={studentID}
      onChangeText={setStudentID}
      />
      <TextInput
      style={[tw`w-full px-3 py-3 mb-4 rounded-lg border-2 border-yellow-200`, {backgroundColor: "#F9F3F3"}]}
      placeholder="Bus ID"
      value={busID}
      onChangeText={setBusID}
      />
      <TouchableOpacity
        style={[
          tw`py-3 px-7 rounded-xl border border-gray-400 ${
            disabled ? "opacity-40" : "opacity-100"
          }`,
          { backgroundColor: "#FCD32D" },
        ]}
        onPress={handleSubmit}
        disabled={disabled}
      >
        <Text style={tw`text-black text-base font-bold text-center`}>
          Login
        </Text>
      </TouchableOpacity>
    </View>
  )
}

export default Parent

const styles = StyleSheet.create({})