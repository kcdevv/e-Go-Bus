import { StyleSheet, Text, View, Image } from "react-native";
import React from "react";
import tw from "tailwind-react-native-classnames";
import FormNavigateButton from "../components/common/FormNavigateButton";

const WhoYouAre = () => {

  return (
    <View style={tw`flex-1 h-full`}>
      <View style={tw`h-1/2 justify-between items-center`}>
        <Image
          source={require("../assets/images/logo.png")}
          style={tw`h-64 w-64 mt-36`}
          resizeMode="contain"
        />
        <Text style={[tw`font-bold text-2xl -mt-5`]}>
          Tell us Who you are...
        </Text>
      </View>
      <View style={tw`flex-1 h-1/2 px-10 justify-center`}>
        <View style={[tw`flex-1 justify-center`, { gap: 35 }]}>
          <FormNavigateButton text={"School Management"} navigateTo={"forms/Management"} />
          <FormNavigateButton text={"Parent"} navigateTo={"forms/Parent"} />
          <FormNavigateButton text={"Driver"} navigateTo={"forms/Driver"} />
        </View>
      </View>
    </View>
  );
};

export default WhoYouAre;

const styles = StyleSheet.create({});
