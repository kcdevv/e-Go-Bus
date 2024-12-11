import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import tw from "tailwind-react-native-classnames";
import { Ionicons } from "@expo/vector-icons"; 


const Notify = () => {
    const router = useRouter();
    const [recipient, setRecipient] = useState("parents");
    const [message, setMessage] = useState("");
    const [selectedOption, setSelectedOption] = useState("");

    const genericMessages = [
        "Bus will be late due to traffic.",
        "Bus breakdown, please wait for updates.",
        "Route change due to weather conditions.",
    ];

    const sendNotification = () => {
        if (!selectedOption && !message.trim()) {
            alert("Please select a generic message or write a custom one.");
            return;
        }
        const finalMessage = selectedOption || message;
        alert(`Message sent to ${recipient}: "${finalMessage}"`);
        setMessage("");
        setSelectedOption("");
    };

    return (
        <View style={tw`flex-1 bg-white`}>
            {/* Header */}
            <View style={[tw`flex-row items-center px-4 pb-2 pt-9`, { height: 75, backgroundColor: '#FCD32D' }]}>
                <TouchableOpacity onPress={() => router.back()} style={tw`mr-4`}>
                <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text style={tw`text-lg font-bold text-black`}>Notify</Text>
            </View>

            {/* Content */}
            <View style={tw`flex-1 p-5`}>
                {/* Recipient Selection */}
                <View style={tw`mb-5`}>
                    <Text style={tw`text-lg font-bold mb-3`}>Send To:</Text>
                    <View style={tw`flex-row items-center mb-3`}>
                        <TouchableOpacity
                            style={tw`flex-row items-center mr-5`}
                            onPress={() => setRecipient("parents")}
                        >
                            <View
                                style={[
                                    tw`w-5 h-5 rounded-full mr-2`,
                                    {
                                        borderWidth: 2,
                                        borderColor: "#FCD32D",
                                        backgroundColor: recipient === "parents" ? "#FCD32D" : "white",
                                    },
                                ]}
                            />
                            <Text style={tw`text-base`}>Parents</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={tw`flex-row items-center`}
                            onPress={() => setRecipient("management")}
                        >
                            <View
                                style={[
                                    tw`w-5 h-5 rounded-full mr-2`,
                                    {
                                        borderWidth: 2,
                                        borderColor: "#FCD32D",
                                        backgroundColor: recipient === "management" ? "#FCD32D" : "white",
                                    },
                                ]}
                            />
                            <Text style={tw`text-base`}>Management</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Generic Messages */}
                <View style={tw`mb-5`}>
                    <Text style={tw`text-lg font-bold mb-3`}>Generic Messages:</Text>
                    {genericMessages.map((msg, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[
                                tw`p-3 rounded-lg mb-3`,
                                {
                                    backgroundColor: selectedOption === msg ? "#FCD32D" : "#FFF4CC",
                                    borderWidth: 1,
                                    borderColor: "#FCD32D",
                                },
                            ]}
                            onPress={() => setSelectedOption(msg)}
                        >
                            <Text style={tw`text-black`}>{msg}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Custom Message */}
                <View style={tw`mb-5`}>
                    <Text style={tw`text-lg font-bold mb-3`}>Custom Message (Optional):</Text>
                    <TextInput
                        value={message}
                        onChangeText={setMessage}
                        placeholder="Type your custom message here"
                        style={[
                            tw`border rounded-lg p-3`,
                            {
                                borderColor: "#FCD32D",
                                backgroundColor: "#FFF4CC",
                                height: 100,
                                textAlignVertical: "top",
                            },
                        ]}
                        multiline
                    />
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                    onPress={sendNotification}
                    style={tw`bg-blue-600 p-3 flex-row items-center justify-center rounded-lg shadow-md`}
                >
                    <FontAwesome name="bell" size={20} color="#FCD32D" style={tw`mr-2`} />
                    <Text style={tw`font-bold text-white text-lg`}>Send Notification</Text>
                </TouchableOpacity>

            </View>
        </View>
    );
};

export default Notify;
