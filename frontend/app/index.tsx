import React from "react";
import { View, Text } from "react-native";
import { Link } from "expo-router";

const index = () => {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f8f9fa",
      }}
    >
      <Text style={{ fontSize: 32, fontWeight: "bold", color: "#0078D7" }}>
        UniBond
      </Text>
      <Link href="/Home">Home</Link>
    </View>
  );
};

export default index;
