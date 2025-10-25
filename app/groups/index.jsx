import {View,Text,StyleSheet,TouchableOpacity,FlatList,Modal,TextInput,Dimensions,Alert} from "react-native";
import * as Clipboard from "expo-clipboard";
import { ScrollView, Switch } from "react-native-gesture-handler";
import { Color as Colours } from "../../constants/colors";
import { AntDesign, Ionicons, FontAwesome } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import Fuse from "fuse.js";
import DateTimePicker from "@react-native-community/datetimepicker";
import ToastAlert from "../../toastAlert";
const width = Dimensions.get("window").width;

export default function GroupScreen() {
  const userId = 1;

  const [tasks, setTasks] = useState([
    { id: '1', title: 'Task 1', dueDate: '2024-06-10', difficulty: 'Easy', description: "Hello my name is", groupId: 1, completed: false  },
    { id: '2', title: 'Task 2', dueDate: '2024-06-12',  difficulty: 'Medium', description: "Hello my name is", groupId: 1, completed: true  },
    { id: '3', title: 'Task 3', dueDate: '2024-06-15', difficulty: 'Hard', description: "Hello my name is", groupId: 3, completed: false  },
    { id: '4', title: 'Task 4', dueDate: '', difficulty: 'Hard', description: "Hello my name is", groupId: 2, completed: true  },
  ]);
  const [allGroups, setAllGroups] = useState([
    {
    id: 1, name: "Study Group", 
    membersList: [      
      { id: 1, name: "Alice" },
      { id: 2, name: "Ben" },
      { id: 3, name: "Chris" },],
       colour: Colours.groupColours[0], icon: "book", tasksDone: 15, percent: 65, tasks:23, type: "Public", code:"KG3BN8L9", creatorId: 3},
    {id: 2, name: "Dorm Group",
      membersList: [      
      { id: 1, name: "Alice" },
      { id: 2, name: "Ben" },
      { id: 3, name: "Chris" },], colour: Colours.groupColours[2], icon: "people-sharp", tasksDone: 15, percent: 65, tasks:23, type: "Public", code:"5HRT9X2Q", creatorId: 1},
    {id: 3, name: "Book Group",
      membersList: [      
      { id: 1, name: "Alice" },
      { id: 2, name: "Ben" },
      { id: 3, name: "Chris" },], colour: Colours.groupColours[1], icon: "book", tasksDone: 15, percent: 65, tasks:23, type: "Public", code: "8DF2S7LT", creatorId: 2},
  ]);
  const [myGroups, setMyGroups] = useState([
    {id: 2, name: "Dorm Group",
    membersList: [   
      { id: 1, name: "You" },   
      { id: 2, name: "Alice" },
      { id: 3, name: "Ben" },
      { id: 4, name: "Chris" },], colour: Colours.groupColours[2], icon: "people-sharp", tasksDone: 15, percent: 65, tasks:23, type: "Public", code:"5HRT9X2Q", creatorId: 1},
    {id: 3, name: "Book Group",
    membersList: [      
      { id: 2, name: "Alice" },
      { id: 3, name: "Ben" },
      { id: 4, name: "Chris" },], colour: Colours.groupColours[1], icon: "book", tasksDone: 15, percent: 65, tasks:23, type: "Public", code: "8DF2S7LT", creatorId: 2},
  ]);

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

  const [groupsRem, setGroupsRem] = useState(myGroups);
  const [groupSearchValue, setGroupSearchValue] = useState("");
  const groupFuse = new Fuse(myGroups,{keys: ["name"]})
  useEffect(() => {onGroupChangeSearch(groupSearchValue)}, [myGroups])

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const showAlertText = (message) => {setAlertMessage(message); setAlertVisible(true);}

  const getGroupMembers = (group) => {
    return group.membersList.map(member => member.name);
  };

  const handleKickMember = (memberId) => {

    Alert.alert(
      "Kick Member",
      "Are you sure you want to remove this member?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Kick",
          style: "destructive",
          onPress: () => {
            const updatedGroup = {
              ...selectedGroup,
              membersList: selectedGroup.membersList.filter(m => m.id !== memberId),
            };
            updateGroupState(updatedGroup);
          },
        },
      ]
    );
  };

  const handleDeleteGroup = () => {
    Alert.alert(
      "Delete Group",
      "This action cannot be undone. Delete this group?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setMyGroups(myGroups.filter((g) => g.id !== selectedGroup.id));
            setShowSettingsModal(false);
          },
        },
      ]
    );
  };

  const handleSaveGroupSettings = () => {
    const updatedGroup = {
      ...selectedGroup,
      name: editedGroupName,
      icon: selectedIconSet,
      colour: selectedColourSet,
    };
    updateGroupState(updatedGroup);
    setShowSettingsModal(false);
  };

  const updateGroupState = (updatedGroup) => {
    setMyGroups(prev =>
      prev.map(g => g.id === updatedGroup.id ? updatedGroup : g)
    );
    setAllGroups(prev =>
      prev.map(g => g.id === updatedGroup.id ? updatedGroup : g)
    );
    setSelectedGroup(updatedGroup);
  };

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

  const createGroup = (name, type, icon, colour) => {
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();

    const newGroup = {
      id: allGroups.length + 1,
      name: name.trim() || "Untitled Group",
      membersList: [{ id: userId, name: "You" }],
      colour: colour,
      icon: icon,
      tasksDone: 0,
      percent: 0,
      tasks: 0,
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

  const joinGroup = (inviteCode) => {
    const trimmedCode = inviteCode.trim().toUpperCase();
    const findGroup = allGroups.find((group) => group.code === trimmedCode);

    if (!findGroup) {
      showAlertText("No Group Found");
      return;
    }

    const alreadyJoined = myGroups.some((group) => group.id === findGroup.id);
    if (alreadyJoined) {
      showAlertText("You are already a member of this group");
      return;
    }

    if (findGroup.type === "Private") {
      showAlertText("This is a private group. Join back when the owner makes it public.");
      return;
    }

    const updatedGroup = { ...findGroup, membersList: [...findGroup.membersList, { id: userId, name: "You" }] };
    const updatedAllGroups = allGroups.map((group) => group.id === findGroup.id ? updatedGroup : group);

    setMyGroups([...myGroups, updatedGroup]);
    setAllGroups(updatedAllGroups);
    showAlertText("Successfully joined the group!");
    setShowJoinGroupModal(false);
    setGroupIDJoin("");
  }

  const leaveGroup = (selectedGroupId) => {
    if ((myGroups.find((group) => group.id === selectedGroupId)).membersList.length === 1) {
      showAlertText("You are the only member in this group. You must delete the group instead.");
      return;
    }

    if (myGroups.find((group) => group.id === selectedGroupId).creatorId === userId) {
      showAlertText("You are the creator. You must delete the group instead.");
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
          onPress: () => {

            if (!selectedGroupId) return;
            setMyGroups(myGroups.filter((group) => group.id !== selectedGroupId));

            const groupToLeave = allGroups.find((group) => group.id === selectedGroupId);
            if (groupToLeave) {
              const updatedGroup = {
                ...groupToLeave,
                membersList: Math.max(0, groupToLeave.members - 1),
              };
              setAllGroups(allGroups.map((g) =>
                g.id === selectedGroupId ? updatedGroup : g
              ));

              setMyGroups(myGroups.filter((g) => g.id !== selectedGroupId));
            }

            setModalVisible(false);
          },
        },
      ]
    );
  };

  const copyCode = (code) => {
    Clipboard.setStringAsync(code);
    showAlertText("Invite code copied!");
  }

  const addTask = (taskSelected, dateSelected) => {
    if (!taskSelected.trim()) {
      showAlertText("Please enter a task name!");
      return;
    }
    const newId = tasks.length
      ? Math.max(...tasks.map((task) => Number(task.id))) + 1
      : 1;

    const newTask = {
      id: newId.toString(),
      title: taskSelected,
      dueDate: dateSelected ? dateSelected.toISOString().split('T')[0] : "",
      difficulty,
      description: taskDescription,
      groupId: selectedGroupT?.id || null,
      completed: false,
    };

    setTasks((prevTasks) => [...prevTasks, newTask]);
    setShowAddTaskModal(false);
    setTaskName("");
    setTaskDate(new Date());
    setTaskTime(new Date());
  };

  const openSettings = (group) => {
    setSelectedGroup(group);
    setEditedGroupName(group.name);
    setSelectedIconSet(group.icon);
    setSelectedColourSet(group.colour);
    setShowSettingsModal(true);
  }

  const onGroupChangeSearch = (newValue) => {
    setGroupSearchValue(newValue);
    if (newValue.trim() === "") {
      setGroupsRem(myGroups);
      return;
    }
    let fuseSearchResults = groupFuse.search(newValue);
    setGroupsRem(fuseSearchResults.map(({item}) => item));
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
          {selectedGroup && (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.modalScrollContainer, {paddingBottom: 50}]}>

              <View style={styles.modalHeader}>

                <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                  <Ionicons name="close" size={28} color={Colours.primary} />
                </TouchableOpacity>

                <View style={{ alignItems: "center" }}>
                  <Ionicons name={selectedGroup.icon} size={50} color="#fff" style={[{ marginBottom: 6 }, {backgroundColor: selectedGroup.colour}, {padding: 10}, {borderRadius: 16}]}/>
                  <Text style={styles.modalHeaderText}>{selectedGroup.name}</Text>
                  <Text style={styles.modalSubHeaderText}>{selectedGroup.membersList.length} Members</Text>
                  <TouchableOpacity onPress={() => copyCode(selectedGroup.code)}>
                    <Text style={{color: Colours.primary}}>Invite Code: {selectedGroup.code}</Text>
                  </TouchableOpacity>
                </View>

              </View>

              <View style={styles.progressCard}>
                <Text style={styles.progressTitle}>Overall Progress</Text>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${selectedGroup.percent}%` }]} />
                </View>
                <Text style={styles.progressPercent}>{selectedGroup.percent}% Completed</Text>
              </View>

              <View style={styles.modalTasks}>
                <View style={[styles.sectionHeader, {flexDirection: "row", alignItems: "center", marginBottom: 15, gap: 10}]}>
                  <Ionicons name="checkbox-outline" size={22} color={Colours.primary} />
                  <Text style={styles.modalTaskRemaining}>Tasks</Text>
                </View>

                <View style={{paddingBottom: 80}}>
                  <FlatList data={tasks.filter((task => task.groupId === selectedGroup.id))} keyExtractor={(item, index) => index.toString()} scrollEnabled={false} renderItem={({ item }) => (
                    <View style={[{ flexDirection: 'row', alignItems: 'center' }, styles.taskItem, item.completed && styles.taskItemCompleted ]}>
                      <Text style={[styles.taskText, item.completed && styles.taskCompletedText]}>{item.title}</Text>
                      <View style={[styles.taskDifficulty, { backgroundColor: item.difficulty === 'Easy' ? 'green' : item.difficulty === 'Medium' ? 'orange' : 'red' }]} />
                    </View>
                  )}/>
                </View>

                <TouchableOpacity
                  style={styles.addTaskButton}
                  onPress={() => {
                    setSelectedGroupT(selectedGroup);
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

                <FlatList data={getGroupMembers(selectedGroup)} horizontal showsHorizontalScrollIndicator={false} keyExtractor={(item, index) => index.toString()} renderItem={({ item, index }) => (
                    <View style={styles.memberAvatar}>
                      <Ionicons name="person-circle" size={50} color={index % 2 === 0 ? Colours.primary : "#0b76e8"}/>
                      <Text style={styles.memberText}>{item}</Text>
                    </View>
                  )}
                />
              </View>

              <TouchableOpacity style={styles.leaveGroup} onPress={() => leaveGroup(selectedGroup.id)}>
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

            <Text style={styles.popupInfo}>Group*</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginVertical: 10}}>
              {myGroups.map((group) => (
                <TouchableOpacity key={group.id} style={[styles.iconOption, selectedGroupT?.id === group.id && styles.iconSelected, {backgroundColor: group.colour}, ]} onPress={() => setSelectedGroupT(group)}>
                  <Ionicons name={group.icon} size={26} color="white"></Ionicons>
                </TouchableOpacity>))}
            </ScrollView>

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
});