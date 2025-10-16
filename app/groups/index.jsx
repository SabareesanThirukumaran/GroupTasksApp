import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  Dimensions,
  Touchable,
} from "react-native";
import { ScrollView, Swipeable } from "react-native-gesture-handler";
import { Color as Colours } from "../../constants/colors";
import { AntDesign, Ionicons, FontAwesome } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import DateTimePicker from "@react-native-community/datetimepicker";
const width = Dimensions.get("window").width;
const height = Dimensions.get("window").height;

export default function GroupScreen() {
  const [userGroups, setUserGroups] = useState([
    {
      "id": 1,
      "name": "Study Group",
      "members": "23",
    },

    {
      "id": 2,
      "name": "Dorm Group",
      "members": "5"
    },

  ])
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const groupOpen = (group) => {
    setSelectedGroup(group)
    setModalVisible(true);
  }

  const renderGroup = ({item}) => {
    return (<TouchableOpacity style={styles.groupCard} onPress={() => groupOpen(item)}>
      <View style={styles.frontText}>
        <View style={styles.groupIcon}>
          <Ionicons name="book-sharp" color={Colours.primaryText} size={30}></Ionicons>
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

  return (
    <View style={styles.entire}>
      <FlatList
      data={userGroups}
      renderItem={renderGroup}
      keyExtractor={(item) => item.id.toString()}
      contentContainerStyle={{paddingBottom: 20}}
      ListHeaderComponent={
        <View>
          <View style={styles.topHeader}>
            <Ionicons name="people-circle-outline" color={Colours.primary} size={40}></Ionicons>
            <Text style={styles.topHeaderText}>Groups</Text>
          </View>

          <View style={styles.searchItems}>
            <View style={styles.tasksSearchContainer}>
              <FontAwesome name="search" size={18} color={Colours.defaultText} />
              <TextInput placeholder="Find a Group" style={{fontSize: 16, flex: 1, paddingVertical: 0}}/>
            </View>

            <TouchableOpacity style={styles.createGroup}>
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
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalScrollContainer}
            >
              {/* HEADER */}
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={28} color={Colours.primary} />
                </TouchableOpacity>

                <View style={{ alignItems: "center" }}>
                  <Ionicons
                    name="people-circle"
                    size={60}
                    color={Colours.primary}
                    style={{ marginBottom: 6 }}
                  />
                  <Text style={styles.modalHeaderText}>{selectedGroup.name}</Text>
                  <Text style={styles.modalSubHeaderText}>
                    {selectedGroup.members} Members
                  </Text>
                </View>
              </View>

              {/* PROGRESS BAR */}
              <View style={styles.progressCard}>
                <Text style={styles.progressTitle}>Overall Progress</Text>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: "45%" }]} />
                </View>
                <Text style={styles.progressPercent}>45% Completed</Text>
              </View>

              {/* TASKS SECTION */}
              <View style={styles.modalTasks}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="checkbox-outline" size={22} color={Colours.primary} />
                  <Text style={styles.modalTaskRemaining}>Tasks</Text>
                </View>

                <FlatList
                  data={[
                    { name: "Finish group notes", completed: false },
                    { name: "Prepare presentation", completed: true },
                    { name: "Review project plan", completed: false },
                  ]}
                  keyExtractor={(item, index) => index.toString()}
                  scrollEnabled={false}
                  renderItem={({ item }) => (
                    <View
                      style={[
                        styles.taskItem,
                        item.completed && styles.taskItemCompleted,
                      ]}
                    >
                      <Text
                        style={[
                          styles.taskText,
                          item.completed && styles.taskCompletedText,
                        ]}
                      >
                        {item.name}
                      </Text>
                    </View>
                  )}
                />

                {/* Add task input */}
                <View style={styles.addTaskContainer}>
                  <TextInput
                    placeholder="Add a new task..."
                    placeholderTextColor="#777"
                    style={styles.addTaskInput}
                  />
                  <TouchableOpacity style={styles.addTaskButton}>
                    <Ionicons name="add" size={26} color={Colours.primaryText} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* MEMBERS SECTION */}
              <View style={styles.modalUsers}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="people-outline" size={22} color={Colours.primary} />
                  <Text style={styles.modalSectionTitle}>Group Members</Text>
                </View>

                <FlatList
                  data={["Alice", "Ben", "Chris", "Dana"]}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(item, index) => index.toString()}
                  renderItem={({ item, index }) => (
                    <View style={styles.memberAvatar}>
                      <Ionicons
                        name="person-circle"
                        size={50}
                        color={index % 2 === 0 ? Colours.primary : "#0b76e8"}
                      />
                      <Text style={styles.memberText}>{item}</Text>
                    </View>
                  )}
                />
              </View>
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );
}


