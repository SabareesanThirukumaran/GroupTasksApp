import {View,Text,StyleSheet,TouchableOpacity,FlatList,Modal,TextInput,Dimensions,Alert, Platform} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import * as Clipboard from "expo-clipboard";
import { ScrollView, Switch } from "react-native-gesture-handler";
import { Color as Colours } from "../../../constants/colors";
import { AntDesign, Ionicons, FontAwesome } from "@expo/vector-icons";
import { useEffect, useState, useCallback } from "react";
import Fuse from "fuse.js";
import DateTimePicker from "@react-native-community/datetimepicker";
import ToastAlert from "../../../toastAlert";
import { auth } from "../../../firebase/config";
import {useAuth} from "../../../context/AuthContext";
import { ActivityIndicator } from "react-native";
import {
  createGroup as createGroupDB,
  createTask as createTaskDB,
  leaveGroup as leaveGroupDB,
  joinGroup as joinGroupDB,
  kickMember as kickMemberDB,
  deleteGroup,
  changeSettings,
  deleteTask as deleteTaskDB
} from "../../../firebase/firebaseService";
const width = Dimensions.get("window").width;
import {useData} from "../../../context/DataContext";
import LoadingScreen from "../../../components/loadingScreen";

export default function GroupScreen() {
  const {user, userData, loading: authLoading} = useAuth();
  const { tasks, setTasks, allGroups, setAllGroups, myGroups, setMyGroups, loading: dataLoading, loadingProgress } = useData();

  const [selectedGroup, setSelectedGroup] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const [showAddGroupModal, setShowAddGroupModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("people-sharp");
  const [groupType, setGroupType] = useState("Public");
  const [selectedColour, setSelectedColour] = useState(Colours.groupColours[0]);

  const [showJoinGroupModal, setShowJoinGroupModal] = useState(false);
  const [groupIDJoin, setGroupIDJoin] = useState("");

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

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [editedGroupName, setEditedGroupName] = useState(selectedGroup?.name || "");
  const [selectedIconSet, setSelectedIconSet] = useState(selectedGroup?.icon || "people");
  const [selectedColourSet, setSelectedColourSet] = useState(selectedGroup?.colour || Colours.groupColours[0]);
  const [selectedTypeSet, setSelectedTypeSet] = useState(selectedColour?.type || "Public")

  const [showTasksModal, setShowTasksModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const [groupsRem, setGroupsRem] = useState([]);
  const [groupSearchValue, setGroupSearchValue] = useState("");

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const showAlertText = (message) => {setAlertMessage(message); setAlertVisible(true);}

  const groupFuse = new Fuse(myGroups,{keys: ["name"]})
  const onGroupChangeSearch = useCallback((newValue) => {
    setGroupSearchValue(newValue);
    if (!newValue || newValue.trim() === "") {
      setGroupsRem(myGroups);
      return;
    }
    let fuseSearchResults = groupFuse.search(newValue);
    setGroupsRem(fuseSearchResults.map(({item}) => item));
  }, [myGroups]);

  useEffect(() => {setGroupsRem(myGroups)}, [myGroups]);

  if (!user || !userData) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <Text style={{ marginTop: 10, color: "#666" }}>Please log in</Text>
      </View>
    );
  }

  const userId = user.uid;
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
  const selectedGroupWithProgress = selectedGroup 
    ? groupsWithProgress.find(g => g.id === selectedGroup.id) 
    : null;

  const getGroupMembers = (group) => {
    return group.membersList.map(member => member.name);
  }

  const handleKickMember = async (memberId) => {

    Alert.alert(
      "Kick Member",
      "Are you sure you want to remove this member?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Kick",
          style: "destructive",
          onPress: async () => {
            const result = await kickMemberDB(selectedGroup.id, memberId)

            if (result.success) {
              const updatedGroup = {
                ...selectedGroup,
                membersList: selectedGroup.membersList.filter(m => m.id !== memberId),
              };
              updateGroupState(updatedGroup);
              showAlertText("Member removed successfully")
              setShowSettingsModal(false)
            } else {
              showAlertText("Error", result.error || "Failed to remove member")
            }


          },
        },
      ]
    );
  }

  const handleDeleteGroup = async () => {
    Alert.alert(
      "Delete Group",
      "This action cannot be undone. Delete this group?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const result = await deleteGroup(selectedGroup.id)

            if (result.success) {
              setMyGroups(myGroups.filter((group) => group.id !== selectedGroup.id));
              setAllGroups(allGroups.filter((group) => group.id !== selectedGroup.id));
              setTasks(tasks.filter(task => task.groupId !== selectedGroup.id));
              setShowSettingsModal(false);
              setModalVisible(false);
              setAlertMessage("Group deleted successfully")
            } else {
              setAlertMessage("Error", result.error || "Failed to delete group")
            }
          },
        },
      ]
    );
  }

  const handleSaveGroupSettings = async () => {

    const updates = {name: editedGroupName, icon: selectedIconSet, colour: selectedColourSet, type: selectedTypeSet}
    const result = await changeSettings(selectedGroup.id, updates)

    if (result.success) {
      const updatedGroup = {
        ...selectedGroup,
        ...updates
      };
      updateGroupState(updatedGroup);
      setShowSettingsModal(false);
      showAlertText("Settings changed successfully")
    } else {
      showAlertText('Error', result.error || "Failed to update group")
    }

  }

  const updateGroupState = (updatedGroup) => {
    setMyGroups(prev =>
      prev.map(g => g.id === updatedGroup.id ? updatedGroup : g)
    );
    setAllGroups(prev =>
      prev.map(g => g.id === updatedGroup.id ? updatedGroup : g)
    );
    setSelectedGroup(updatedGroup);
  }

  const groupOpen = (group) => {
    setSelectedGroup(group)
    setModalVisible(true);
  }

  const renderGroup = ({item}) => {
    return (<TouchableOpacity style={styles.groupCard} onPress={() => groupOpen(item)}>
      <View style={styles.frontText}>
        <View style={[styles.groupIcon, { backgroundColor: item.colour, borderRadius: 20 }]}>
          <Ionicons name={item.icon} color={Colours.primaryText} size={30}></Ionicons>
        </View>

        <View style={styles.allText}>
          <View style={styles.topRow}>
            <Text style={styles.groupName}>{item.name} {item.type === "Private" ? <Ionicons name="lock-closed" size={15} color="#0F6EC6" /> : ""}</Text>
          </View>
          <Text style={styles.metaText}>{item.membersList.length} Members</Text>
        </View>
      </View>

      {item.creatorId === userId && (
        <TouchableOpacity style={styles.settings} onPress={(e) => {
          e.stopPropagation();
          openSettings(item);
        }}>
          <Ionicons name="settings-sharp" color={Colours.primary} size={20}></Ionicons>
        </TouchableOpacity>
      )}

    </TouchableOpacity>)
  }

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

  const joinGroup = async (inviteCode) => {
    const trimmedCode = inviteCode.trim().toUpperCase();

    const alreadyJoined = myGroups?.some(group => group?.code === trimmedCode);
    if (alreadyJoined) {
      showAlertText("You are already a member of this group");
      console.log("You are already a member of this group")
      return;
    }

    const findGroup = allGroups.find((group) => group.code === trimmedCode);

    if (!findGroup) {
      showAlertText("No Group Found");
      console.log("No group found")
      return;
    }

    if (findGroup.type === "Private") {
      showAlertText("This is a private group. Noone other than the owner is allowed.");
      console.log("This is a private group")
      return;
    }

    const result = await joinGroupDB(trimmedCode, userId, userData?.name || "You")

    if (result.success) {
      showAlertText("Successfully joined group")
      const updatedGroup = { ...findGroup, membersList: [...findGroup.membersList, { id: userId, name: userData?.name, role:"member", joinedAt: new Date() }] };
      const updatedAllGroups = allGroups.map((group) => group.id === findGroup.id ? updatedGroup : group);

      setMyGroups([...myGroups, updatedGroup]);
      setAllGroups(updatedAllGroups);
      showAlertText("Successfully joined the group!");
      console.log("Successfully joined")
      setShowJoinGroupModal(false);
      setGroupIDJoin("");
      
    } else {
      showAlertText(result.error)
      console.log(result.error)
    }

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

              setModalVisible(false);
              showAlertText("Successfully left the group");
            } else {
              Alert.alert("Error", result.error || "Failed to leave group")
            }

          },
        },
      ]
    );
  }

  const copyCode = (code) => {
    Clipboard.setStringAsync(code);
    showAlertText("Invite code copied!");
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
  }

  const openSettings = (group) => {
    setSelectedGroup(group);
    setEditedGroupName(group.name);
    setSelectedIconSet(group.icon);
    setSelectedColourSet(group.colour);
    setShowSettingsModal(true);
  }

  const openTask = (task) => {
    setSelectedTask(task)
    setShowTasksModal(true)
  }

  const handleDeleteTask = async (taskId) => {
    Alert.alert('Delete Task', 'Are you sure you want to delete this task ?',
      [
        {text: "Cancel", style: "cancel"},
        {text: "Delete", style: "destructive",
          onPress: async () => {
            const result = await deleteTaskDB(taskId);

            if (result.success) {
              setTasks(tasks.filter(task => task.id !== taskId));
              setShowTasksModal(false);
              setSelectedTask(null)
              showAlertText("Task deleted successfully");
            } else {
              showAlertText("Failed to delete task");
            }
          }
        }
      ]
    )
  }

  return (
    <View style={styles.entire}>
      <FlatList data={groupsRem} renderItem={renderGroup} keyExtractor={(item) => item.id.toString()} contentContainerStyle={{paddingBottom: 20}} ListHeaderComponent={
        <View>

          <View style={styles.topHeader}>
            <Ionicons name="people-circle-outline" color={Colours.primary} size={40}></Ionicons>
            <Text style={styles.topHeaderText}>Groups</Text>
          </View>

          <View style={styles.searchItems}>
            <View style={styles.tasksSearchContainer}>
              <FontAwesome name="search" size={18} color={Colours.defaultText} />
              <TextInput placeholder="Find a Group" style={{fontSize: 16, flex: 1, paddingVertical: 0}} onChangeText={onGroupChangeSearch}/>
            </View>

            <TouchableOpacity style={styles.createGroup} onPress={() => setShowAddGroupModal(true)}>
              <Ionicons name="add-sharp" size={40} color={Colours.primaryText}></Ionicons>
            </TouchableOpacity>
          </View>

          <View style={styles.groupsArea}>
              <Text style={styles.groupsText}>Your Groups</Text>
          </View>

        </View>
      } ListEmptyComponent={<Text style={{ width: "100%", textAlign: "center"}}>No Groups. Join / Create a group !</Text>}/>

      <TouchableOpacity onPress={() => setShowJoinGroupModal(true)} style={styles.joinGroupButton}>
        <Text style={[styles.joinGroupText]}>Join Group</Text>
        <AntDesign name="usergroup-add" size={24} color="white" />
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: Colours.background }}>
          {selectedGroupWithProgress  && (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.modalScrollContainer, {paddingBottom: 50}]}>

              <View style={styles.modalHeader}>

                <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                  <Ionicons name="close" size={28} color={Colours.primary} />
                </TouchableOpacity>

                <View style={{ alignItems: "center" }}>
                  <Ionicons name={selectedGroupWithProgress.icon} size={50} color="#fff" style={[{ marginBottom: 6 }, {backgroundColor: selectedGroupWithProgress.colour}, {padding: 10}, {borderRadius: 16}]}/>
                  <Text style={styles.modalHeaderText}>{selectedGroupWithProgress.name}</Text>
                  <Text style={styles.modalSubHeaderText}>{selectedGroupWithProgress.membersList.length} Members</Text>
                  <TouchableOpacity onPress={() => copyCode(selectedGroupWithProgress.code)}>
                    <Text style={{color: Colours.primary}}>Invite Code: {selectedGroupWithProgress.code}</Text>
                  </TouchableOpacity>
                </View>

              </View>

              <View style={styles.progressCard}>
                <Text style={styles.progressTitle}>Overall Progress</Text>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${selectedGroupWithProgress.percent}%` }]} />
                </View>
                <Text style={styles.progressPercent}>{selectedGroupWithProgress.percent}% Completed</Text>
              </View>

              <View style={styles.modalTasks}>
                <View style={[styles.sectionHeader, {flexDirection: "row", alignItems: "center", marginBottom: 15, gap: 10}]}>
                  <Ionicons name="checkbox-outline" size={22} color={Colours.primary} />
                  <Text style={styles.modalTaskRemaining}>Tasks</Text>
                </View>

                <View style={{paddingBottom: 80}}>
                  <FlatList data={tasks.filter((task => task.groupId === selectedGroupWithProgress.id))} keyExtractor={(item, index) => index.toString()} scrollEnabled={false} renderItem={({ item }) => (
                    <TouchableOpacity style={[{ flexDirection: 'row', alignItems: 'center' }, styles.taskItem, item.completed && styles.taskItemCompleted ]} onPress={() => openTask(item)}>
                      <Text style={[styles.taskText, item.completed && styles.taskCompletedText]}>{item.title}</Text>
                      <View style={[styles.taskDifficulty, { backgroundColor: item.difficulty === 'Easy' ? 'green' : item.difficulty === 'Medium' ? 'orange' : 'red' }]} />
                    </TouchableOpacity>
                  )}/>
                </View>

                <TouchableOpacity
                  style={styles.addTaskButton}
                  onPress={() => {
                    setSelectedGroupT(selectedGroupWithProgress);
                    setShowAddTaskModal(true);
                  }}
                >
                  <Ionicons name="add" size={26} color={Colours.primaryText} />
                </TouchableOpacity>

              </View>

              <View style={styles.modalUsers}>
                <View style={[styles.sectionHeader, {flexDirection: "row", alignItems: "center", marginBottom: 15, gap: 10}]}>
                  <Ionicons name="people-outline" size={22} color={Colours.primary} />
                  <Text style={styles.modalSectionTitle}>Group Members</Text>
                </View>

                <FlatList data={getGroupMembers(selectedGroupWithProgress)} horizontal showsHorizontalScrollIndicator={false} keyExtractor={(item, index) => index.toString()} renderItem={({ item, index }) => (
                    <View style={styles.memberAvatar}>
                      <Ionicons name="person-circle" size={50} color={index % 2 === 0 ? Colours.primary : "#0b76e8"}/>
                      <Text style={styles.memberText}>{item}</Text>
                    </View>
                  )}
                />
              </View>

              <TouchableOpacity style={styles.leaveGroup} onPress={() => leaveGroup(selectedGroupWithProgress.id)}>
                  <Text style={styles.leaveGroupText}>Leave Group</Text>
              </TouchableOpacity>

            </ScrollView>
          )}
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

      <Modal visible={showJoinGroupModal} animationType="fade" transparent={true} onRequestClose={() => setShowJoinGroupModal(false)}>
        <View style={styles.popup}>

          <View style={styles.JoinpopupBox}>
            <TouchableOpacity style={styles.joinClose} onPress={() => setShowJoinGroupModal(false)}>
              <AntDesign name="close-circle" size={28} color="white"></AntDesign>
            </TouchableOpacity>

            <Text style={styles.joinTitle}>Join Group</Text>
            <Text style={styles.joinSubtitle}>Enter your group code below</Text>

            <TextInput style={styles.joinInput} placeholder="e.g. AB12CD34" placeholderTextColor="#dcd3ff" value={groupIDJoin} onChangeText={setGroupIDJoin}/>

            <TouchableOpacity style={styles.joinButton} onPress={() => joinGroup(groupIDJoin)}>
              <Text style={styles.joinButtonText}>Join Now</Text>
            </TouchableOpacity>
          </View>

        </View>
      </Modal>

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

            <Text style={styles.popupInfo}>Description</Text>
            <TextInput style={[styles.textInp, { height: 80, textAlignVertical: "top" }]} placeholder="Add more details..." placeholderTextColor={Colours.textSecondary} value={taskDescription} onChangeText={setTaskDescription}multiline/>

            <TouchableOpacity style={styles.addButton} onPress={() => addTask(taskName, hasDueDate ? taskDate : null, difficulty, selectedGroupT, taskDescription)}>
              <Text style={styles.addText}>Add Task</Text>
              <AntDesign name="enter" color={Colours.primaryText} size={24} />
            </TouchableOpacity>

            {showDatePicker && ( <DateTimePicker value={taskDate} mode="date" display={Platform.OS === "ios" ? "spinner" : "default"} onChange={(event, selectedDate) => {setShowDatePicker(false); if (selectedDate) setTaskDate(selectedDate);}}/>)}
            {showTimePicker && ( <DateTimePicker value={taskTime} mode="time" is24Hour={true} display={Platform.OS === "ios" ? "spinner" : "default"} onChange={(event, selectedTime) => { setShowTimePicker(false); if (selectedTime) setTaskTime(selectedTime); }} />)}
          </View>
        </View>
      </Modal>

      <Modal visible={showSettingsModal} animationType="fade" transparent={true} onRequestClose={() => setShowSettingsModal(false)}>
        <View style={styles.popup}>
          <View style={styles.popupBox}>

            <TouchableOpacity style={styles.close} onPress={() => setShowSettingsModal(false)}>
              <AntDesign name="close-circle" size={26} color="white" />
            </TouchableOpacity>

            <Text style={styles.popupText}>Group Settings</Text>

            <Text style={styles.popupInfo}>Group Name</Text>
            <TextInput style={styles.textInp} placeholder="Enter new group name" placeholderTextColor="#aaa" value={editedGroupName} onChangeText={setEditedGroupName}/>

            <Text style={styles.popupInfo}>Change Group Icon</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
              {["book", "people-sharp", "school", "home", "fitness", "briefcase", "game-controller", "musical-notes"].map((icon) => (
                <TouchableOpacity key={icon} style={[ styles.iconOption, {backgroundColor: selectedColourSet, opacity: selectedIconSet === icon ? 1 : 0.6, borderWidth: selectedIconSet === icon ? 2 : 0, borderColor: "#fff"}]} onPress={() => setSelectedIconSet(icon)}>
                  <Ionicons name={icon} size={28} color="white" />
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.popupInfo}>Group Type</Text>
            <View style={styles.pill}>
              <TouchableOpacity style={[ styles.leftButton, selectedTypeSet === "Public" && styles.activeButton, ]} onPress={() => setSelectedTypeSet("Public")}>
                <Text style={[ styles.pillText, groupType === "Public" && styles.activeText, ]}>Public</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[ styles.rightButton, selectedTypeSet === "Private" && styles.activeButton, ]} onPress={() => setSelectedTypeSet("Private")}>
                <Text style={[ styles.pillText, groupType === "Private" && styles.activeText, ]}>Private</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.popupInfo}>Change Group Colour</Text>
            <View style={styles.colorRow}>
              {Colours.groupColours.map((color) => (
                <TouchableOpacity key={color} style={[ styles.colorCircle, { backgroundColor: color }, selectedColourSet === color && styles.selectedColorBorder,]}onPress={() => setSelectedColourSet(color)}/>
              ))}
            </View>

            <Text style={styles.popupInfo}>Kick a Member</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
              {selectedGroup?.membersList?.map((member) => (
                <View key={member.id} style={styles.memberAvatar}>
                  <TouchableOpacity onPress={() => handleKickMember(member.id)} style={{ alignItems: "center" }} disabled={member.id === userId}>
                    <FontAwesome name="user-circle" size={45} color="#0F6EC6" />
                    <Text style={styles.memberText}>{member.name}</Text>
                    {member.id !== userId && (<Text style={{ fontSize: 11, color: "red" }}>Kick</Text>)}
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.addButton} onPress={handleSaveGroupSettings}>
              <Text style={styles.addText}>Save Changes</Text>
              <Ionicons name="checkmark-circle" size={20} color="white" />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.addButton, { backgroundColor: "#ff4444" }]} onPress={handleDeleteGroup}>
              <Text style={styles.addText}>Delete Group</Text>
              <Ionicons name="trash-outline" size={20} color="white" />
            </TouchableOpacity>

          </View>
        </View>
      </Modal>

      <Modal visible={showTasksModal} animationType="fade" transparent={true} onRequestClose={() => setShowTasksModal(false)}>

          <View style={styles.modalOverlay}>
            <View style={styles.taskDetailsModal}>

              <TouchableOpacity style={styles.close} onPress={() => setShowTasksModal(false)}>
                <AntDesign name="close-circle" size={26} color="white" />
              </TouchableOpacity>

              {selectedTask && (
                <>
                  <Text style={styles.modalTitle}>{selectedTask.title}</Text>

                  <View style={{alignSelf: "center", paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, backgroundColor: selectedTask.difficulty === "Easy" ? "#43a04720" : selectedTask.difficulty === "Medium" ? "#f57c0020" : "#e5393520", marginBottom: 20}}>
                    <Text style={{fontSize: 14, fontWeight: "700", color: selectedTask.difficulty === 'Easy' ? '#43a047' : selectedTask.difficulty === 'Medium' ? '#f57c00' :'#e53935',}}>
                      {selectedTask.difficulty}
                    </Text>
                  </View>

                  <View style={styles.modalRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                      <Ionicons name="document-text-outline" size={18} color={Colours.primary} />
                      <Text style={[styles.modalLabel, { marginLeft: 6, marginBottom: 0 }]}>Description</Text>
                    </View>
                    <Text style={styles.modalValue}>{selectedTask.description || "No description provided."}</Text>
                  </View>

                  <View style={styles.modalRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                      <Ionicons name="calendar-outline" size={18} color={Colours.primary} />
                      <Text style={[styles.modalLabel, { marginLeft: 6, marginBottom: 0 }]}>Due Date</Text>
                    </View>
                    <Text style={styles.modalValue}>{selectedTask.dueDate || "No due date set"}</Text>
                  </View>

                  <View style={styles.modalRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                      <Ionicons name="person-outline" size={18} color={Colours.primary} />
                      <Text style={[styles.modalLabel, { marginLeft: 6, marginBottom: 0 }]}>Created By</Text>
                    </View>
                    <Text style={styles.modalValue}>{selectedGroupWithProgress?.membersList?.find(m => m.id === selectedTask.createdBy)?.name || "Unknown"}</Text>
                  </View>

                  <View style={styles.modalRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                      <Ionicons name="checkmark-done-circle-outline" size={18} color={Colours.primary} />
                      <Text style={[styles.modalLabel, { marginLeft: 6, marginBottom: 0 }]}>Completed By</Text>
                    </View>

                    {selectedTask.completedBy && selectedTask.completedBy.length > 0 ? (
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 5 }}>
                        {selectedTask.completedBy.map((memberId, index) => {
                          const member = selectedGroupWithProgress?.membersList?.find(m => m.id === memberId);
                          return (
                            <View key={index} style={styles.memberAvatar}>
                              <Ionicons name="person-circle" size={45} color={index % 2 === 0 ? Colours.primary : "#0b76e8"} />
                              <Text style={[styles.memberText, { fontSize: 12 }]}>{member?.name || "Unknown"}</Text>
                            </View>
                          );
                        })}
                      </ScrollView>
                    ) : (
                      <View style={{backgroundColor: '#f5f5f5',padding: 15,borderRadius: 10,alignItems: 'center',marginTop: 5,}}>
                        <Ionicons name="hourglass-outline" size={24} color={Colours.grayText} />
                        <Text style={{color: Colours.grayText,fontSize: 14,marginTop: 6,textAlign: 'center',}}>No one has completed this task yet</Text>
                      </View>
                    )}


                    <View style={{marginTop: 20,paddingVertical: 12,borderRadius: 12,backgroundColor: selectedTask.completed ? '#43a04715' : '#f57c0015',alignItems: 'center',}}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name={selectedTask.completed ? "checkmark-circle" : "time-outline"} size={20} color={selectedTask.completed ? "#43a047" : "#f57c00"} />
                        <Text style={{marginLeft: 8,fontSize: 15,fontWeight: '700',color: selectedTask.completed ? "#43a047" : "#f57c00",}}>{selectedTask.completed ? "Completed" : "In Progress"}</Text>
                      </View>
                    </View>
                    
                  </View>

                  {selectedGroupWithProgress?.membersList?.find(m => m.id === userId)?.role === "admin" && (
                    <TouchableOpacity style={styles.deleteTask} onPress={() => handleDeleteTask(selectedTask.id)}>
                      <Text style={styles.deleteTaskText}>Delete Task</Text>
                      <Ionicons name="trash-outline" size={20} color="white" />
                    </TouchableOpacity>
                  )}
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
  // ---------------------
  //   SCREEN LAYOUT
  // ---------------------
  entire: {
    flex: 1,
    backgroundColor: Colours.background,
  },

  // ---------------------
  //   HEADER
  // ---------------------
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomColor: "#ffffff10",
    borderBottomWidth: 1,
    backgroundColor: Colours.surface,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 4,
  },

  topHeaderText: {
    color: Colours.defaultText,
    fontWeight: "700",
    fontSize: 26,
    marginLeft: 10,
  },

  // ---------------------
  //   SEARCH + CREATE
  // ---------------------
  searchItems: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 12,
  },

  tasksSearchContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    backgroundColor: Colours.primaryText,
    borderRadius: 30,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 10,
  },

  createGroup: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#0F6EC6",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colours.primary,
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 5,
  },

  // ---------------------
  //   GROUP CARDS
  // ---------------------
  groupsText: {
    fontSize: 24,
    fontWeight: "700",
    marginLeft: 25,
    marginTop: 25,
    marginBottom: 10,
    color: Colours.defaultText,
  },

  groupCard: {
    alignSelf: "center",
    width: width * 0.9,
    backgroundColor: Colours.primaryText,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    marginBottom: 15,
    shadowColor: Colours.primary,
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },

  frontText: {
    flexDirection: "row",
    alignItems: "center",
  },

  groupIcon: {
    width: 55,
    height: 55,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  groupName: {
    fontSize: 18,
    fontWeight: "700",
    color: Colours.defaultText,
  },

  metaText: {
    fontSize: 14,
    color: Colours.grayText,
    marginTop: 3,
  },

  settings: {
    paddingLeft: 10,
  },

  // ---------------------
  //   MODAL BASE
  // ---------------------
  modalScrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },

  closeButton: {
    position: "absolute",
    top: 15,
    right: 15,
    backgroundColor: "#ffffff40",
    borderRadius: 20,
    padding: 6,
    zIndex: 10,
  },

  modalHeader: {
    backgroundColor: Colours.primaryText,
    borderRadius: 25,
    paddingVertical: 35,
    marginBottom: 25,
    alignItems: "center",
    shadowColor: Colours.primary,
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },

  modalHeaderText: {
    fontSize: 26,
    fontWeight: "800",
    color: Colours.defaultText,
  },

  modalSubHeaderText: {
    fontSize: 15,
    color: Colours.grayText,
    marginTop: 5,
  },

  // ---------------------
  //   PROGRESS CARD
  // ---------------------
  progressCard: {
    backgroundColor: Colours.primaryText,
    borderRadius: 20,
    padding: 20,
    marginBottom: 25,
    shadowColor: Colours.primary,
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },

  progressTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colours.defaultText,
    marginBottom: 12,
  },

  progressBar: {
    height: 14,
    backgroundColor: "#e0e7ff",
    borderRadius: 12,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    borderRadius: 12,
    backgroundColor: "#0F6EC6",
    justifyContent: "center",
    alignItems: "flex-end",
    paddingRight: 8,
  },

  progressPercent: {
    marginTop: 10,
    fontSize: 14,
    color: Colours.grayText,
  },

  // ---------------------
  //   TASKS SECTION
  // ---------------------
  modalTasks: {
    backgroundColor: Colours.primaryText,
    borderRadius: 20,
    padding: 20,
    marginBottom: 25,
  },

  modalTaskRemaining: {
    fontSize: 20,
    fontWeight: "700",
    color: Colours.defaultText,
  },

  taskItem: {
    backgroundColor: "#eef5ff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  taskDifficulty: {
    width: 50,
    height: 10,
    minWidth: 50,
    borderRadius: 5,
    marginLeft: 10,
  },

  taskItemCompleted: {
    backgroundColor: "#e9f3ff",
    borderColor: "#c5e0ff",
  },

  taskText: {
    fontSize: 16,
    color: Colours.defaultText,
  },

  taskCompletedText: {
    textDecorationLine: "line-through",
    color: "#7aa5e0",
  },

  addTaskContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    backgroundColor: "#eef5ff",
    borderRadius: 50,
    paddingHorizontal: 15,
  },

  addTaskInput: {
    flex: 1,
    height: 40,
    color: Colours.defaultText,
  },

  addTaskButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    zIndex: 10,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#0F6EC6",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 6,
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

  // ---------------------
  //   MEMBERS SECTION
  // ---------------------
  modalUsers: {
    backgroundColor: Colours.primaryText,
    borderRadius: 20,
    padding: 20,
  },

  modalSectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colours.defaultText,
  },

  memberAvatar: {
    alignItems: "center",
    marginRight: 20,
  },

  memberText: {
    fontSize: 14,
    marginTop: 4,
    color: Colours.defaultText,
  },

  // ---------------------
  //   LEAVE GROUP
  // ---------------------
  leaveGroup: {
    alignItems: "center",
    marginTop: 30,
    backgroundColor: Colours.failure + "CD",
    padding: 15,
    borderRadius: 15,
  },

  leaveGroupText: {
    color: Colours.primaryText,
    fontWeight: "700",
    fontSize: 16,
  },

  // ---------------------
  //   POPUP (CREATE GROUP)
  // ---------------------
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

  // ---------------------
  //   PILL TOGGLE
  // ---------------------
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

  // ---------------------
  //   COLOR SELECTOR
  // ---------------------
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

  // ---------------------
  //   JOIN GROUP BUTTON
  // ---------------------
  joinGroupButton: {
    backgroundColor: "#0F6EC6",
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 15,
    padding: 12,
    paddingHorizontal: 20,
    gap: 10,
    alignSelf: "center",
    marginVertical: 15,
  },

  joinGroupText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },

  // ---------------------
  //   JOIN GROUP MODAL
  // ---------------------
  joinClose: {
    position: "absolute",
    top: 14,
    right: 14,
    backgroundColor: Colours.groupColours[2],
    borderRadius: 20,
    width: 34,
    height: 34,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    zIndex: 10,
  },

  joinTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
    marginTop: 10,
    marginBottom: 8,
  },

  joinSubtitle: {
    fontSize: 15,
    color: "#e0d9ff",
    textAlign: "center",
    marginBottom: 25,
    fontWeight: "500",
  },

  joinInput: {
    width: "100%",
    height: 52,
    borderRadius: 12,
    borderWidth: 1.2,
    borderStyle: "dashed",
    borderColor: "#cbbaff",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    color: "#fff",
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 25,
  },

  joinButton: {
    backgroundColor: "#9b39b6",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 8,
    elevation: 6,
  },

  joinButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },

  JoinpopupBox: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: Colours.groupColours[2],
    borderRadius: 25,
    padding: 30,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    borderWidth: 1.2,
    borderColor: "rgba(255, 255, 255, 0.15)",
    position: "relative",
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
  // DELETE TASK STYLES
  // =========================

  deleteTask: {
    backgroundColor: Colours.failure + "AA",
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    padding: 15,
    gap: 10,
  },

  deleteTaskText: {
    color: Colours.secondaryText,
    fontWeight: 800,
    fontSize: 18,
  },

});