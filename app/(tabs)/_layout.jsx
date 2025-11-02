import { View, StyleSheet, Platform } from "react-native";
import React from "react";
import { Tabs } from "expo-router";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";

export default function AppTabs() {
  const { theme } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        unmountOnBlur: true,
        lazy: true,

        tabBarStyle: {
          position: "relative",
          height: 65,
          backgroundColor: theme.surface,
          borderTopColor: 'transparent',
          borderTopWidth: 0,
          shadowRadius: 8,
          paddingBottom: Platform.OS === "ios" ? 20 : 10,
          overflow: 'hidden',
          elevation: 0,
        },

        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
          marginTop: 4,
        },

        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.grayText,
      }}
      initialRouteName="home"
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ focused }) => (
            <View style={[
              styles.iconContainer, 
              focused && { backgroundColor: `${theme.primary}15` }
            ]}>
              <Ionicons
                name={focused ? "home" : "home-outline"}
                size={22}
                color={focused ? theme.primary : theme.grayText}
              />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="groups"
        options={{
          title: "Groups",
          tabBarIcon: ({ focused }) => (
            <View style={[
              styles.iconContainer, 
              focused && { backgroundColor: `${theme.primary}15` }
            ]}>
              <Ionicons
                name={focused ? "people" : "people-outline"}
                size={22}
                color={focused ? theme.primary : theme.grayText}
              />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="tasks"
        options={{
          title: "Tasks",
          tabBarIcon: ({ focused }) => (
            <View style={[
              styles.iconContainer, 
              focused && { backgroundColor: `${theme.primary}15` }
            ]}>
              <MaterialIcons
                name="task-alt"
                size={22}
                color={focused ? theme.primary : theme.grayText}
              />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ focused }) => (
            <View style={[
              styles.iconContainer, 
              focused && { backgroundColor: `${theme.primary}15` }
            ]}>
              <Ionicons
                name={focused ? "settings" : "settings-outline"}
                size={22}
                color={focused ? theme.primary : theme.grayText}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
    transition: "background-color 0.3s ease",
  },
});