import {View,Text,StyleSheet,TouchableOpacity,FlatList,Modal,TextInput,Platform, Alert} from "react-native";
import { ScrollView, Swipeable, Switch } from "react-native-gesture-handler";
import { useTheme } from "../../../context/ThemeContext";
import { AntDesign, Ionicons, FontAwesome } from "@expo/vector-icons";
import React, { useEffect, useRef, useState, useCallback } from "react";
import * as Notifications from 'expo-notifications'
import DateTimePicker from "@react-native-community/datetimepicker";
import Fuse from "fuse.js";
import { useRouter } from "expo-router";
import {useAuth} from "../../../context/AuthContext";
import {createTask as createTaskDB, updateTask as updateTaskDB} from "../../../firebase/firebaseService";
import {useData} from "../../../context/DataContext";
import LoadingScreen from "../../../components/loadingScreen";
import {scheduleTaskDeadlineNotification, cancelTaskNotifications} from '../../../services/notificationService'

export default function TaskScreen() {
  const {user, userData, loading: authLoading} = useAuth();
  const {theme} = useTheme()
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

  const notificationListener = useRef();
  const responseListener = useRef();

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

  useEffect(() => {
    const subscription1 = Notifications.addNotificationReceivedListener(notification => {
      console.log('📬 Notification received in foreground:', notification);
    });

    const subscription2 = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 Notification tapped:', response);
      const taskId = response.notification.request.content.data?.taskId;
      if (taskId) {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
          setSelectedTask(task);
          setTaskModalVisible(true);
        }
      }
    });

    return () => {
      subscription1.remove();
      subscription2.remove();
    };
  }, [tasks]);

  if (authLoading || dataLoading) {
    return <LoadingScreen progress={loadingProgress} />;
  }

  if (!user || !userData) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
        <Text style={{ marginTop: 10, color: theme.grayTex }}>Please wait / log in</Text>
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
      await cancelTaskNotifications(id);

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
      await cancelTaskNotifications(id);

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
        color={theme.primaryText}
      />
    </TouchableOpacity>
  );

  const getDifficultyColor = (level) => {
    switch(level){
      case "Easy": return "#43a047";
      case "Medium": return "#f57c00";
      case "Hard": return "#e53935";
      default: return theme.defaultText;
    }
  };

  const renderTask = (task) => {
      const difficultyStyleMap = {
        "Easy": {
          backgroundColor: theme.success + "55",
          borderColor: theme.success,
        },
        "Medium": {
          backgroundColor: theme.lightWarning + "55",
          borderColor: theme.lightWarning,
        },
        "Hard": {
          backgroundColor: theme.warning + "55",
          borderColor: theme.warning,
        },
      };

      if (task.deletedBy && task.deletedBy.includes(userId)) return null;

      return (
        <Swipeable
          ref = {canSwipeRef.current[task.id]}
          key={task.id}
          renderRightActions={() => renderRightActions(task)}
          childrenContainerStyle={[styles.taskCard, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}
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
                { backgroundColor: myGroups.find((group) => group.id === task.groupId)?.colour || theme.primary},
              ]}
            />
            <View style={styles.taskCardMainContent}>
              <View style={styles.taskCardDetails}>
                <Text
                  style={[styles.taskCardName, { color: theme.defaultText }]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {task.title}
                </Text>
                <Text style={[styles.taskCardDescription, { color: theme.grayText }]}>{task.description}</Text>
              </View>
            </View>
            <View
              style={[
                styles.taskDifficultyContainer,
                { backgroundColor: theme.background, borderColor: theme.surfaceBorder },
                difficultyStyleMap[task.difficulty],
              ]}
            >
              <Text style={{ color: theme.defaultText }}>{task.difficulty}</Text>
            </View>
            <Text style={[styles.dueDate, { color: theme.defaultText }]}>Due : {task.dueDate ? task.dueDate : "No Due Date"}</Text>
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

    const result = await createTaskDB({
      title: taskSelected.trim(),
      description: taskDescription,
      dueDate: dateSelected ? dateSelected.toISOString().split('T')[0] : "",
      difficulty: difficulty,
      groupId: selectedGroupT.id,
      createdBy: userId,
    });

    if (result.success) {

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

      if (newTask.dueDate) {
        await scheduleTaskDeadlineNotification(newTask, userId);
      }

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
    <View style={[styles.entire, { backgroundColor: theme.background }]}>
      <ScrollView style={{ width: "100%", height: "100%" }}>

        <View style={[styles.topHeader, { backgroundColor: theme.surface }]}>
          <Ionicons name="checkmark-done" color={theme.primary} size={40}></Ionicons>
          <Text style={[styles.topHeaderText, { color: theme.defaultText }]}>Tasks</Text>
        </View>

        <View style={[styles.header, { backgroundColor: theme.background }]}>
          <View style={styles.taskCounter}>
            <View
              style={[
                styles.taskCounterBar,
                { backgroundColor: theme.success },
              ]}
            />
            <View style={styles.taskCounterDetails}>
              <Text style={[styles.taskCounterText, { color: theme.defaultText }]}>Completed</Text>
              <Text style={[styles.taskCount, { color: theme.defaultText }]}>
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
                { backgroundColor: theme.warning },
              ]}
            />
            <View style={styles.taskCounterDetails}>
              <Text style={[styles.taskCounterText, { color: theme.defaultText }]}>Remaining</Text>
              <Text style={[styles.taskCount, { color: theme.defaultText }]}>
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
            <Text style={[styles.tasksLabel, { color: theme.defaultText }]}>Remaining</Text>
            <View style={styles.tasksLabelOptionsContainer}>
              <TouchableOpacity ref={filterButtonRef} style={styles.tasksLabelFilterButton} 
              onPress={() => {
                if (filterButtonRef.current) {
                  filterButtonRef.current.measureInWindow((x, y, width, height) => {
                    setFilterButtonLayout({ x, y, width, height });
                    setFilterModalVisible(true);
                  })
              }}}>
                <Ionicons name="filter" size={24} color={theme.defaultText} />
              </TouchableOpacity>
              <View style={[styles.tasksSearchContainer, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
                <FontAwesome name="search" size={24} color={theme.defaultText}/>
                <TextInput
                  placeholder="Search"
                  value={remainingSearchValue}
                  placeholderTextColor={theme.grayText}
                  onChangeText={onRemainingChangeSearch}
                  style={{
                    color: theme.defaultText,
                    fontSize: 18,
                    flex: 1,
                    minWidth: "80%",
                  }}
                />
              </View>
            </View>
          </View>
          
          <FlatList data={remainingTasksSorted} keyExtractor={(item) => item.id.toString()} renderItem={({ item }) => renderTask(item)} ListEmptyComponent={
              <Text style={{ width: "100%", textAlign: "center", color: theme.grayText}}>
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
                { color: theme.defaultText }
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
                <Ionicons name="filter" size={24} color={theme.defaultText} />
              </TouchableOpacity>
              <View style={[styles.tasksSearchContainer, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
                <FontAwesome
                  name="search"
                  size={24}
                  color={theme.defaultText}
                />
                <TextInput
                  placeholder="Search"
                  placeholderTextColor={theme.grayText}
                  value={completedSearchValue}
                  onChangeText={onCompletedChangeSearch}
                  style={{
                    color: theme.defaultText,
                    fontSize: 18,
                    flex: 1,
                    minWidth: "80%",
                  }}
                />
              </View>
            </View>
          </View>
           <FlatList data={completedTasksSorted} keyExtractor={(item) => item.id.toString()} renderItem={({ item }) => renderTask(item)} ListEmptyComponent={
              <Text style={{ width: "100%", textAlign: "center", color: theme.grayText}}>
                No tasks left!
              </Text>}
            scrollEnabled={false}
            />
        </View>

      </ScrollView>

      <View style={styles.addTask}>
        <TouchableOpacity style={[styles.addBar, { backgroundColor: theme.primary }]} onPress={() => setShowAddTaskModal(true)}>
          <AntDesign
            name="plus"
            size={45}
            color={theme.primaryText}
          ></AntDesign>
        </TouchableOpacity>
      </View>

      <Modal visible={showAddTaskModal} animationType="fade" transparent={true} onRequestClose={() => setShowAddTaskModal(false)}>
        <View style={styles.popup}>
          <View style={[styles.popupBox, { backgroundColor: theme.surface }]}>
            <TouchableOpacity style={styles.close} onPress={() => setShowAddTaskModal(false)}>
              <AntDesign name="close-circle" size={30} color="white"></AntDesign>
            </TouchableOpacity>

            <Text style={[styles.popupText, { color: theme.defaultText }]}>Create Task</Text>

            <Text style={[styles.popupInfo, { color: theme.grayText }]}>Task*</Text>
            <TextInput style={[styles.textInp, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder, color: theme.defaultText }]} placeholder="Complete Project..." placeholderTextColor={theme.grayText} value={taskName} onChangeText={setTaskName}/>

            <View style={{ flexDirection: "row", alignItems: "center", marginVertical: 10 }}>
              <Switch value={hasDueDate} onValueChange={setHasDueDate} thumbColor={hasDueDate ? theme.primary : "#ccc"} trackColor={{ false: "#aaa", true: theme.primary }}/>
              <Text style={{ marginLeft: 10, color: theme.defaultText, fontWeight: "600" }}>Add a due date?</Text>
            </View>

            {hasDueDate && (
              <View style={styles.DateTimePickers}>
                <View style={styles.popupPicker}>
                  <Text style={[styles.popupInfo, { color: theme.grayText }]}>Date*</Text>
                  <TouchableOpacity style={[styles.inpType, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]} onPress={() => setShowDatePicker(true)}>
                    <Text style={{color: theme.grayText}}>{taskDate.toDateString()}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <Text style={[styles.popupInfo, { color: theme.grayText }]}>Difficulty</Text>
            <View style={styles.pill}>
              {['Easy', 'Medium', 'Hard'].map((level) => (
                <TouchableOpacity key={level} style={[styles.pillButton, { backgroundColor: difficulty === level ? theme.primary : theme.surfaceBorder, borderColor: difficulty === level ? theme.primary : theme.secondary }]} onPress={() => setDifficulty(level)}>
                  <Text style={[styles.pillText, { color: difficulty === level ? "white" : theme.defaultText }]}>{level}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.popupInfo, { color: theme.grayText }]}>Group*</Text>
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

            <Text style={[styles.popupInfo, { color: theme.grayText }]}>Description</Text>
            <TextInput style={[styles.textInp, { height: 80, textAlignVertical: "top", backgroundColor: theme.surface, borderColor: theme.surfaceBorder, color: theme.defaultText }]} placeholder="Add more details..." placeholderTextColor={theme.grayText} value={taskDescription} onChangeText={setTaskDescription}multiline/>

            <TouchableOpacity style={styles.addButton} onPress={() => addTask(taskName, hasDueDate ? taskDate : null, difficulty, selectedGroupT, taskDescription)}>
              <Text style={styles.addText}>Add Task</Text>
              <AntDesign name="enter" color={theme.primaryText} size={24} />
            </TouchableOpacity>

            {showDatePicker && ( <DateTimePicker value={taskDate} mode="date" display={Platform.OS === "ios" ? "spinner" : "default"} minimumDate={new Date()} onChange={(event, selectedDate) => {setShowDatePicker(false); if (selectedDate) setTaskDate(selectedDate);}}/>)}
          </View>
        </View>
      </Modal>
      
      <Modal visible={taskModalVisible} animationType="fade" transparent={true} onRequestClose={() => setTaskModalVisible(false)}>
        <View style={styles.modalOverlay}>

          <View style={[styles.taskDetailsModal, { backgroundColor: theme.surface }]}>
            <TouchableOpacity style={styles.close} onPress={() => setTaskModalVisible(false)}>
              <AntDesign name="close-circle" size={30} color="white"></AntDesign>
            </TouchableOpacity>

            {selectedTask && (
              <>
                <Text style={[styles.modalTitle, { color: theme.primary }]}>{selectedTask.title}</Text>

                <View style={styles.modalRow}>
                  <Text style={[styles.modalLabel, { marginTop: 0, color: theme.grayText }]}>Description</Text>
                  <Text style={[styles.modalValue, { color: theme.defaultText }]}>{selectedTask.description || "No description provided."}</Text>
                </View>

                <View style={styles.modalRow}>
                  <Text style={[styles.modalLabel, { color: theme.grayText }]}>Due Date:</Text>
                  <Text style={[styles.modalValue, { color: theme.defaultText }]}>{selectedTask.dueDate || "No due date set."}</Text>
                </View>

                <View style={styles.modalRow}>
                  <Text style={[styles.modalLabel, { color: theme.grayText }]}>Difficulty:</Text>
                  <Text style={[styles.modalValue, {color: getDifficultyColor(selectedTask.difficulty)}]}>{selectedTask.difficulty}</Text>
                </View>

                <View style={styles.modalRow}>
                  <Text style={[styles.modalLabel, { color: theme.grayText }]}>Group:</Text>
                  <View style={{flexDirection:"row", alignItems:"center"}}>
                    <View style={{width:15, height:15, borderRadius:4, backgroundColor: myGroups.find(g=>g.id===selectedTask.groupId)?.colour || "#ccc", marginRight:8}}/>
                    <Text style={[styles.modalValue, { color: theme.defaultText }]}>{myGroups.find(g=>g.id===selectedTask.groupId)?.name || "No group assigned."}</Text>
                  </View>
                </View>

                <View style={styles.modalRow}>
                  <Text style={[styles.modalLabel, { color: theme.grayText }]}>Status:</Text>
                  <Text style={[styles.modalValue, {color: selectedTask.completed ? "#43a047" : "#f57c00"}]}>{selectedTask.completed ? "Completed" : "Remaining"}</Text>
                </View>
              </>)}
          </View>
        </View>

      </Modal>

      {filterModalVisible && filterButtonLayout && (
        <Modal transparent={true} animationType="fade">
          <TouchableOpacity activeOpacity={1} style={styles.overlay} onPress={() => setFilterModalVisible(false)} />
            
          <View style={[styles.filterDropdown, {position: "absolute", top:filterButtonLayout.y + filterButtonLayout.height + 5, left: filterButtonLayout.x, backgroundColor: theme.surface}]}>
            <ScrollView nestedScrollEnabled={true}>
              {myGroups.map((group) => {
                const isSelected = selectedGroupFilter.includes(group.id);
                return (
                  <TouchableOpacity key={group.id} style={{flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: theme.surfaceBorder}} onPress={() => {
                      if (isSelected) {
                        setSelectedGroupFilter(selectedGroupFilter.filter((id) => id !== group.id));
                      } else {
                        setSelectedGroupFilter([...selectedGroupFilter, group.id]);
                      }
                    }}>
                    <View style={[styles.filterCheckbox, {borderColor: group.colour, backgroundColor: isSelected ? group.colour : "white"}]}>
                      {isSelected && <AntDesign name="check" size={14} color="white" />}
                    </View>
                    <Text style={[styles.pillText, { color: theme.defaultText }]}>{group.name}</Text>
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
            
          <View style={[styles.filterDropdown, {position: "absolute", top:completedFilterButtonLayout.y + completedFilterButtonLayout.height + 5, left: completedFilterButtonLayout.x, backgroundColor: theme.surface}]}>
            <ScrollView nestedScrollEnabled={true}>
              {myGroups.map((group) => {
                const isSelected = selectedCompletedGroupFilter.includes(group.id);
                return (
                  <TouchableOpacity key={group.id} style={{flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: theme.surfaceBorder}} onPress={() => {
                      if (isSelected) {
                        setSelectedCompletedGroupFilter(selectedCompletedGroupFilter.filter((id) => id !== group.id));
                      } else {
                        setSelectedCompletedGroupFilter([...selectedCompletedGroupFilter, group.id]);
                      }
                    }}>
                    <View style={[styles.filterCheckbox, {borderColor: group.colour, backgroundColor: isSelected ? group.colour : "white"}]}>
                      {isSelected && <AntDesign name="check" size={14} color="white" />}
                    </View>
                    <Text style={[styles.pillText, { color: theme.defaultText }]}>{group.name}</Text>
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
  },

  // =========================
  // TOP HEADER
  // =========================
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 18,
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
    marginBottom: 2,
  },

  taskCount: {
    fontSize: 28,
    fontWeight: "700",
  },

  tasks: {
    width: "100%",
    paddingHorizontal: 20,
    paddingBottom: 10,
    marginTop: 5,
  },

  taskCard: {
    borderRadius: 14,
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
    alignSelf: "stretch",
  },

  taskCardDetails: {
    flex: 1,
  },

  taskCardName: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 2,
  },

  taskCardDescription: {
    fontSize: 13.5,
  },

  taskDifficultyContainer: {
    position: "absolute",
    top: -5,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
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
    textAlign: "center",
    marginBottom: 20,
  },

  popupInfo: {
    fontWeight: "600",
    marginBottom: 5,
    marginTop: 10,
  },

  textInp: {
    width: "100%",
    height: 50,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 15,
    fontSize: 16,
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
    height: 50,
    borderWidth: 1,
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
    alignItems: "center",
  },

  pillText: {
    fontWeight: "600",
  },

  iconOption: {
    width: 55,
    height: 55,
    borderRadius: 15,
    borderWidth: 1,
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
    textAlign: "center",
    marginBottom: 20,
  },

  modalRow: {
    marginBottom: 15,
  },

  modalLabel: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },

  modalValue: {
    fontSize: 16,
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