import { StyleSheet, Text, View, Image, TouchableOpacity } from "react-native";
import React from "react";
import { Link, useNavigation, useRouter } from "expo-router";
import tw from "tailwind-react-native-classnames";

const index = () => {
  const navigation = useNavigation();
  return (
    <View style={tw`h-full flex-1 flex-col justify-between`}>
      <View style={tw`h-1/2 justify-center items-center`}>
        <Image
          source={require("../assets/images/logo.png")}
          style={tw`h-32 w-32`}
          resizeMode="contain"
        />
      </View>
      <TouchableOpacity
        style={tw`py-3 bg-yellow-400`}
        onPress={() => navigation.navigate("WhoYouAre")}
      >
        <Text style={tw`text-white text-lg font-bold text-center`}>
          Get Started
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default index;

const styles = StyleSheet.create({});
