import {View,Text,StyleSheet,TouchableOpacity,FlatList,Modal,TextInput,Platform} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { ScrollView, Swipeable, Switch } from "react-native-gesture-handler";
import {Color as Colours } from "../../../constants/colors";
import { AntDesign, Ionicons, FontAwesome } from "@expo/vector-icons";
import React, { useEffect, useRef, useState, useCallback } from "react";
import DateTimePicker from "@react-native-community/datetimepicker";
import Fuse from "fuse.js";
import { useRouter } from "expo-router";
import {useAuth} from "../../../context/AuthContext";
import { ActivityIndicator } from "react-native";
import {createTask as createTaskDB, updateTask as updateTaskDB} from "../../../firebase/firebaseService";
import {useData} from "../../../context/DataContext";
import LoadingScreen from "../../../components/loadingScreen";

export default function TaskScreen() {
  const {user, userData, loading: authLoading} = useAuth();
  const router = useRouter();
  const { tasks, setTasks, allGroups, myGroups, loading: dataLoading, loadingProgress } = useData();

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

  const [selectedTask, setSelectedTask] = useState(null);
  const [taskModalVisible, setTaskModalVisible] = useState(false);

  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filterButtonLayout, setFilterButtonLayout] = useState(null);
  const [selectedGroupFilter, setSelectedGroupFilter] = useState([]);

  const [completedFilterModalVisible, setCompletedFilterModalVisible] = useState(false);
  const [completedFilterButtonLayout, setCompletedFilterButtonLayout] = useState(null);
  const [selectedCompletedGroupFilter, setSelectedCompletedGroupFilter] = useState([]);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  const [remainingSearchValue, setRemainingSearchValue] = useState("");
  const [remainingTasks, setRemainingTasks] = useState([]);
  const [completedSearchValue, setCompletedSearchValue] = useState("");
  const [completedTasks, setCompletedTasks] = useState([]);

  const filterButtonRef = useRef(null);
  const completedFilterButtonRef = useRef(null);
  const canSwipeRef = useRef({})

  const showAlertText = (message) => {setAlertMessage(message); setAlertVisible(true);}

  const onRemainingChangeSearch = useCallback((newValue) => {
    setRemainingSearchValue(newValue);
    const filtered = tasks.filter((task) => !task.completed);
    if (newValue === "") {
      setRemainingTasks(filtered);
      return;
    }
    const remainingFuse = new Fuse(filtered, {
      includeScore: true,
      keys: ["title", "description", "difficulty"],
    });
    let fuseSearchResults = remainingFuse.search(newValue);
    setRemainingTasks(fuseSearchResults.map(({ item }) => item));
  }, [tasks]);

  const onCompletedChangeSearch = useCallback((newValue) => {
    setCompletedSearchValue(newValue);
    const filtered = tasks.filter((task) => task.completed);
    if (newValue === "") {
      setCompletedTasks(filtered);
      return;
    }
    const completedFuse = new Fuse(filtered, {
      includeScore: true,
      keys: ["title", "description", "difficulty"],
    });
    let fuseSearchResults = completedFuse.search(newValue);
    setCompletedTasks(fuseSearchResults.map(({ item }) => item));
  }, [tasks]);
  
  useEffect(() => {
    onCompletedChangeSearch(completedSearchValue);
    onRemainingChangeSearch(remainingSearchValue);
  }, [tasks, onCompletedChangeSearch, onRemainingChangeSearch]);

  useEffect(() => {
    tasks.forEach(task => {
      if (!canSwipeRef.current[task.id]) {
        canSwipeRef.current[task.id] = React.createRef();
      }
    });
  }, [tasks]);

  if (authLoading || dataLoading) {
    return <LoadingScreen progress={loadingProgress} />;
  }

  if (!user || !userData) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <Text style={{ marginTop: 10, color: "#666" }}>Please log in</Text>
      </View>
    );
  }
  
  const userId = user.uid;
  const remainingFuse = new Fuse(tasks.filter(task => task && !task.completed),{includeScore: true,keys: ["title", "description", "difficulty"],});
  const completedFuse = new Fuse(tasks.filter((task) => task.completed),{includeScore: true,keys: ["title", "description", "difficulty"],});

  const filteredTasks = remainingTasks.filter(task => selectedGroupFilter.length === 0 || selectedGroupFilter.includes(task.groupId));
  const filteredCompletedTasks = completedTasks.filter(task => selectedCompletedGroupFilter.length === 0 || selectedCompletedGroupFilter.includes(task.groupId));

  const toggleComplete = async (id) => {
    const currentTask = tasks.find(task => task.id === id)
    if (!currentTask) return;

    const updates = {completedBy: [...currentTask.completedBy, userId]}
    const result = await updateTaskDB(id, updates)

    if (result.success) {
      setTasks((prev) =>
        prev.map((task) =>
          task.id === id ? { ...task, completedBy: updates.completedBy, completed: true } : task
        )
      );
    }

  };

  const deleteTask = async (id) => {
    const currentTask = tasks.find(task => task.id === id);
    if (!currentTask) return;

    const updates = {deletedBy: [...currentTask.deletedBy, userId]}
    const result = await updateTaskDB(id, updates)

    if (result.success) {
      setTasks((prev) => prev.map((task) => task.id === id ? {...task, deletedBy: updates.deletedBy} : task));
    }

  };

  const renderRightActions = (task) => (
    <TouchableOpacity
      style={!task.completed ? styles.completeButton : styles.deleteButton}
      onPress={() => {
        if (task.completed) {
          deleteTask(task.id);
        } else {
          toggleComplete(task.id);
        }
      }}>
      <AntDesign
        name={!task.completed ? "check" : "close"}
        size={24}
        color={Colours.primaryText}
      />
    </TouchableOpacity>
  );

  const getDifficultyColor = (level) => {
  switch(level){
    case "Easy": return "#43a047";
    case "Medium": return "#f57c00";
    case "Hard": return "#e53935";
    default: return Colours.defaultText;
  }
  };

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

    if (task.deletedBy.includes(userId)) {
      return
    }

    return (
      <Swipeable
        ref = {canSwipeRef.current[task.id]}
        key={task.id}
        renderRightActions={() => renderRightActions(task)}
        childrenContainerStyle={styles.taskCard}
        containerStyle={{width: "100%"}}

      >
        <TouchableOpacity onPress={() => {
          if (canSwipeRef.current) {
            canSwipeRef.current[task.id]?.current?.close();
          }
          setSelectedTask(task);
          setTaskModalVisible(true);
        }} style={{ flexDirection: "row"}}>
          <View
            style={[
              styles.taskCardGroupIndicator,
              { backgroundColor: myGroups.find((group) => group.id === task.groupId)?.colour || Colours.primary},
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
          <Text style={styles.dueDate}>Due : {task.dueDate ? task.dueDate : "No Due Date"}</Text>
        </TouchableOpacity>
      </Swipeable>
    );
  };

  const addTask = async (taskSelected, dateSelected) => {
    if (!taskSelected.trim()) {
      Alert.alert("Please enter a task name!");
      return;
    }

    if (!selectedGroupT) {
      Alert.alert("Please select a group");
      return;
    }

    console.log("Creating initial task")

    const result = await createTaskDB({
      title: taskSelected.trim(),
      description: taskDescription,
      dueDate: dateSelected ? dateSelected.toISOString().split('T')[0] : "",
      difficulty: difficulty,
      groupId: selectedGroupT.id,
      createdBy: userId,
    });

    if (result.success) {
      console.log("Task created with ID:", result.taskId);

      const newTask = {
        id: result.taskId,
        title: taskSelected.trim(),
        dueDate: dateSelected ? dateSelected.toISOString().split('T')[0] : "",
        difficulty,
        description: taskDescription,
        groupId: selectedGroupT.id,
        completedAt: [],
        completedBy: [],
        deletedBy: [],
        completed: false,
      };

      setTasks((prevTasks) => [...prevTasks, newTask]);

      setShowAddTaskModal(false);
      setTaskName("");
      setTaskDate(new Date());
      setTaskTime(new Date());
      setTaskDescription("");
      setDifficulty("Easy");
      setSelectedGroupT(null);
      setHasDueDate(false);

      showAlertText("Task created successfully!");
    } else {
      console.error("Error creating task:", result.error);
      Alert.alert("Error", result.error);
    }
  };

  const remainingTasksSorted = filteredTasks.sort((a, b) => {
    if (!a.dueDate && !b.dueDate) return 0;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return new Date(a.dueDate) - new Date(b.dueDate);
  });
  const completedTasksSorted = filteredCompletedTasks.sort((a, b) => {
    if (!a.dueDate && !b.dueDate) return 0;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return new Date(a.dueDate) - new Date(b.dueDate);
  });

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
            <Text style={styles.tasksLabel}>Remaining</Text>
            <View style={styles.tasksLabelOptionsContainer}>
              <TouchableOpacity ref={filterButtonRef} style={styles.tasksLabelFilterButton} 
              onPress={() => {
                if (filterButtonRef.current) {
                  filterButtonRef.current.measureInWindow((x, y, width, height) => {
                    setFilterButtonLayout({ x, y, width, height });
                    setFilterModalVisible(true);
                  })
              }}}>
                <Ionicons name="filter" size={24} color={Colours.defaultText} />
              </TouchableOpacity>
              <View style={styles.tasksSearchContainer}>
                <FontAwesome name="search" size={24} color={Colours.defaultText}/>
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
          
          <FlatList data={remainingTasksSorted} keyExtractor={(item) => item.id.toString()} renderItem={({ item }) => renderTask(item)} ListEmptyComponent={
              <Text style={{ width: "100%", textAlign: "center"}}>
                No tasks left!
              </Text>}
            scrollEnabled={false}
          />
        </View>

        <View style={styles.tasks}>
          <View style={styles.tasksLabelContainer}>
            <Text
              style={[
                styles.tasksLabel,
              ]}
            >
              Completed
            </Text>
            <View style={styles.tasksLabelOptionsContainer}>
              <TouchableOpacity ref={completedFilterButtonRef} style={styles.tasksLabelFilterButton} 
              onPress={() => {
                if (completedFilterButtonRef.current) {
                  completedFilterButtonRef.current.measureInWindow((x, y, width, height) => {
                    setCompletedFilterButtonLayout({ x, y, width, height });
                    setCompletedFilterModalVisible(true);
                  })
              }}}>
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
           <FlatList data={completedTasksSorted} keyExtractor={(item) => item.id.toString()} renderItem={({ item }) => renderTask(item)} ListEmptyComponent={
              <Text style={{ width: "100%", textAlign: "center"}}>
                No tasks left!
              </Text>}
            scrollEnabled={false}
            />
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
              {myGroups.map((group) => (
                <View key={group.id} style={{ alignItems: 'center', marginRight: 15 }}>
                  <TouchableOpacity style={[styles.iconOption, selectedGroupT?.id === group.id && styles.iconSelected, {backgroundColor: group.colour}]} onPress={() => setSelectedGroupT(group)}>
                    <Ionicons name={group.icon} size={26} color="white"></Ionicons>
                  </TouchableOpacity>
                  
                  {selectedGroupT?.id === group.id && (<Text style={{ marginTop: 4, fontSize: 11, color: selectedGroupT.colour,fontWeight: '500', marginRight: 10}}numberOfLines={1}>{group.name}</Text>)}
                </View>
              ))}
            </ScrollView>


            <Text style={styles.popupInfo}>Description</Text>
            <TextInput style={[styles.textInp, { height: 80, textAlignVertical: "top" }]} placeholder="Add more details..." placeholderTextColor={Colours.textSecondary} value={taskDescription} onChangeText={setTaskDescription}multiline/>

            <TouchableOpacity style={styles.addButton} onPress={() => addTask(taskName, hasDueDate ? taskDate : null, difficulty, selectedGroupT, taskDescription)}>
              <Text style={styles.addText}>Add Task</Text>
              <AntDesign name="enter" color={Colours.primaryText} size={24} />
            </TouchableOpacity>

            {showDatePicker && ( <DateTimePicker value={taskDate} mode="date" display={Platform.OS === "ios" ? "spinner" : "default"} minimumDate={new Date()} onChange={(event, selectedDate) => {setShowDatePicker(false); if (selectedDate) setTaskDate(selectedDate);}}/>)}
          </View>
        </View>
      </Modal>
      
      <Modal visible={taskModalVisible} animationType="fade" transparent={true} onRequestClose={() => setTaskModalVisible(false)}>
        <View style={styles.modalOverlay}>

          <View style={styles.taskDetailsModal}>
            <TouchableOpacity style={styles.close} onPress={() => setTaskModalVisible(false)}>
              <AntDesign name="close-circle" size={30} color="white"></AntDesign>
            </TouchableOpacity>

            {selectedTask && (
              <>
                <Text style={styles.modalTitle}>{selectedTask.title}</Text>

                <View style={styles.modalRow}>
                  <Text style={[styles.modalLabel, { marginTop: 0 }]}>Description</Text>
                  <Text style={styles.modalValue}>{selectedTask.description || "No description provided."}</Text>
                </View>

                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Due Date:</Text>
                  <Text style={styles.modalValue}>{selectedTask.dueDate || "No due date set."}</Text>
                </View>

                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Difficulty:</Text>
                  <Text style={[styles.modalValue, {color: getDifficultyColor(selectedTask.difficulty)}]}>{selectedTask.difficulty}</Text>
                </View>

                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Group:</Text>
                  <View style={{flexDirection:"row", alignItems:"center"}}>
                    <View style={{width:15, height:15, borderRadius:4, backgroundColor: myGroups.find(g=>g.id===selectedTask.groupId)?.colour || "#ccc", marginRight:8}}/>
                    <Text style={styles.modalValue}>{myGroups.find(g=>g.id===selectedTask.groupId)?.name || "No group assigned."}</Text>
                  </View>
                </View>

                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Status:</Text>
                  <Text style={[styles.modalValue, {color: selectedTask.completed ? "#43a047" : "#f57c00"}]}>{selectedTask.completed ? "Completed" : "Remaining"}</Text>
                </View>
              </>)}
          </View>
        </View>

      </Modal>

      {filterModalVisible && filterButtonLayout && (
        <Modal transparent={true} animationType="fade">
          <TouchableOpacity activeOpacity={1} style={styles.overlay} onPress={() => setFilterModalVisible(false)} />
            
          <View style={[styles.filterDropdown, {position: "absolute", top:filterButtonLayout.y + filterButtonLayout.height + 5, left: filterButtonLayout.x}]}>
            <ScrollView nestedScrollEnabled={true}>
              {myGroups.map((group) => {
                const isSelected = selectedGroupFilter.includes(group.id);
                return (
                  <TouchableOpacity key={group.id} style={{flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 10, borderBottomWidth: 1, borderBlockColor: "#eee"}} onPress={() => {
                      if (isSelected) {
                        setSelectedGroupFilter(selectedGroupFilter.filter((id) => id !== group.id));
                      } else {
                        setSelectedGroupFilter([...selectedGroupFilter, group.id]);
                      }
                    }}>
                    <View style={[styles.filterCheckbox, {borderColor: group.colour, backgroundColor: isSelected ? group.colour : "white"}]}>
                      {isSelected && <AntDesign name="check" size={14} color="white" />}
                    </View>
                    <Text style={[styles.pillText]}>{group.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </Modal>
      )}

      {completedFilterButtonLayout && completedFilterModalVisible && (
        <Modal transparent={true} animationType="fade">
          <TouchableOpacity activeOpacity={1} style={styles.overlay} onPress={() => setCompletedFilterModalVisible(false)} />
            
          <View style={[styles.filterDropdown, {position: "absolute", top:completedFilterButtonLayout.y + completedFilterButtonLayout.height + 5, left: completedFilterButtonLayout.x}]}>
            <ScrollView nestedScrollEnabled={true}>
              {myGroups.map((group) => {
                const isSelected = selectedCompletedGroupFilter.includes(group.id);
                return (
                  <TouchableOpacity key={group.id} style={{flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 10, borderBottomWidth: 1, borderBlockColor: "#eee"}} onPress={() => {
                      if (isSelected) {
                        setSelectedCompletedGroupFilter(selectedCompletedGroupFilter.filter((id) => id !== group.id));
                      } else {
                        setSelectedCompletedGroupFilter([...selectedCompletedGroupFilter, group.id]);
                      }
                    }}>
                    <View style={[styles.filterCheckbox, {borderColor: group.colour, backgroundColor: isSelected ? group.colour : "white"}]}>
                      {isSelected && <AntDesign name="check" size={14} color="white" />}
                    </View>
                    <Text style={[styles.pillText]}>{group.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </Modal>
      )}

      </View>
  );
}

const styles = StyleSheet.create({
  // =========================
  // ENTIRE SCREEN
  // =========================
  entire: {
    flex: 1,
    backgroundColor: Colours.background,
  },

  // =========================
  // TOP HEADER
  // =========================
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

  // =========================
  // TASK SECTION
  // =========================
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
    borderRadius: 2,
    marginRight: 12,
    backgroundColor: Colours.primary,
    alignSelf: "stretch",
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
    top: -5,
    right: 12,
    backgroundColor: Colours.background,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colours.surfaceBorder,
  },

  dueDate: {
    position: "absolute",
    right: 10,
    bottom: -5,
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

  // =========================
  // POPUP STYLES
  // =========================
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
    top: 12,
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

  // =========================
  // PILL STYLES
  // =========================
  pill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
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
    backgroundColor: "#0F6EC6",
  },

  pillText: {
    fontWeight: "600",
    color: Colours.defaultText,
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

  selectedColorBorder: {
    borderColor: "#0F6EC6",
    transform: [{ scale: 1.1 }],
    elevation: 3,
  },

  // =========================
  // MODAL STYLES
  // =========================
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 20,
  },

  taskDetailsModal: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: Colours.surface,
    borderRadius: 20,
    padding: 25,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },

  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: Colours.primary,
    textAlign: "center",
    marginBottom: 20,
  },

  modalRow: {
    marginBottom: 15,
  },

  modalLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: Colours.grayText,
    marginBottom: 4,
  },

  modalValue: {
    fontSize: 16,
    color: Colours.defaultText,
  },

  // =========================
  // FILTER DROPDOWN
  // =========================

  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  filterDropdown: {
    width: 220,
    backgroundColor: "white",
    borderRadius: 10,
    maxHeight: 300,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },

  filterItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  filterCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 2,
    marginRight: 10,
    alignItems: "center",
    justifyContent: "center",
  },

});

