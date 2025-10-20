import {View,Text,StyleSheet,TouchableOpacity,FlatList,Modal,TextInput,Dimensions,Touchable,} from "react-native";
import { ScrollView, Swipeable } from "react-native-gesture-handler";
import { Color as Colours } from "../../constants/colors";
import { AntDesign, Ionicons, FontAwesome } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import Fuse from "fuse.js";

const width = Dimensions.get("window").width;
const height = Dimensions.get("window").height;

export default function GroupScreen() {
  const [groups, setGroups] = useState([
    {id: 1, name: "Study Group", members: 23, colour: Colours.groupColours[0], icon: "book", tasksDone: 15, percent: 65, tasks:23},
    {id: 2, name: "Dorm Group", members: 5, colour: Colours.groupColours[2], icon: "people-sharp", tasksDone: 15, percent: 65, tasks:23},
    {id: 3, name: "Book Group", members: 15, colour: Colours.groupColours[1], icon: "book", tasksDone: 15, percent: 65, tasks:23},
  ]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const [showAddGroupModal, setShowAddGroupModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("people-sharp");
  const [groupType, setGroupType] = useState("Public");
  const [selectedColour, setSelectedColour] = useState(Colours.groupColours[0]);

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
            <Text style={styles.groupName}>
              {item.name}
            </Text>
          </View>
          <Text style={styles.metaText}>
            {item.members} Members
          </Text>
        </View>
      </View>

      <View style={styles.settings}>
        <Ionicons name="settings-sharp" color={Colours.primary} size={20}></Ionicons>
      </View>
    </TouchableOpacity>)
  }

  const [groupSearchValue, setGroupSearchValue] = useState("")
  const groupFuse = new Fuse(
    groups,
    {
      keys: ["name"]
    }
  )
  const [groupsRem, setGroupsRem] = useState(
    groups
  )
  const onGroupChangeSearch = (newValue) => {
    setGroupSearchValue(newValue);
    if (newValue.trim() === "") {
      setGroupsRem(groups);
      return;
    }
    let fuseSearchResults = groupFuse.search(newValue);
    setGroupsRem(fuseSearchResults.map(({item}) => item));
  }

  useEffect(() => {
    onGroupChangeSearch(groupSearchValue)
  }, [groups])

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
      }/>

      <Modal visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: Colours.background }}>
          {selectedGroup && (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScrollContainer}>

              <View style={styles.modalHeader}>

                <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                  <Ionicons name="close" size={28} color={Colours.primary} />
                </TouchableOpacity>

                <View style={{ alignItems: "center" }}>
                  <Ionicons name={selectedGroup.icon} size={50} color="#fff" style={[{ marginBottom: 6 }, {backgroundColor: selectedGroup.colour}, {padding: 10}, {borderRadius: 16}]}/>
                  <Text style={styles.modalHeaderText}>{selectedGroup.name}</Text>
                  <Text style={styles.modalSubHeaderText}>{selectedGroup.members} Members</Text>
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
                <View style={styles.sectionHeader}>
                  <Ionicons name="checkbox-outline" size={22} color={Colours.primary} />
                  <Text style={styles.modalTaskRemaining}>Tasks</Text>
                </View>

                <FlatList data={[ { name: "Finish group notes", completed: false }, { name: "Prepare presentation", completed: true }, { name: "Review project plan", completed: false },]} keyExtractor={(item, index) => index.toString()} scrollEnabled={false} renderItem={({ item }) => (
                    <View style={[ styles.taskItem, item.completed && styles.taskItemCompleted,]}>
                      <Text style={[ styles.taskText, item.completed && styles.taskCompletedText, ]}>{item.name}</Text>
                    </View>)}
                />

                <View style={styles.addTaskContainer}>
                  <TextInput placeholder="Add a new task..." placeholderTextColor="#777" style={styles.addTaskInput}/>
                  <TouchableOpacity style={styles.addTaskButton}>
                    <Ionicons name="add" size={26} color={Colours.primaryText} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.modalUsers}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="people-outline" size={22} color={Colours.primary} />
                  <Text style={styles.modalSectionTitle}>Group Members</Text>
                </View>

                <FlatList data={["Alice", "Ben", "Chris", "Dana"]} horizontal showsHorizontalScrollIndicator={false} keyExtractor={(item, index) => index.toString()} renderItem={({ item, index }) => (
                    <View style={styles.memberAvatar}>
                      <Ionicons name="person-circle" size={50} color={index % 2 === 0 ? Colours.primary : "#0b76e8"}/>
                      <Text style={styles.memberText}>{item}</Text>
                    </View>
                  )}
                />
              </View>

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

  //Search and Create Group Section

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
    backgroundColor: Colours.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colours.primary,
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 5,
  },

  //Display User Groups Section

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

  // Modal Section
  modalScrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },

  closeButton: {
    position: "absolute",
    left: 15,
    top: 15,
    backgroundColor: "#ffffff40",
    borderRadius: 20,
    padding: 6,
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
    height: 12,
    backgroundColor: "#e7ecf5",
    borderRadius: 12,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    borderRadius: 12,
    backgroundColor: Colours.primary,
  },

  progressPercent: {
    marginTop: 10,
    fontSize: 14,
    color: Colours.grayText,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 10,
  },

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
    backgroundColor: "#f3f8ff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#d8e7ff",
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colours.primary,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },

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

})