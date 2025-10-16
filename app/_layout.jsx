import { View, Text } from "react-native";
import React from "react";
import { Tabs } from "expo-router";

export default function index() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          height: 75,
          borderTopWidth: 0,
          paddingTop: 18,
        },

        // tabBarLabelStyle: { display: "none" },
        tabBarHideOnKeyboard: true,
        unmountOnBlur: true,
        freezeOnBlur: false,
        lazy: false,
        // animation: "none",
      }}
      initialRouteName="home"
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
        }}
      />
      <Tabs.Screen
        name="groups"
        options={{
          title: "Groups",
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: "Tasks",
        }}
      />
    </Tabs>
  );
}