const styles = StyleSheet.create({
  modalScrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },

  closeButton: {
    position: "absolute",
    left: 0,
    top: 0,
    padding: 8,
  },

  modalHeader: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    backgroundColor: Colours.primaryText,
    borderRadius: 20,
    paddingVertical: 30,
    shadowColor: Colours.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 6,
  },

  modalHeaderText: {
    fontSize: 26,
    fontWeight: "800",
    color: Colours.defaultText,
    letterSpacing: 0.4,
  },

  modalSubHeaderText: {
    fontSize: 15,
    color: Colours.grayText,
    marginTop: 3,
  },

  progressCard: {
    backgroundColor: Colours.primaryText,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: Colours.primary,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  progressTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colours.defaultText,
    marginBottom: 10,
  },

  progressBar: {
    height: 10,
    backgroundColor: "#e5e5e5",
    borderRadius: 10,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    backgroundColor: Colours.primary,
    borderRadius: 10,
  },

  progressPercent: {
    marginTop: 8,
    color: Colours.grayText,
    fontSize: 14,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },

  modalTasks: {
    backgroundColor: Colours.primaryText,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },

  modalTaskRemaining: {
    fontSize: 20,
    fontWeight: "700",
    color: Colours.defaultText,
  },

  taskItem: {
    backgroundColor: "#f3f8ff",
    borderRadius: 10,
    padding: 10,
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
    marginTop: 10,
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



  entire: {
    position: "relative",
    flex: 1,
    backgroundColor: Colours.background,
  },

  topHeader: {
    backgroundColor: Colours.background,
    borderBottomColor: "#35353525",
    borderBottomWidth: 0.6,
    marginBottom: 6,
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

  searchItems: {
    flexDirection: "row",
    justifyContent: "space-between",
    margin: 15
  },

  tasksSearchContainer: {
    backgroundColor: Colours.surface,
    borderColor: Colours.surfaceBorder,
    borderWidth: 1,
    borderRadius: 50,
    width: 250,
    paddingHorizontal: 10,
    marginHorizontal: 10,
    height: 40,
    flexDirection: "row",
    alignSelf: "flex-start",
    alignItems: "center",
    gap: 8,
  },

  createGroup: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colours.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 20,
  },

  groupsText: {
    fontSize: 27,
    fontWeight: 400,
    marginLeft: 30,
    paddingBottom: 15
  },

  groupCard: {
    alignSelf: "center",
    backgroundColor: Colours.primaryText,
    borderRadius: 16,
    padding: 18,
    marginBottom: 15,
    width: width * 0.88,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },


  frontText: {
    flexDirection: "row",
    gap: 10
  },

  groupIcon: {
    width: 50,
    height: 50,
    backgroundColor: Colours.groupColours[0],
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },

  allText: {
    justifyContent: "center",
  },

  groupName: {
    fontSize: 19,
    fontWeight: "600",
    color: Colours.defaultText,
    marginRight: 10,
  },

  metaText: {
    fontSize: 14,
    color: Colours.grayText,
    marginTop: 3,
  },

  settings: {
    alignSelf: "center",
    justifyContent: "flex-end"
  },
})