import React, {useState} from "react";
import { View, StyleSheet, Dimensions, Text, FlatList, TouchableOpacity } from "react-native";
import Svg, { Path, G, Circle} from "react-native-svg";
import { Color as Colours } from "../../constants/colors";
import { AntDesign } from "@expo/vector-icons";
import { useRouter } from "expo-router";
const width = Dimensions.get("window").width;

export default function home() {
  const router = useRouter();
  const carouselItems = [
  {id: "1", title: "Tasks Completed :", info: "329"},
  {id: "2", title: "Groups Joined :", info: "12"},
  {id: "3", title: "Need Help ?", info: "Email us"}
  ];
  const [todayTasks, setTodayTasks] = useState([
      {
          id: "1",
          name: "Finish React Native project",
          time: "10:00 AM",
          creator: "John",
          completed: false,
      },
      {
          id: "2",
          name: "Study Physics notes",
          time: "3:00 PM",
          creator: "Alice",
          completed: false,
      },
  ]);
  const infoData = [
    {name: "John", tasks: 5},
    {name: "Amy", tasks: 3},
    {name: "Others", tasks: 2}
  ]

  const toggleComplete = (id) => {
    setTodayTasks((prev) => 
        prev.map((task) => 
            task.id === id ? {...task, completed: !task.completed } : task
        )
    );
  };

  const renderTask = ({item}) => {
      return (<View style={styles.taskCard}>
          <View style={styles.topRow}>
              <Text style={[ styles.taskName, item.completed && { textDecorationLine: "line-through", opacity: 0.5 }, ]} >
                  {item.name}
              </Text>
              <TouchableOpacity style={styles.completeButton} onPress={() => toggleComplete(item.id)} >
                  {item.completed ? (
                  <AntDesign name="check-circle" size={28} color="green" />
                  ) : (
                  <AntDesign name="check-circle" size={28} color="gray" />
                  )}
              </TouchableOpacity>
          </View>
          <Text style={styles.metaText}>
          {item.time} • {item.creator}
          </Text>
      </View>)
  }

  return (
    <View style={styles.entire}>

      <View style={styles.container}>
        <Svg height={140} width="100%" viewBox="0 0 1440 320" preserveAspectRatio="xMidYMin slice" style={styles.svg}>
          <Path fill={Colours.primary} d="M0 0 H1440 C1300 50, 1100 300, 900 260 C700 200, 500 400, 300 260 C150 100, 75 100, 0 260 Z" />
        </Svg>

        <View style={styles.headerContent}>
            <Text style={styles.greeting}>Hi User,</Text>
            <AntDesign name="logout" size={28} color={Colours.primaryText} style={styles.logout}></AntDesign>
        </View>
      </View>

      <View style={styles.todayInfo}>
        <View style={styles.todayHeader}>
          <TouchableOpacity style={styles.upcomingButt} onPress={() => router.push("/tasks")}>
            <AntDesign name="double-left" size={15} color={Colours.primaryText} />
          </TouchableOpacity>
          <Text style={styles.todayTask}>Today's Tasks</Text>
        </View>
        <View style={[styles.taskContainer, {height: 175}]}>
          <FlatList data={todayTasks}
          renderItem={renderTask}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{paddingBottom: 20}}
          showsVerticalScrollIndicator={true}
          />
        </View>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
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

  svg: {
    position: "absolute"
  },

  todayInfo: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },

  todayTask: {
    color: Colours.primary,
    paddingRight: 20,
    marginLeft: 10,
    marginBottom: 10,
    alignSelf:"flex-end",
    fontWeight: 900,
    fontSize: 24
  },

  taskCard: {
    backgroundColor: Colours.primaryText,
    borderRadius: 10,
    padding: 30,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 4,
    elevation: 2,
    width: width * 0.85,
  },

  topRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
  },

  taskName: {
      fontSize: 20,
      fontWeight: "700",
      color: Colours.defaultText,
      marginRight: 10,
      flexShrink: 1,
  },

  metaText: {
      fontSize: 13,
      color: Colours.textSecondary,
      marginTop: 6,
  },

  upcomingButt: {
    backgroundColor: Colours.primary,
    alignItems: "center",
    padding: 7,
    width: width * 0.08, 
    borderRadius: 15,
    elevation: 2,
  },

  upcomingText: {
    fontWeight: 900,
    color: Colours.textOnPrimary,
  },

  todayHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
    alignSelf: "flex-end"
  },

  otherStats: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    width: "100%"
  },

  groupStatText: {
    fontWeight: 700,
    fontSize: 20,
    marginBottom: 5,
  },

  leftHandGraph: {
    alignItems: "center",
    backgroundColor: Colours.card,
    borderRadius: 10,
    marginTop: 10
  },

  changeGroupButton: {
    backgroundColor: Colours.secondary,
    padding: 10,
    borderRadius: 5,
    marginBottom: 5,
  },

  legend: {
    marginTop: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
    marginHorizontal: 5
  },

  colorBox: {
    width: 15,
    height: 15,
    marginRight: 5,
    borderRadius: 3
  },

  labelText: {
    fontSize: 14,
    fontWeight: 600,
    color: Colours.textPrimary
  }
});
