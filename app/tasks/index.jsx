import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  Dimensions,
} from "react-native";
import { ScrollView, Swipeable } from "react-native-gesture-handler";
import { Color, Color as Colours } from "../../constants/colors";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import DateTimePicker from "@react-native-community/datetimepicker";
import Fuse from "fuse.js";

const width = Dimensions.get("window").width;

export default function TaskScreen() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [modalVisible, setModalVisible] = useState(false);
  const [taskName, setTaskName] = useState("");
  const [taskDate, setTaskDate] = useState(new Date());
  const [taskTime, setTaskTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tasks, setTasks] = useState([
    {
      id: "1",
      name: "Finish React Native project",
      description: "Complete the UI and functionality",
      difficulty: "Hard",
      localGroupId: 1,
      completed: true,
    },
    {
      id: "2",
      name: "Study Physics notes",
      description: "Review chapters 4 and 5",
      difficulty: "Easy",
      localGroupId: 0,
      completed: false,
    },
    {
      id: "3",
      name: "Grocery shopping",
      description: "Buy ingredients for dinner",
      difficulty: "Medium",
      localGroupId: 0,
      completed: false,
    },
  ]);
  const [remainingSearchValue, setRemainingSearchValue] = useState("");
  const remainingFuse = new Fuse(
    tasks.filter((task) => !task.completed),
    {
      includeScore: true,
      keys: ["name", "description", "difficulty"],
    }
  );
  // const remainingFilteredIds = useRef([]);
  const [remainingTasks, setRemainingTasks] = useState(
    tasks.filter((task) => !task.completed)
  );
  const onRemainingChangeSearch = (newValue) => {
    setRemainingSearchValue(newValue);
    setRemainingTasks(tasks.filter((task) => !task.completed));
    if (newValue == "") {
      return;
    }
    let fuseSearchResults = remainingFuse.search(newValue);
    setRemainingTasks(fuseSearchResults.map(({ item }) => item));
  };

  const [completedSearchValue, setCompletedSearchValue] = useState("");
  const completedFuse = new Fuse(
    tasks.filter((task) => task.completed),
    {
      includeScore: true,
      keys: ["name", "description", "difficulty"],
    }
  );
  // const completedFilteredIds = useRef([]);
  const [completedTasks, setCompletedTasks] = useState(
    tasks.filter((task) => task.completed)
  );
  const onCompletedChangeSearch = (newValue) => {
    setCompletedSearchValue(newValue);
    setCompletedTasks(tasks.filter((task) => task.completed));
    if (newValue == "") {
      return;
    }
    let fuseSearchResults = completedFuse.search(newValue);
    setCompletedTasks(fuseSearchResults.map(({ item }) => item));
  };

  useEffect(() => {
    onCompletedChangeSearch(completedSearchValue);
    onRemainingChangeSearch(remainingSearchValue);
  }, [tasks]);
  const formattedDate = currentDate.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const nextDate = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const prevDate = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const toggleComplete = (id) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const deleteTask = (id) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  };

  const renderRightActions = (task) => (
    <TouchableOpacity
      style={!task.completed ? styles.completeButton : styles.deleteButton}
      onPress={() => toggleComplete(task.id)}
    >
      <AntDesign
        name={!task.completed ? "check" : "close"}
        size={24}
        color={Colours.primaryText}
      />
    </TouchableOpacity>
  );

  const renderTask = (task) => {
    const difficultyStyleMap = {
      Easy: {
        backgroundColor: Colours.success + "55",
        borderColor: Colours.success,
      },
      Medium: {
        backgroundColor: Colours.lightWarning + "55",
        borderColor: Colours.lightWarning,
      },
      Hard: {
        backgroundColor: Colours.warning + "55",
        borderColor: Colours.warning,
      },
    };

    return (
      <Swipeable
        key={task.id}
        renderRightActions={() => renderRightActions(task)}
        onSwipeableOpen={(dir) => {
          // if (dir === "right") toggleComplete(task.id);
        }}
        childrenContainerStyle={styles.taskCard}
        containerStyle={{
          width: "100%",
        }}
      >
        <View
          style={[
            styles.taskCardGroupIndicator,
            { backgroundColor: Colours.groupColours[task.localGroupId] },
          ]}
        />
        <View style={styles.taskCardMainContent}>
          <View style={styles.taskCardDetails}>
            <Text
              style={styles.taskCardName}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {task.name}
            </Text>
            <Text style={styles.taskCardDescription}>{task.description}</Text>
          </View>
        </View>
        <View
          style={[
            styles.taskDifficultyContainer,
            difficultyStyleMap[task.difficulty],
          ]}
        >
          <Text>{task.difficulty}</Text>
        </View>
        {/* <TouchableOpacity
          style={styles.completeButton}
          onPress={() => toggleComplete(item.id)}
        >
          {item.completed ? (
            <AntDesign name="check-circle" size={28} color="green" />
          ) : (
            <AntDesign name="check-circle" size={28} color="gray" />
          )}
        </TouchableOpacity> */}
      </Swipeable>
    );
  };

  const showModal = () => {
    setModalVisible(true);
  };

  const addTask = (taskSelected, dateSelected, timeSelected) => {
    if (!taskSelected.trim()) {
      alert("Please enter a task name!");
      return;
    }
    const newId = tasks.length
      ? Math.max(...tasks.map((task) => Number(task.id))) + 1
      : 1;

    const newTask = {
      id: newId,
      name: taskSelected,
      time: timeSelected.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      creator: "You",
      completed: false,
    };

    setTasks((prevTasks) => [...prevTasks, newTask]);
    setModalVisible(false);
    setTaskName("");
    setTaskDate(new Date());
    setTaskTime(new Date());
  };

  return (
    <View style={styles.entire}>
      <ScrollView style={{ width: "100%", height: "100%" }}>

        <View style={styles.topHeader}>
          <Ionicons name="checkmark-done-circle-outline" color={Colours.primary} size={40}></Ionicons>
          <Text style={styles.topHeaderText}>Tasks</Text>
        </View>

        <View style={styles.header}>
          <View style={styles.taskCounter}>
            <View
              style={[
                styles.taskCounterBar,
                { backgroundColor: Colours.success },
              ]}
            />
            <View style={styles.taskCounterDetails}>
              <Text style={styles.taskCounterText}>Completed</Text>
              <Text style={styles.taskCount}>
                {(() => {
                  const completedTasks = tasks.filter((task) => task.completed);
                  return completedTasks.length;
                })()}
              </Text>
            </View>
          </View>
          <View style={styles.taskCounter}>
            <View
              style={[
                styles.taskCounterBar,
                { backgroundColor: Colours.warning },
              ]}
            />
            <View style={styles.taskCounterDetails}>
              <Text style={styles.taskCounterText}>Remaining</Text>
              <Text style={styles.taskCount}>
                {(() => {
                  const remainingTasks = tasks.filter(
                    (task) => !task.completed
                  );
                  return remainingTasks.length;
                })()}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.tasks}>
          <View style={styles.tasksLabelContainer}>
            <Text
              style={[
                styles.tasksLabel,
                {
                  /*color: Colours.warning*/
                },
              ]}
            >
              Remaining
            </Text>
            <View style={styles.tasksLabelOptionsContainer}>
              <TouchableOpacity style={styles.tasksLabelFilterButton}>
                <Ionicons name="filter" size={24} color={Colours.defaultText} />
              </TouchableOpacity>
              <View style={styles.tasksSearchContainer}>
                <AntDesign
                  name="search"
                  size={24}
                  color={Colours.defaultText}
                />
                <TextInput
                  placeholder="Search"
                  value={remainingSearchValue}
                  onChangeText={onRemainingChangeSearch}
                  style={{
                    color:
                      remainingSearchValue == ""
                        ? Colours.grayText
                        : Colours.defaultText,
                    fontSize: 18,
                    flex: 1,
                    minWidth: "80%",
                  }}
                />
              </View>
            </View>
          </View>

          {tasks.filter((task) => !task.completed).length == 0 && (
            <Text
              style={{ width: "100%", textAlign: "center", marginBottom: 12 }}
            >
              No tasks left!
            </Text>
          )}

          {remainingTasks.map(renderTask)}
        </View>

        <View style={styles.tasks}>
          <View style={styles.tasksLabelContainer}>
            <Text
              style={[
                styles.tasksLabel,
                {
                  /*color: Colours.warning*/
                },
              ]}
            >
              Completed
            </Text>
            <View style={styles.tasksLabelOptionsContainer}>
              <TouchableOpacity style={styles.tasksLabelFilterButton}>
                <Ionicons name="filter" size={24} color={Colours.defaultText} />
              </TouchableOpacity>
              <View style={styles.tasksSearchContainer}>
                <AntDesign
                  name="search"
                  size={24}
                  color={Colours.defaultText}
                />
                <TextInput
                  placeholder="Search"
                  value={completedSearchValue}
                  onChangeText={onCompletedChangeSearch}
                  style={{
                    color:
                      completedSearchValue == ""
                        ? Colours.grayText
                        : Colours.defaultText,
                    fontSize: 18,
                    flex: 1,
                    minWidth: "80%",
                  }}
                />
              </View>
            </View>
          </View>
          {tasks.filter((task) => task.completed).length == 0 && (
            <Text
              style={{ width: "100%", textAlign: "center", marginBottom: 12 }}
            >
              No tasks completed!
            </Text>
          )}
          {completedTasks.map(renderTask)}
        </View>

      </ScrollView>

      <View style={styles.addTask}>
        <TouchableOpacity style={styles.addBar} onPress={showModal}>
          <AntDesign
            name="plus"
            size={45}
            color={Colours.primaryText}
          ></AntDesign>
        </TouchableOpacity>
      </View>

      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.popup}>
          <View style={styles.popupBox}>
            <TouchableOpacity
              style={styles.close}
              onPress={() => setModalVisible(false)}
            >
              <AntDesign
                name="closecircleo"
                size={30}
                color={Colours.defaultText}
              ></AntDesign>
            </TouchableOpacity>

            <Text style={styles.popupText}>Create Task</Text>
            <Text style={styles.popupInfo}>Task*</Text>
            <TextInput
              style={styles.textInp}
              placeholder="Complete Project..."
              placeholderTextColor={Colours.textSecondary}
              value={taskName}
              onChangeText={setTaskName}
            />

            <View style={styles.DateTimePickers}>
              <View style={styles.popupPicker}>
                <Text style={styles.popupInfo}>Date*</Text>
                <TouchableOpacity
                  style={styles.inpType}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text>{taskDate.toDateString()}</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.popupPicker}>
                <Text style={styles.popupInfo}>Time*</Text>
                <TouchableOpacity
                  style={styles.inpType}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Text>
                    {taskTime.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.popupInfo}>Group*</Text>
            <TextInput
              style={styles.textInp}
              placeholder="Group..."
              placeholderTextColor={Colours.textSecondary}
              value={taskName}
              onChangeText={setTaskName}
            />

            <TouchableOpacity
              style={styles.addButton}
              onPress={() => addTask(taskName, taskDate, taskTime)}
            >
              <Text style={styles.addText}>Add Task</Text>
              <AntDesign
                name="enter"
                color={Colours.primaryText}
                size={24}
              ></AntDesign>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={taskDate}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) setTaskDate(selectedDate);
                }}
              />
            )}

            {showTimePicker && (
              <DateTimePicker
                value={taskTime}
                mode="time"
                is24Hour={true}
                display="default"
                onChange={(event, selectedTime) => {
                  setShowTimePicker(false);
                  if (selectedTime) setTaskTime(selectedTime);
                }}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  entire: {
    position: "relative",
    flex: 1,
    backgroundColor: Colours.background,
  },

  topHeader: {
    backgroundColor: Colours.background,
    borderBottomColor: "#35353525",
    borderBottomWidth: 0.75,
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    padding: 15
  },

  topHeaderText: {
    color: Colours.defaultText,
    fontWeight: 500,
    fontSize: 26,
    paddingLeft: 10
  },

  header: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 10,
    backgroundColor: Colours.background,
    marginBottom: 10,
  },

  taskCounter: {
    flexDirection: "row",
    alignItems: "center",
    height: "100%",
  },

  taskCounterBar: {
    width: 5,
    height: "75%",
    borderRadius: 5,
    marginRight: 10,
  },

  taskCounterDetails: {
    gap: -10,
  },

  taskCounterText: {
    fontSize: 14,
    color: Colours.defaultText,
  },

  taskCount: {
    margin: 0,
    padding: 0,
    lineHeight: 33,
    fontSize: 32,
    color: Colours.defaultText,
  },

  taskCard: {
    minWidth: "100%",
    backgroundColor: Colours.surface,
    borderRadius: 15,
    borderColor: Colours.surfaceBorder,
    borderWidth: 1,
    padding: 15,
    marginBottom: 12,
    width: width * 0.85,
    flexDirection: "row",
    position: "relative",
    flexWrap: "wrap",
  },

  taskCardMainContent: {
    flexDirection: "row",
    flex: 1,
    paddingRight: 50,
  },

  taskCardGroupIndicator: {
    width: 5,
    height: "100%",
    backgroundColor: Colours.success,
    borderRadius: 10,
    marginRight: 10,
  },

  taskCardDetails: {
    flexDirection: "column",
    paddingVertical: 2,
  },

  taskCardName: {
    fontSize: 20,
    fontWeight: "700",
    color: Colours.defaultText,
    marginRight: 10,
    flexShrink: 1,
  },

  taskCardDescription: {
    fontSize: 13,
    color: Colours.grayText,
  },

  taskDifficultyContainer: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: Colours.background,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: Colours.surfaceBorder,
  },

  tasks: {
    width: "100%",
    height: "auto",
    padding: 20,
    paddingBottom: 0,
    paddingTop: 5,
  },
  tasksLabelContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 5,
  },
  tasksLabelOptionsContainer: {
    flexDirection: "row",
    gap: 10,
  },
  tasksLabelFilterButton: {
    padding: 5,
  },
  tasksSearchContainer: {
    backgroundColor: Colours.surface,
    borderColor: Colours.surfaceBorder,
    borderWidth: 1,
    borderRadius: 50,
    width: 150,
    paddingHorizontal: 10,
    height: 42,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  tasksLabel: {
    fontSize: 18,
    color: Colours.defaultText,
  },

  deleteButton: {
      backgroundColor: "#d50000d9",
      justifyContent: "center",
      alignItems: "center",
      width: 70,
      borderRadius: 15,
      height: "88%",
  },

  completeButton: {
      backgroundColor: "#3dd68cd9",
      justifyContent: "center",
      alignItems: "center",
      width: 70,
      borderRadius: 15,
      height: "88%"
  },

  addTask: {
    minWidth: "100%",
    position: "absolute",
    bottom: 20,
    justifyContent: "center",
    alignItems: "center",
  },

  addBar: {
    justifyContent: "center",
    alignItems: "center",
    width: 75,
    height: 75,
    borderRadius: 37.5,
    backgroundColor: Colours.primary,
  },

  popup: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },

  popupBox: {
    width: 300,
    padding: 20,
    borderRadius: 10,
    backgroundColor: Colours.background,
    elevation: 5,
    position: "relative",
  },

  close: {
    position: "absolute",
    top: -10,
    right: -10,
    backgroundColor: Colours.grayText,
    borderRadius: 15,
  },

  popupText: {
    fontWeight: 800,
    fontSize: 20,
    marginBottom: 20,
  },

  popupInfo: {
    color: Colours.textSecondary,
    fontWeight: 500,
  },

  textInp: {
    width: "100%",
    height: 50,
    backgroundColor: Colours.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    paddingHorizontal: 15,
    fontSize: 16,
    color: "#333",
    shadowColor: "#474747ff",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    marginVertical: 5,
  },

  DateTimePickers: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
  },

  popupPicker: {
    flexDirection: "column",
  },

  inpType: {
    width: "100%",
    backgroundColor: Colours.background,
    height: 45,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    justifyContent: "center",
    paddingHorizontal: 10,
    marginTop: 10,
    marginBottom: 10,
  },

  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colours.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  addText: {
    color: Colours.primaryText,
    fontSize: 16,
    fontWeight: "900",
    marginRight: 10,
  },

  pill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center"
  },

  leftButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: Colours.primary,
    borderTopLeftRadius: 25,
    borderBottomLeftRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 10,
  },

  rightButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: Colours.primary,
    borderTopRightRadius: 25,
    borderBottomRightRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 10,
  },
});
