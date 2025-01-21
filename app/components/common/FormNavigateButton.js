import { TouchableOpacity, Text } from "react-native";
import React from "react";
import tw from "tailwind-react-native-classnames";
import { useNavigation } from "expo-router";

const FormNavigateButton = ({ text, navigateTo }) => {
  const navigation = useNavigation();

  return (
    <TouchableOpacity
      style={[tw`py-3 rounded-full`, { backgroundColor: "#FCD32D" }]}
      onPress={() => navigation.navigate(navigateTo)}
    >
      <Text style={tw`text-black text-lg font-bold text-center`}>{text}</Text>
    </TouchableOpacity>
  );
};

export default FormNavigateButton;
