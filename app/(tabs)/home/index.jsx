import {useEffect, useState, useCallback} from "react";
import { useFocusEffect } from "@react-navigation/native";
import { View, StyleSheet, Dimensions, Text, TouchableOpacity, Modal, TextInput, Alert, Platform } from "react-native";
import { ScrollView, Switch } from "react-native-gesture-handler";
import Svg, { Path, G, Circle} from "react-native-svg";
import { Color as Colours } from "../../../constants/colors";
import { AntDesign, FontAwesome, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import ToastAlert from "../../../toastAlert";
import { signOut } from "firebase/auth";
import { auth } from "../../../firebase/config";
import {useAuth} from "../../../context/AuthContext";
import { ActivityIndicator } from "react-native";
const height = Dimensions.get("window").height;
const width = Dimensions.get("window").width;
import {useData} from "../../../context/DataContext"
import LoadingScreen from "../../../components/loadingScreen"
import { createGroup as createGroupDB, createTask as createTaskDB, leaveGroup as leaveGroupDB } from "../../../firebase/firebaseService";

export default function Home() {
  const {user, userData, loading: authLoading} = useAuth();
  const router = useRouter();
  const { tasks, setTasks, allGroups, setAllGroups, myGroups, setMyGroups, loading: dataLoading, loadingProgress } = useData();

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
  
  const [showAddGroupModal, setShowAddGroupModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("people-sharp");
  const [groupType, setGroupType] = useState("Public");
  const [selectedColour, setSelectedColour] = useState(Colours.groupColours[0]);

  const [showStatsModal, setShowStatsModal] = useState(false);

  const [showRecentGroup, setShowRecentGroup] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState(null);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const showAlertText = (message) => {setAlertMessage(message); setAlertVisible(true);}

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
  const totalMembers = myGroups.reduce((sum, group) => group.creatorId === userId ? sum + group.membersList.length : sum, 0);
  const progressPercentage = tasks.length > 0 ? tasks.filter((task) => task.completed).length / tasks.length  * 100 : 0;

  const tasksCompleted = tasks.filter((task) => task.completedBy && task.completedBy.includes(user.uid)).length
  const groupsJoined = myGroups.length;
  const totalTasks = tasks.length;
  const groupsWithProgress = myGroups.map(group => {
    const totalTasks = tasks.filter((task) => task.groupId === group.id).length
    const taskCompletedCount = tasks.filter((task) => task.groupId === group.id && task.completedBy?.includes(userId)).length
    const percent = totalTasks > 0 ? Math.round((taskCompletedCount / totalTasks) * 100) : 0;

    return {
      ...group,
      totalTasks,
      taskCompletedCount,
      percent
    }
  });

  const calculateGroupActivity = () => {
    if (myGroups.length === 0) {
      return {mostActiveGroup: "N/A", leastActiveGroup: "N/A"}
    }

    const groupActivity = myGroups.map(group => {
      const groupTasks = tasks.filter((task) => task.groupId === group.id);

      if (groupTasks.length === 0) {
        return {
          groupName: group.name,
          lastTaskDate: null,
          taskCount: 0
        }
      }

      const mostRecentTask = groupTasks.reduce((latest, task) => {
        const taskDate = task.createdAt?.toDate ? task.createdAt.toDate() : new Date(task.createdAt)
        const latestDate = latest.createdAt?.toDate ? latest.createdAt.toDate() : new Date(latest.createdAt)
        return taskDate > latestDate ? task : latest;
      })

      const lastTaskDate = mostRecentTask.createdAt?.toDate ? mostRecentTask.createdAt.toDate() : new Date(mostRecentTask.createdAt);

      return {
        groupName: group.name,
        lastTaskDate: lastTaskDate,
        taskCount: groupTasks.length
      }

    })

    const sorted = groupActivity.sort((groupA, groupB) => {
      if (!groupA.lastTaskDate) return 1;
      if (!groupB.lastTaskDate) return -1;
      return groupB.lastTaskDate - groupA.lastTaskDate
    })

    const mostActive = sorted[0]?.groupName || "N/A";
    const leastActive = sorted[sorted.length - 1]?.groupName || "N/A";

    return { mostActiveGroup: mostActive, leastActiveGroup: leastActive };
  }
  const {mostActiveGroup, leastActiveGroup} = calculateGroupActivity()

  let handleLogout = async () => {
    try {
      await signOut(auth);
      console.log("Logged out Successfully");
    } catch (error) {
      Alert.alert("Error", error.message)
    }
  }

  let renderTask = (task, index, isLastInList) => {
    const difficultyStyleMap = {
      Easy: {
        backgroundColor: Colours.success + "55",
      },
      Medium: {
        backgroundColor: Colours.lightWarning + "55",
      },
      Hard: {
        backgroundColor: Colours.warning + "55",
      },

    };

    return (
      <View key={task.id} style={styles.taskCard}>
        <View style={[ styles.taskCardGroupIndicator,{ backgroundColor: myGroups.find((group) => group.id === task.groupId)?.colour || Colours.primary},]}/>
        
        <View style={[styles.taskCardInner, isLastInList && { borderBottomWidth: 0}]}>
          <View style={styles.taskLeft}>
            <Text style={styles.taskCardName}>{task.title}</Text>
            <Text style={styles.taskCardDate}>Due {task.dueDate}</Text>
          </View>

          <View style={[styles.taskDifficultyContainer, difficultyStyleMap[task.difficulty]]}>
            <Text style={styles.taskDifficultyText}>{task.difficulty}</Text>
          </View>
        </View>
        
      </View>
    )
  }

  let renderGroup = (group, index) => {
    const isLast = index === myGroups.length - 1;

    return (
      <TouchableOpacity key={group.id} style={styles.groupCard} onPress={() => {
        setShowRecentGroup(true); 
        setSelectedGroupId(group.id)}}>

        <View style={[styles.groupMain, {backgroundColor: group.colour}]}>
          <Ionicons name={group.icon} size={24} color={"#fff"}></Ionicons>
        </View>
        <Text style={styles.groupText}>{group.name}</Text>

      </TouchableOpacity>
    )
  }

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
        completedBy: [],
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

  const createGroup = async (name, type, icon, colour) => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter a group name!")
      return;
    }

    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    console.log("Creating initial group")

    const result = await createGroupDB (
      {
        name: name.trim() || "Untitled Group",
        code: code,
        colour: colour,
        icon: icon,
        type: type,
      },
      userId,
      userData?.name || "You"
    );

    console.log("Firebase log :", result)

    if (result.success) {
      console.log("Successfully created group with ID", result.groupId)
    }

    const newGroup = {
      id: result.groupId,
      name: name.trim(),
      membersList: [{ id: userId, name: userData?.name || "You", role: "admin", joinedAt: new Date() }],
      colour: colour,
      icon: icon,
      type: type,
      code: code,
      creatorId: userId,
    };

    setAllGroups([...allGroups, newGroup]);
    setMyGroups([...myGroups, newGroup]);

    setShowAddGroupModal(false);
    setGroupName("");
    setSelectedIcon("people-sharp");
    setGroupType("Public");
    setSelectedColour(Colours.groupColours[0]);
  }

  const leaveGroup = async (selectedGroupId) => {
    const groupLeaving = myGroups.find((group) => group.id === selectedGroupId)

    if (groupLeaving && groupLeaving.creatorId === user.uid) {
      showAlertText("You are the owner of this group. You must delete the group instead");
      return;
    }

    Alert.alert(
      "Leave Group",
      "Are you sure you want to leave this group?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Leave",
          style: "destructive",
          onPress: async () => {

            if (!selectedGroupId) return;

            const result = await leaveGroupDB(selectedGroupId,user.uid)

            if (result.success) {
              console.log("Successfully left group")
              setMyGroups(myGroups.filter((group) => group.id !== selectedGroupId));

              const groupToLeave = allGroups.find((group) => group.id === selectedGroupId);
              if (groupToLeave) {
                const updatedGroup = {
                  ...groupToLeave,
                  membersList: groupToLeave.membersList.filter(member => member.id !== userId),
                };

                setAllGroups(allGroups.map((g) =>g.id === selectedGroupId ? updatedGroup : g));
              }

              setShowRecentGroup(false);
              showAlertText("Successfully left the group");
            } else {
              Alert.alert("Error", result.error || "Failed to leave group")
            }

          },
        },
      ]
    );
  };

  const selectedGroup = groupsWithProgress.find(g => g.id === selectedGroupId);
  const upcomingTasks = tasks.filter((task) => !task.completed).sort((a, b) => {
    if (!a.dueDate && !b.dueDate) return 0;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;

    return new Date(a.dueDate) - new Date(b.dueDate)
  }).slice(0, 2)
  
  return (
    <View style={styles.entire}>
      <ScrollView style={{ width: "100%", height: "100%" }}>
        <View style={styles.container}>
          <Svg height={140} width="100%" viewBox="0 0 1440 320" preserveAspectRatio="xMidYMin slice" style={styles.svg}>
            <Path fill={Colours.primary} d="M0 0 H1440 C1300 50, 1100 300, 900 260 C700 200, 500 400, 300 260 C150 100, 75 100, 0 260 Z" />
          </Svg>

          <View style={styles.headerContent}>
              <View style={styles.headerText}>
                <Text style={styles.greeting} numberOfLines={1} ellipsizeMode="tail">Welcome back, {userData?.name || 'User'}</Text>
                <Text style={styles.overview}>Here's your overview</Text>
              </View>
              <TouchableOpacity onPress={() => handleLogout()}>
                <AntDesign name="logout" size={28} color={Colours.primaryText} style={styles.logout}></AntDesign>
              </TouchableOpacity>
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
                <Text style={styles.numTask}>{tasks.filter((task) => !task.completed).length}</Text>
                <Text style={styles.taskType}>Remaining</Text>
              </View>

              <View style={styles.taskTextContainer}>
                <Text style={styles.numTask}>{tasks.filter((task) => task.completed).length}</Text>
                <Text style={styles.taskType}>Completed</Text>
              </View>

            </View>

            <View style={styles.userGroups}>

              <View style={styles.headerRow}>
                <View style={styles.accentBarGroups} />
                <Text style={styles.todayTaskText}>
                  <FontAwesome name="group" size={18} color="#0F6EC6" /> Owned Groups
                </Text>
              </View>

              <View style={styles.taskTextContainer}>
                <Text style={styles.numTask}>{myGroups.filter((group) => group.creatorId === userId).length}</Text>
                <Text style={styles.taskType}>Active</Text>
              </View>

              <View style={styles.taskTextContainer}>
                <Text style={styles.numTask}>{totalMembers}</Text>
                <Text style={styles.taskType}>Members total</Text>
              </View>

            </View>

          </View>

          <View style={styles.userProgress}>
            <View style={styles.userProgressText}>
              <Text style={styles.progressTitle}>Your Progress This Week</Text>
              <Ionicons name="calendar-outline" size={24} color="#0F6EC6" />
            </View>

            <View style={styles.userProgressBar}>
                <View style={styles.userBackgroundBar}></View>
                <View style={[styles.userOvergroundBar, { width: `${progressPercentage}%`,}]}></View>
            </View>

            <View style={styles.userPercentage}>
              <Text style={styles.userPercentageNum}>{Math.round(progressPercentage)}%</Text>
              <Text style={styles.userPercentageText}>Tasks Completed</Text>
            </View>

          </View>

          <View style={styles.quickActions}>
            <Text style={styles.quickText}>Quick Actions</Text>

          <View style={styles.actionGroup}>

            <TouchableOpacity style={styles.actionCard} onPress={() => setShowAddTaskModal(true)}>
              <Ionicons name="add-circle" size={50} color="#0F6EC6" />
              <Text style={styles.AddText}>Add Task</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard} onPress={() => setShowAddGroupModal(true)}>
              <Ionicons name="people-circle" size={50} color="#0F6EC6" />
              <Text style={styles.AddText}>Create Group</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard} onPress={() => setShowStatsModal(true)}>
              <FontAwesome name="user-circle" size={50} color="#0F6EC6" />
              <Text style={styles.AddText}>View Stats</Text>
            </TouchableOpacity>

          </View>

          </View>

          <View style={styles.upcomingTasks}>
            <Text style={styles.upcomingText}>Upcoming Tasks</Text>

            <View style={styles.taskContainer}>
              {upcomingTasks.length > 0 ? (
                <>
                  {upcomingTasks.map((task, index, array) => renderTask(task, index, index === array.length-1))}
                  <TouchableOpacity onPress={() => router.push("/tasks")}>
                    <Text style={styles.viewAllTasks}>View All Tasks <Ionicons name="arrow-forward-outline" size={15} color="#0F6EC6" /></Text>
                  </TouchableOpacity>
                </>
              ) : (
                <Text style={{ width: "100%", textAlign: "center", color: Colours.grayText, marginVertical: 20 }}>
                  Create a task to get started
                </Text>
              )}
            </View>
          </View>

          <View style={styles.activeGroups}>
            <Text style={styles.quickText}>Active Groups</Text>

            <View style={styles.mainGroups}>
              {myGroups.slice(0, 2).map((group, index) => (renderGroup(group, index)))}
            </View>

          </View>

        </View>
      </ScrollView>

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

            <TouchableOpacity style={styles.addButton} onPress={() => addTask(taskName, hasDueDate ? taskDate : null)}>
              <Text style={styles.addText}>Add Task</Text>
              <AntDesign name="enter" color={Colours.primaryText} size={24} />
            </TouchableOpacity>

            {showDatePicker && ( <DateTimePicker value={taskDate} mode="date" display={Platform.OS === "ios" ? "spinner" : "default"} minimumDate={new Date()} onChange={(event, selectedDate) => {setShowDatePicker(false); if (selectedDate) setTaskDate(selectedDate);}}/>)}
          </View>
        </View>
      </Modal>

      <Modal transparent={true} animationType="fade" visible={showAddGroupModal} onRequestClose={() => setShowAddGroupModal(false)}>
        <View style={styles.popup}>

          <View style={styles.popupBox}>

            <TouchableOpacity style={styles.close} onPress={() => setShowAddGroupModal(false)}>
              <AntDesign name="close-circle" size={28} color="white"></AntDesign>
            </TouchableOpacity>

            <Text style={styles.popupText}>Create Group</Text>

            <Text style={styles.popupInfo}>Group Name*</Text>
            <TextInput style={styles.textInp} placeholder="Enter group name..." placeholderTextColor={Colours.secondaryText} value={groupName} onChangeText={setGroupName}/>

            <Text style={styles.popupInfo}>Group Icon</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginVertical: 10}}>
              {["book", "people-sharp", "school", "home", "fitness", "briefcase", "game-controller", "musical-notes"].map((iconName, index) => (
                <TouchableOpacity key={iconName} style={[styles.iconOption, selectedIcon === iconName && styles.iconSelected]} onPress={() => setSelectedIcon(iconName)}>
                  <Ionicons name={iconName} size={28} color={selectedIcon === iconName ? "white" : Colours.defaultText} />
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.popupInfo}>Group Type</Text>
            <View style={styles.pill}>
              <TouchableOpacity style={[ styles.leftButton, groupType === "Public" && styles.activeButton, ]} onPress={() => setGroupType("Public")}>
                <Text style={[ styles.pillText, groupType === "Public" && styles.activeText, ]}>Public</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[ styles.rightButton, groupType === "Private" && styles.activeButton, ]} onPress={() => setGroupType("Private")}>
                <Text style={[ styles.pillText, groupType === "Private" && styles.activeText, ]}>Private</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.popupInfo}>Group Colour</Text>
            <View style={styles.colorRow}>
              {Colours.groupColours.map((colour, index) => (
                <TouchableOpacity key={index} style={[styles.colorCircle, { backgroundColor: colour }, selectedColour === colour && styles.selectedColorBorder]} onPress={() => setSelectedColour(colour)} />
              ))}
            </View>

            <TouchableOpacity style={styles.addButton} onPress={() => createGroup(groupName, groupType, selectedIcon, selectedColour)}>
              <Text style={styles.addText}>Create Group</Text>
              <AntDesign name="enter" color="white" size={22}></AntDesign>
            </TouchableOpacity>

          </View>

        </View>
      </Modal>

      <Modal transparent={true} animationType="fade" visible={showStatsModal} onRequestClose={() => setShowStatsModal(false)}>
        <View style={styles.overlay}>
        <View style={styles.modalBox}>
          <TouchableOpacity style={styles.close} onPress={() => setShowStatsModal(false)}>
            <AntDesign name="close-circle" size={28} color="white" />
          </TouchableOpacity>

          <Text style={styles.modalTitle}>Your Stats</Text>

          <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
            
            <View style={styles.circularContainer}>
              <View style={styles.circleWrapper}>
                <Svg width={120} height={120} viewBox="0 0 100 100">
                  <G rotation="-90" origin="50,50">
                    <Circle cx="50" cy="50" r="45" stroke="#e0e0e0" strokeWidth="10" fill="none" />
                    <Circle cx="50" cy="50" r="45" stroke="#0F6EC6" strokeWidth="10" strokeDasharray={`${(tasksCompleted / totalTasks) * 283} 283`} strokeLinecap="round" fill="none"/>
                  </G>
                </Svg>
                <Text style={styles.circleText}>{Math.round((tasksCompleted / totalTasks) * 100)}%</Text>
              </View>
            </View>

            <View style={styles.cardRow}>
              <View style={[styles.statsCard, { backgroundColor: "#E3F2FD" }]}>
                <Ionicons name="checkmark-done-circle" size={24} color="#0F6EC6" />
                <Text style={styles.cardTitle}>Completed</Text>
                <Text style={styles.cardValue}>{tasksCompleted}</Text>
              </View>
              <View style={[styles.statsCard, { backgroundColor: "#FFF3E0" }]}>
                <Ionicons name="people-circle" size={24} color="#FFA726" />
                <Text style={styles.cardTitle}>Groups Joined</Text>
                <Text style={styles.cardValue}>{groupsJoined}</Text>
              </View>
            </View>

            <View style={styles.cardRow}>
              <View style={[styles.statsCard, { backgroundColor: "#E8F5E9" }]}>
                <Ionicons name="flame-outline" size={24} color="#43A047" />
                <Text style={styles.cardTitle}>Most Active</Text>
                <Text style={styles.cardValue}>{mostActiveGroup}</Text>
              </View>
              <View style={[styles.statsCard, { backgroundColor: "#FFEBEE" }]}>
                <Ionicons name="analytics-outline" size={24} color="#E53935" />
                <Text style={styles.cardTitle}>Least Active</Text>
                <Text style={styles.cardValue} numberOfLines={1}>{leastActiveGroup}</Text>
              </View>
            </View>

            <View style={{ marginTop: 20 }}>
              <Text style={styles.sectionTitle}>Tasks Completed Per Group</Text>
              {groupsWithProgress.map((group, idx) => (
                <View key={idx} style={{ marginBottom: 15 }}>
                  <Text style={{ fontWeight: "600", color: Colours.defaultText, marginBottom: 5 }}>
                    {group.name} - {group.percent}%
                  </Text>
                  <View style={styles.progressBarBackground}>
                    <View style={[styles.progressBarForeground, { width: `${group.percent}%` }]} />
                  </View>
                </View>
              ))}
            </View>

          </ScrollView>

        </View>
      </View>
      </Modal>

      <Modal transparent={true} animationType="fade" visible={showRecentGroup} onRequestClose={() => setShowRecentGroup(false)}>
          <View style={styles.overlay}>
            <View style={styles.modalBox}>

              <TouchableOpacity style={styles.close} onPress={() => setShowRecentGroup(false)}>
                <AntDesign name="close-circle" size={28} color="white" />
              </TouchableOpacity>

              {selectedGroup && (
                <>
                  <View style={{ alignItems: "center", marginBottom: 15 }}>
                    <View style={[styles.groupIconWrapper, { backgroundColor: selectedGroup.colour }]}>
                      <Ionicons name={selectedGroup.icon} size={24} color="#fff" />
                    </View>
                    <Text style={styles.groupName}>{selectedGroup.name}</Text>
                    <Text style={styles.groupMembersText}>
                      {selectedGroup.membersList.length} Members
                    </Text>
                  </View>

                  <View style={styles.statsRow}>
                    <View style={styles.statsCard}>
                      <Ionicons name="people-outline" size={24} color="#0F6EC6" />
                      <Text style={styles.statsCardTitle}>Active Members</Text>
                      <Text style={styles.statsCardValue}>{selectedGroup.membersList.length}</Text>
                    </View>
                    <View style={styles.statsCard}>
                      <Ionicons name="checkmark-done-circle-outline" size={24} color="#43A047" />
                      <Text style={styles.statsCardTitle}>Tasks Done</Text>
                      <Text style={styles.statsCardValue}>{selectedGroup.percent}%</Text>
                    </View>
                  </View>

                  <TouchableOpacity style={styles.leaveButton} onPress={() => leaveGroup(selectedGroup.id)}>
                    <Text style={styles.leaveButtonText}>Leave</Text>
                    <Ionicons name="log-out-outline" color="white" size={22} />
                  </TouchableOpacity>
                </>
              )}

            </View>
          </View>
      </Modal>

      <ToastAlert message={alertMessage} visible={alertVisible} onHide={() => setAlertVisible(false)}/>

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

  overview: {
    fontWeight: 400,
    fontSize: 18,
    color: "#d8d8d8ff"
  },

  svg: {
    position: "absolute"
  },

  // ENTIRE USER INFO SECTION + FIRST ROW

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
    elevation: 1.5,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 6,
    justifyContent: "center",
    alignItems: "flex-start",
  },

  todayTaskText: {
    fontWeight: "800",
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
    elevation: 1.5,
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

  // PROGRASS BAR SECTION (2ND ROW)

  userProgress: {
    marginTop: 15,
    backgroundColor: Colours.surface,
    padding: 20,
    borderRadius: 16,
    elevation: 1.5,
    justifyContent:"center",
    flexDirection: "column",
  },

  userProgressText: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  userProgressBar: {
    height: 12,
    width: "100%",
    borderRadius: 10,
  },

  userBackgroundBar: {
    backgroundColor: Colours.surfaceBorder,
    height: "100%",
    width: "100%",
    borderRadius: 10,
    position: "absolute",
  },

  userOvergroundBar: {
    backgroundColor: "#0F6EC6",
    height: "100%",
    borderRadius: 10,
    position: "absolute",
  },

  progressTitle: {
    fontWeight: "700",
    fontSize: 18,
    color: Colours.defaultText,
  },

  userPercentage: {
    flexDirection: "row",
    marginTop: 10,
    alignItems: "center",
    gap: 5,
  },

  userPercentageNum: {
    fontWeight: "600",
    fontSize: 18,
  },

  userPercentageText: {
    color: Colours.grayText,
  },

  // Quick Actions Section (3rd Row)

  quickActions: {
    marginTop: 15,
    flexDirection: "column",
  },

  quickText: {
    fontWeight: "700",
    fontSize: 18,
    color: Colours.defaultText,
    marginBottom: 10,
  },

  actionGroup: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  actionCard: {
    backgroundColor: Colours.surface,
    borderRadius: 16,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 8,
    width: (width - 80) / 3,
    height: 120,
    elevation: 0.75,
  },

  AddText: {
    fontWeight: "600",
    fontSize: 15,
    color: Colours.defaultText,
    textAlign: "center",
    marginTop: 5,
    flexShrink: 1,
  },

  // Upcoming Tasks Section (4th Row)

  upcomingTasks: {
    marginTop: 15,
    flexDirection: "column",
    paddingHorizontal: 0,
  },

  upcomingText: {
    fontWeight: "700",
    fontSize: 18,
    color: Colours.defaultText,
    marginBottom: 10,
  },

  taskCardGroupIndicator: {
    width: 4,
    borderRadius: 2,
    marginRight: 12,
    backgroundColor: Colours.primary,
    alignSelf: "stretch",
  },

  taskContainer: {
    flexDirection: "column",
    elevation: 0.75,
    overflow: "hidden",
    borderRadius: 16,
    backgroundColor: Colours.surface,
  },

  viewAllTasks: {
    alignSelf: "flex-end",
    marginRight: 15,
    marginBottom: 10,
    color: "#0F6EC6",
    fontWeight: "600",
  },

  taskCard: { 
    backgroundColor: Colours.surface, 
    paddingHorizontal: 20,
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "center",
    marginTop: 10,
  },
  
  taskCardInner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 0.75,
    borderBottomColor: Colours.grayText + "33",
    paddingBottom: 10,
  },

  taskCardWithDivider: {
    borderBottomWidth: 1,
    borderColor: Colours.grayText + "33",
    alignSelf: "center",
    width: "75%",
  },

  taskLeft: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "center",
  },

  taskCardName: {
    fontWeight: "700",
    fontSize: 16,
    color: Colours.defaultText,
    marginBottom: 4,
  },

  taskCardDescriptiond: {
    fontSize: 14,
    color: Colours.grayText,
  },

  taskDifficultyContainer: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 75,
  },

  taskDifficultyText: {
    color: Colours.defaultText,
    fontWeight: "600",
    fontSize: 14,
  },

  // Active Groups Section (5th Row)

  activeGroups: {
    marginTop: 15,
  },

  mainGroups: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  groupCard: {
    backgroundColor: Colours.surface,
    borderRadius: 16,
    flexDirection: "column",
    paddingVertical: 20,
    paddingHorizontal: 15,
    width: (width - 80) / 2,
    justifyContent: "center",
    alignItems: "center",
    elevation: 0.75,
  },

  groupMain: {
    width: 50,
    height: 50,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },

  groupText: {
    fontWeight: "600",
    fontSize: 16,
    color: Colours.defaultText,
  },

  // POPUP STYLES
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

  // Group MODAL

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

  leftButton: {
    paddingHorizontal: 25,
    paddingVertical: 10,
    borderTopLeftRadius: 25,
    borderBottomLeftRadius: 25,
    backgroundColor: "#e0e0e0",
  },

  rightButton: {
    paddingHorizontal: 25,
    paddingVertical: 10,
    borderTopRightRadius: 25,
    borderBottomRightRadius: 25,
    backgroundColor: "#e0e0e0",
  },

  pillText: {
    fontWeight: "600",
    color: Colours.defaultText,
  },

  activeButton: {
    backgroundColor: "#0F6EC6",
  },

  activeText: {
    color: "white",
  },

  colorRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 10,
  },

  colorCircle: {
    width: 35,
    height: 35,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "transparent",
  },

  selectedColorBorder: {
    borderColor: "#0F6EC6",
    transform: [{ scale: 1.1 }],
    elevation: 3,
  },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },

  modalBox: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: Colours.surface,
    borderRadius: 20,
    padding: 20,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    position: "relative",
  },

  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: Colours.defaultText,
    textAlign: "center",
    marginBottom: 20,
  },

  circularContainer: {
    alignItems: "center",
    marginBottom: 20,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colours.defaultText,
    marginBottom: 10,
  },

  circleWrapper: {
    width: 120,
    height: 120,
    justifyContent: "center",
    alignItems: "center",
  },

  circleText: {
    position: "absolute",
    fontSize: 20,
    fontWeight: "700",
    color: Colours.defaultText,
  },

  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },

  statsCard: {
    flex: 1,
    padding: 15,
    borderRadius: 16,
    alignItems: "center",
    marginHorizontal: 5,
    elevation: 2,
  },

  cardTitle: {
    fontWeight: "600",
    fontSize: 14,
    marginTop: 5,
    color: Colours.defaultText,
    textAlign: "center",
  },

  cardValue: {
    fontWeight: "700",
    fontSize: 18,
    marginTop: 5,
    color: Colours.defaultText,
  },

  progressBarBackground: {
    width: "100%",
    height: 12,
    borderRadius: 6,
    backgroundColor: "#e0e0e0",
    overflow: "hidden",
  },

  progressBarForeground: {
    height: 12,
    backgroundColor: "#0F6EC6",
    borderRadius: 6,
  },
  
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },

  modalBox: {
    width: "100%",
    maxWidth: 350,
    backgroundColor: "#fff",
    borderRadius: 25,
    paddingVertical: 25,
    paddingHorizontal: 20,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    position: "relative",
  },

  groupIconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  groupName: {
    fontWeight: "800",
    fontSize: 20,
    color: "#111",
    textAlign: "center",
    marginBottom: 5,
  },

  groupMembersText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 12,
  },

  statsCard: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 18,
    alignItems: "center",
    marginHorizontal: 5,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },

  statsCardTitle: {
    fontWeight: "600",
    fontSize: 14,
    color: "#333",
    marginTop: 5,
    textAlign: "center",
  },

  statsCardValue: {
    fontWeight: "700",
    fontSize: 18,
    marginTop: 5,
    color: "#111",
  },

  leaveButton: {
    marginTop: 15,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E53935",
    paddingVertical: 14,
    borderRadius: 14,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },

  leaveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginRight: 8,
  },


});