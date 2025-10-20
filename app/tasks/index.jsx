import {View,Text,StyleSheet,TouchableOpacity,FlatList,Modal,TextInput,Dimensions,} from "react-native";
import { ScrollView, Swipeable, Switch } from "react-native-gesture-handler";
import { Color, Color as Colours } from "../../constants/colors";
import { AntDesign, Ionicons, FontAwesome } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import DateTimePicker from "@react-native-community/datetimepicker";
import Fuse from "fuse.js";

const width = Dimensions.get("window").width;

export default function TaskScreen() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState([
    { id: '1', title: 'Task 1', dueDate: '2024-06-10', difficulty: 'Easy', description: "Hello my name is", groupId: 1 },
    { id: '2', title: 'Task 2', dueDate: '2024-06-12',  difficulty: 'Medium', description: "Hello my name is", groupId: 1 },
    { id: '3', title: 'Task 3', dueDate: '2024-06-15', difficulty: 'Hard', description: "Hello my name is", groupId: 3 },
    { id: '4', title: 'Task 4', dueDate: '2024-06-15', difficulty: 'Hard', description: "Hello my name is", groupId: 2 },
  ]);
  const [groups, setGroups] = useState([
    {id: 1, name: "Study Group", members: 23, colour: Colours.groupColours[0], icon: "book", tasksDone: 15, percent: 65, tasks:23},
    {id: 2, name: "Dorm Group", members: 5, colour: Colours.groupColours[2], icon: "people-sharp", tasksDone: 15, percent: 65, tasks:23},
    {id: 3, name: "Study Group", members: 23, colour: Colours.groupColours[0], icon: "book", tasksDone: 15, percent: 65, tasks:23},
  ]);

  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [taskName, setTaskName] = useState("");
  const [taskDate, setTaskDate] = useState(new Date());
  const [taskTime, setTaskTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [taskDescription, setTaskDescription] = useState("");
  const [difficulty, setDifficulty] = useState("Easy");
  const [hasDueDate, setHasDueDate] = useState(false);
  const [selectedGroupT, setSelectedGroupT] = useState(null);
  
  const [remainingSearchValue, setRemainingSearchValue] = useState("");
  const remainingFuse = new Fuse(
    tasks.filter((task) => !task.completed),
    {
      includeScore: true,
      keys: ["name", "description", "difficulty"],
    }
  );
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
        childrenContainerStyle={styles.taskCard}
        containerStyle={{
          width: "100%",
        }}
      >
        <View
          style={[
            styles.taskCardGroupIndicator,
            { backgroundColor: groups.find((group) => group.id === task.groupId)?.colour || Colours.defaultText},
          ]}
        />
        <View style={styles.taskCardMainContent}>
          <View style={styles.taskCardDetails}>
            <Text
              style={styles.taskCardName}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {task.title}
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
      </Swipeable>
    );
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
          <Ionicons name="checkmark-done" color={Colours.primary} size={40}></Ionicons>
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
              ]}
            >
              Remaining
            </Text>
            <View style={styles.tasksLabelOptionsContainer}>
              <TouchableOpacity style={styles.tasksLabelFilterButton}>
                <Ionicons name="filter" size={24} color={Colours.defaultText} />
              </TouchableOpacity>
              <View style={styles.tasksSearchContainer}>
                <FontAwesome
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
                <FontAwesome
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
        <TouchableOpacity style={styles.addBar} onPress={() => setShowAddTaskModal(true)}>
          <AntDesign
            name="plus"
            size={45}
            color={Colours.primaryText}
          ></AntDesign>
        </TouchableOpacity>
      </View>

      <Modal visible={showAddTaskModal} animationType="fade" transparent={true} onRequestClose={() => setShowAddTaskModal(false)}>
        <View style={styles.popup}>
          <View style={styles.popupBox}>
            <TouchableOpacity style={styles.close} onPress={() => setShowAddTaskModal(false)}>
              <AntDesign name="close-circle" size={30} color="white"></AntDesign>
            </TouchableOpacity>

            <Text style={styles.popupText}>Create Task</Text>


            <Text style={styles.popupInfo}>Task*</Text>
            <TextInput style={styles.textInp} placeholder="Complete Project..." placeholderTextColor={Colours.textSecondary} value={taskName} onChangeText={setTaskName}/>

            <View style={{ flexDirection: "row", alignItems: "center", marginVertical: 10 }}>
              <Switch value={hasDueDate} onValueChange={setHasDueDate} thumbColor={hasDueDate ? Colours.primary : "#ccc"} trackColor={{ false: "#aaa", true: Colours.primary }}/>
              <Text style={{ marginLeft: 10, color: Colours.defaultText, fontWeight: "600" }}>Add a due date?</Text>
            </View>

            {hasDueDate && (
              <View style={styles.DateTimePickers}>
                <View style={styles.popupPicker}>
                  <Text style={styles.popupInfo}>Date*</Text>
                  <TouchableOpacity style={styles.inpType} onPress={() => setShowDatePicker(true)}>
                    <Text>{taskDate.toDateString()}</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.popupPicker}>
                  <Text style={styles.popupInfo}>Time*</Text>
                  <TouchableOpacity style={styles.inpType} onPress={() => setShowTimePicker(true)}>
                    <Text>
                      {taskTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <Text style={styles.popupInfo}>Difficulty</Text>
            <View style={styles.pill}>
              {['Easy', 'Medium', 'Hard'].map((level) => (
                <TouchableOpacity key={level} style={[styles.pillButton, difficulty === level && styles.activeButton]} onPress={() => setDifficulty(level)}>
                  <Text style={[styles.pillText, difficulty === level && styles.activeText]}>{level}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.popupInfo}>Group*</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginVertical: 10}}>
              {groups.map((group) => (
                <TouchableOpacity key={group.id} style={[styles.iconOption, selectedGroupT?.id === group.id && styles.iconSelected, {backgroundColor: group.colour}, ]} onPress={() => setSelectedGroupT(group)}>
                  <Ionicons name={group.icon} size={26} color="white"></Ionicons>
                </TouchableOpacity>))}
            </ScrollView>

            <Text style={styles.popupInfo}>Description</Text>
            <TextInput style={[styles.textInp, { height: 80, textAlignVertical: "top" }]} placeholder="Add more details..." placeholderTextColor={Colours.textSecondary} value={taskDescription} onChangeText={setTaskDescription}multiline/>

            <TouchableOpacity style={styles.addButton} onPress={() => addTask(taskName, hasDueDate ? taskDate : null, hasDueDate ? taskTime : null, difficulty, selectedGroup, taskDescription)}>
              <Text style={styles.addText}>Add Task</Text>
              <AntDesign name="enter" color={Colours.primaryText} size={24} />
            </TouchableOpacity>

            {showDatePicker && ( <DateTimePicker value={taskDate} mode="date" display="default" onChange={(event, selectedDate) => {setShowDatePicker(false); if (selectedDate) setTaskDate(selectedDate);}}/>)}
            {showTimePicker && ( <DateTimePicker value={taskTime} mode="time" is24Hour={true} display="default" onChange={(event, selectedTime) => { setShowTimePicker(false); if (selectedTime) setTaskTime(selectedTime); }} />)}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  entire: {
    flex: 1,
    backgroundColor: Colours.background,
  },

  // Top Header Section
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 18,
    backgroundColor: Colours.surface,
    elevation: 4,
    borderBottomColor: "#ffffff10",
    borderBottomWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    zIndex: 10,
    marginBottom: 2,
  },

  topHeaderText: {
    color: Colours.defaultText,
    fontWeight: "700",
    fontSize: 26,
    marginLeft: 10,
  },

  // Task Section

  header: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 14,
    marginBottom: 6,
    backgroundColor: Colours.background,
  },

  taskCounter: {
    flexDirection: "row",
    alignItems: "center",
  },

  taskCounterBar: {
    width: 5,
    height: 45,
    borderRadius: 4,
    marginRight: 10,
  },

  taskCounterDetails: {
    flexDirection: "column",
    justifyContent: "center",
  },

  taskCounterText: {
    fontSize: 13,
    color: Colours.textSecondary,
    marginBottom: 2,
  },

  taskCount: {
    fontSize: 28,
    color: Colours.defaultText,
    fontWeight: "700",
  },

  tasks: {
    width: "100%",
    paddingHorizontal: 20,
    paddingBottom: 10,
    marginTop: 5,
  },
  
  taskCard: {
    backgroundColor: Colours.surface,
    borderRadius: 14,
    borderColor: Colours.surfaceBorder,
    borderWidth: 1,
    padding: 15,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },

  taskCardMainContent: {
    flexDirection: "row",
    flex: 1,
    paddingRight: 50,
  },

  taskCardGroupIndicator: {
    width: 4,
    height: "100%",
    borderRadius: 10,
    marginRight: 12,
  },

  taskCardDetails: {
    flex: 1,
  },

  taskCardName: {
    fontSize: 18,
    fontWeight: "700",
    color: Colours.defaultText,
    marginBottom: 2,
  },

  taskCardDescription: {
    fontSize: 13.5,
    color: Colours.textSecondary,
  },

  taskDifficultyContainer: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: Colours.background,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colours.surfaceBorder,
  },
  
  tasksLabelContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },

  tasksLabelOptionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  tasksLabelFilterButton: {
    padding: 6,
    borderRadius: 8,
  },

  tasksSearchContainer: {
    backgroundColor: Colours.surface,
    borderColor: Colours.surfaceBorder,
    borderWidth: 1,
    borderRadius: 10,
    width: 160,
    paddingHorizontal: 10,
    height: 45,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  tasksLabel: {
    fontSize: 19,
    color: Colours.defaultText,
    fontWeight: "600",
  },

  deleteButton: {
    backgroundColor: "#e53935",
    justifyContent: "center",
    alignItems: "center",
    width: 65,
    borderRadius: 15,
    height: "85%",
  },

  completeButton: {
    backgroundColor: "#43a047",
    justifyContent: "center",
    alignItems: "center",
    width: 65,
    borderRadius: 15,
    height: "85%",
  },

  // POPUP STYLES

  addTask: {
    minWidth: "100%",
    position: "absolute",
    bottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
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
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    paddingHorizontal: 25,
  },

  popupBox: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: Colours.surface,
    borderRadius: 20,
    padding: 25,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    position: "relative",
  },

  close: {
    position: "absolute",
    top:12,
    right: 12,
    backgroundColor: "#0F6EC6",
    borderRadius: 20,
    width: 34,
    height: 34,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
  },

  popupText: {
    fontWeight: "800",
    fontSize: 22,
    color: Colours.defaultText,
    textAlign: "center",
    marginBottom: 20,
  },

  popupInfo: {
    color: Colours.grayText,
    fontWeight: "600",
    marginBottom: 5,
    marginTop: 10,
  },

  textInp: {
    width: "100%",
    height: 50,
    backgroundColor: Colours.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    paddingHorizontal: 15,
    fontSize: 16,
    color: Colours.defaultText,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },

  DateTimePickers: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },

  popupPicker: {
    flex: 1,
    marginHorizontal: 5,
  },

  inpType: {
    backgroundColor: Colours.surface,
    height: 50,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 10,
    justifyContent: "center",
    paddingHorizontal: 15,
  },

  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0F6EC6",
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },

  addText: {
    color: "white",
    fontSize: 17,
    fontWeight: "700",
    marginRight: 10,
  },

  pill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },

  pillButton: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colours.secondary,
    alignItems: "center",
    backgroundColor: "#f8f8f8",
  },

  activeButton: {
    backgroundColor: Colours.primary,
    borderColor: Colours.primary,
  },

  pillText: {
    color: Colours.secondaryText,
    fontWeight: "600",
  },

  activeText: {
    color: "white",
  },

  iconOption: {
    width: 55,
    height: 55,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: Colours.surface,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    elevation: 1,
  },

  iconSelected: {
    backgroundColor: "#0F6EC6",
    borderColor: "#0F6EC6",
    elevation: 4,
  },

  pill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },


  pillText: {
    fontWeight: "600",
    color: Colours.defaultText,
  },

  activeButton: {
    backgroundColor: "#0F6EC6",
  },

  selectedColorBorder: {
    borderColor: "#0F6EC6",
    transform: [{ scale: 1.1 }],
    elevation: 3,
  },


});
