import React, {useState} from "react";
import { View, StyleSheet, Dimensions, Text, FlatList, TouchableOpacity } from "react-native";
import Svg, { Path, G, Circle} from "react-native-svg";
import { Color as Colours } from "../../constants/colors";
import { AntDesign, FontAwesome, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Colors } from "react-native/Libraries/NewAppScreen";
const width = Dimensions.get("window").width;
const height = Dimensions.get("window").height;

export default function home() {

  return (
    <View style={styles.entire}>
      <View style={styles.container}>
        <Svg height={140} width="100%" viewBox="0 0 1440 320" preserveAspectRatio="xMidYMin slice" style={styles.svg}>
          <Path fill={Colours.primary} d="M0 0 H1440 C1300 50, 1100 300, 900 260 C700 200, 500 400, 300 260 C150 100, 75 100, 0 260 Z" />
        </Svg>

        <View style={styles.headerContent}>
            <View style={styles.headerText}>
              <Text style={styles.greeting}>Welcome back, Sabs</Text>
              <Text style={styles.overview}>Here's your overview</Text>
            </View>
            <AntDesign name="logout" size={28} color={Colours.primaryText} style={styles.logout}></AntDesign>
        </View>
      </View>

      <View style={styles.userMain}>

        <View style={styles.topUser}>

          <View style={styles.todayTask}>

            <View style={styles.headerRow}>
              <View style={styles.accentBar} />
              <Text style={styles.todayTaskText}>Today's Tasks</Text>
            </View>

            <View style={styles.taskTextContainer}>
              <Text style={styles.numTask}>3</Text>
              <Text style={styles.taskType}>Remaining</Text>
            </View>

            <View style={styles.taskTextContainer}>
              <Text style={styles.numTask}>1</Text>
              <Text style={styles.taskType}>Completed</Text>
            </View>

          </View>

          <View style={styles.userGroups}>

            <View style={styles.headerRow}>
              <View style={styles.accentBarGroups} />
              <Text style={styles.todayTaskText}>
                <FontAwesome name="group" size={18} color="#0F6EC6" /> Your Groups
              </Text>
            </View>

            <View style={styles.taskTextContainer}>
              <Text style={styles.numTask}>2</Text>
              <Text style={styles.taskType}>Active</Text>
            </View>

            <View style={styles.taskTextContainer}>
              <Text style={styles.numTask}>28</Text>
              <Text style={styles.taskType}>Members total</Text>
            </View>

          </View>

        </View>

        <View style={styles.userProgress}></View>

      </View>

      <View style={styles.quickActions}>
        <Text style={styles.quickText}>Quick Actions</Text>

        <View style={styles.actionGroup}>
          <View style={styles.AddTask}></View>
          <View style={styles.CreateGroup}></View>
          <View style={styles.ViewStats}></View>
        </View>

      </View>

      <View style={styles.upcomingTasks}>
        <Text style={styles.upcomingText}>Upcoming Tasks</Text>

        <View style={styles.taskContainer}></View>
      </View>

      <View style={styles.activeGroups}>
        <Text style={styles.activeText}>Active Groups</Text>

        <View style={styles.mainGroups}>
          <View style={styles.group1}></View>
          <View style={styles.group2}></View>
        </View>

      </View>

    </View>
  );
}

const styles = StyleSheet.create({

  userMain: {
    display: "flex",
    flexDirection:"column",
    margin: width * 0.075,
  },

  topUser: {
    flexDirection: "row",
  },

  todayTask: {
    backgroundColor: Colours.surface,
    paddingHorizontal: 15,
    flex: 1,
    borderRadius: 16,
    minWidth: width * 0.2,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 6,
    justifyContent: "center",
    alignItems: "flex-start",
  },

  todayTaskText: {
    fontWeight: "900",
    fontSize: 16,
    color: Colours.defaultText,
    letterSpacing: 0.2,
    flexShrink: 0,
    maxWidth: "100%",
    includeFontPadding: false,
  },


  taskTextContainer: {
    flexDirection: "row",
    alignItems: "center",
  },

  numTask: {
    fontWeight: 700,
    fontSize: 25,
    color: Colours.defaultText,
    marginRight: 8,
  },

  taskType: {
    fontWeight: 400,
    fontSize: 16,
    color: Colours.grayText
  },

  userGroups: {
    flex: 2.3,
    backgroundColor: Colours.surface,
    marginLeft: 15,
    borderRadius: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 6,
    padding: 20,
    height: height * 0.15,
    justifyContent: "center",
    alignItems: "flex-start",
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },

  accentBar: {
    width: 5,
    height: 22,
    borderRadius: 5,
    backgroundColor: Colours.primary,
    marginRight: 10,
  },

  accentBarGroups: {
    width: 5,
    height: 22,
    borderRadius: 5,
    backgroundColor: "#0F6EC6",
    marginRight: 10,
  },


  entire: {
    flex: 1,
    backgroundColor: Colours.background,
  },

  container: {
    width: "100%",
    height: 130,
    position: "relative",
    overflow: "visible",
  },

  headerContent: {
    position: "absolute",
    top: 20,
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  greeting: {
    fontWeight: 900,
    fontSize: 30,
    color: Colours.primaryText,
  },

  overview: {
    fontWeight: 400,
    fontSize: 18,
    color: "#d8d8d8ff"
  },

  svg: {
    position: "absolute"
  },

});
