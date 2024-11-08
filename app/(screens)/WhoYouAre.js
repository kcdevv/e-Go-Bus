import { StyleSheet, Text, View, Image, TouchableOpacity } from "react-native";
import React from "react";
import tw from "tailwind-react-native-classnames";
import { useNavigation } from "expo-router";

const WhoYouAre = () => {

  const navigation = useNavigation()

  return (
    <View style={tw`flex-1 h-full`}>
      <View style={tw`h-1/2 justify-between items-center`}>
        <Image
          source={require("../assets/images/logo.png")}
          style={tw`h-32 w-32 mt-40`}
          resizeMode="contain"
        />
        <Text style={[tw`font-bold text-2xl`]}>Tell us Who you are...</Text>
      </View>
      <View style={tw`flex-1 h-1/2 px-10 justify-center`}>
        <View style={[tw`flex-1 justify-center`, {gap: 35}]}>
        <TouchableOpacity
            style={[tw`py-3 rounded-full`, {backgroundColor: "#FCD32D"}]}
            onPress={() => navigation.navigate("forms/Management")}
          >
            <Text style={tw`text-black text-lg font-bold text-center`}>
              School Management
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[tw`py-3 rounded-full`, {backgroundColor: "#FCD32D"}]}
            onPress={() => navigation.navigate("forms/Parent")}
          >
            <Text style={tw`text-black text-lg font-bold text-center`}>
              Parent
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[tw`py-3 rounded-full`, {backgroundColor: "#FCD32D"}]}
            onPress={() => navigation.navigate("forms/Driver")}
          >
            <Text style={tw`text-black text-lg font-bold text-center`}>
              Driver
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default WhoYouAre;

const styles = StyleSheet.create({});
