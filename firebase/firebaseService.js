import {collection, addDoc, getDocs, getDoc, doc, updateDoc, deleteDoc, query, where, serverTimestamp, setDoc, writeBatch} from 'firebase/firestore';
import { db, storage } from './config';
import { deleteUser, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import {ref, deleteObject, listAll, uploadBytes, getDownloadURL} from 'firebase/storage'
import {auth} from "./config"

export const createUser = async (userId, userData) => {
    await setDoc(doc(db, "users", userId), {
        ...userData,
        profilePicture: null,
        createdAt: serverTimestamp(),
        lastActive: serverTimestamp(),
    })
    return userId
}

export const usernameTaken = async (username) => {
    try {
        const allUsers = collection(db, 'users');
        const q = query(allUsers, where("name", "==", username.toLowerCase()));
        const queryResults = await getDocs(q);
        return !queryResults.empty;
    } catch (error) {
        console.log("Error checking username", error)
        return false;
    }
}

export const updateLastActive = async (userId) => {
    try {
        await updateDoc(doc(db, "users", userId), {
            lastActive: serverTimestamp()
        });
    } catch (error) {
        console.log("Error updating last active", error)
    }
}

export const deleteAccount = async (userId, email, password) => {
    const user = auth.currentUser;
    if (!user) return {success: false, error: "No authenticated user"};

    try {

        const credential = EmailAuthProvider.credential(email, password)
        await reauthenticateWithCredential(user, credential)

        const batch = writeBatch(db);
        const userRef = doc(db, 'users', userId);
        batch.delete(userRef)

        const tasksQuery = query(collection(db, 'tasks'), where('createdBy', '==', userId))
        const tasksSnapshot = await getDocs(tasksQuery);
        tasksSnapshot.forEach((doc) => {batch.delete(doc.ref)})

        const groupsQuery = query(collection(db, 'groups'));
        const groupsSnapshot = await getDocs(groupsQuery)
        for (const groupDoc of groupsSnapshot.docs) {
            const groupData = groupDoc.data();
            const membersList = groupData.membersList || [];

            if (membersList.some(member => member.id === userId)) {
                if (groupData.creatorId === userId) {
                    batch.delete(groupDoc.ref)

                    const groupTasksQuery = query(
                        collection(db, 'tasks'), 
                        where('groupId', '==', groupDoc.id)
                    );
                    const groupTasksSnapshot = await getDocs(groupTasksQuery);
                    groupTasksSnapshot.forEach((taskDoc) => {
                        batch.delete(taskDoc.ref);
                    });
                } else {
                    const updatedMembers = membersList.filter(member => member.id !== userId);
                    batch.update(groupDoc.ref, {membersList: updatedMembers})
                }
            }
        }

        await batch.commit();

        try {
            const profilePicsFolder = ref(storage, 'profile_pictures/')
            const listResult = await listAll(profilePicsFolder)

            for (const item of listResult.items) {
                if (item.name.startsWith(`profile_${userId}_`)) {
                    await deleteObject(item)
                    console.log("Deleted profile picture:", item.name)
                }
            }
        } catch (storageError) {
            console.log("No profile picture", storageError)
        }

        await deleteUser(user)

        return {success: true}
    } catch (error) {
        console.log("Error deleting account:", error)
        if (error.code === 'auth/wrong-password') {
            return { success: false, error: "Incorrect password" };
        } else if (error.code === 'auth/too-many-requests') {
            return { success: false, error: "Too many attempts. Try again later." };
        }
        return { success: false, error: error.message };
    }
}

export const uploadProfilePicture = async (userId, uri) => {
    try {
        const response = await fetch(uri);
        const blob = await response.blob();

        const filename = `profile_${userId}_${Date.now()}.jpg`;
        const imageRef = storageRef(storage, `profile_pictures/${filename}`);

        await uploadBytes(imageRef, blob)
        const downloadUrl = await getDownloadURL(imageRef)

        return downloadUrl;
    } catch (error) {
        console.log("Error uploading profile picture : ", error)
        throw error;
    }
}

export const updateUserProfile = async (userId, updates) => {
    try {
        await updateDoc(doc(db, 'users', userId), updates);
        return {success:true}
    } catch (error) {
        return {success: false, error: error.message}
    }
}

// ├── name (USERS)
// ├── email
// ├── createdAt
// ├── lastActive

export const createGroup = async (groupData, userId, username) => {
    try {
        const docRef = await addDoc(collection(db, 'groups'),  {
            name: groupData.name,
            code: groupData.code,
            colour: groupData.colour,
            icon: groupData.icon,
            type: groupData.type,
            creatorId: userId,
            membersList: [{id: userId, name: username, role: "admin", joinedAt: new Date()}],
            kickedMembers: [],
            createdAt: serverTimestamp(),
        });
        return {success: true, groupId: docRef.id}
    } catch (error) {
        return {success: false, error: error.message}
    }
}

export const getAllGroups = async () => {
    try {
        const docRef = await getDocs(collection(db, 'groups'));
        const groups = docRef.docs.map(doc => ({id : doc.id, ...doc.data()}));
        return {success: true, groups}
    } catch (error) {
        return {success: false, error: error.message}
    }
}

export const getUserGroups = async (userId) => {
    try {
        const docRef = await getDocs(collection(db, 'groups'));
        const groups = docRef.docs.map(doc => ({id: doc.id, ...doc.data()}));

        const userGroups = groups.filter(group => group.membersList?.some(member => member.id === userId));

        return {success: true, groups: userGroups}
    } catch (error) {
        return {sucess: false, error: error.message}
    }
}

export const leaveGroup = async (groupId, userId) => {
    try {
        const docRef = await getDoc(doc(db, 'groups', groupId));
        const groupData = docRef.data();

        await updateDoc(doc(db, 'groups', groupId), {
            membersList: groupData.membersList.filter(member => member.id !== userId),
        })
        return {success: true};
    } catch (error) {
        return {success: false, error: error.message};
    }
}

export const joinGroup = async (code, userId, username) => {
    try {
        const ref = query(collection(db, 'groups'), where ('code', '==', code))
        const snapshot = await getDocs(ref);

        if (snapshot.empty) {
            console.log("Invalid group code") 
            return {success: false, error: "Invalid group code"}
        }

        const groupDoc = snapshot.docs[0];
        const groupData = groupDoc.data();

        if (groupData.kickedMembers?.includes(userId)) {
            console.log("User was kicked from this group")
            return {success: false, error: "You have been removed from this group and cannot rejoin"}
        }

        if (groupData.membersList?.some(member => member.id === userId)) {
            console.log("Already a member") 
            return {success: false, error: "You are already apart of this group"}
        }
        
        const updateMembers = [...groupData.membersList, {id: userId, name: username, role: "member", joinedAt: new Date()}]

        await updateDoc(doc(db, 'groups', groupDoc.id), {
            membersList: updateMembers
        })

        console.log("Joined")
        return {success: true, groupId: groupDoc.id }
    } catch (error) {
        console.log("Failed")
        return {success: false, error: error.message}
    }
}

export const kickMember = async (groupId, userId) => {
    try {
        const ref = doc(db, 'groups', groupId)
        const groupSnapshot = await getDoc(ref);

        if (!groupSnapshot.exists()) {
            return {success: false, error: "Group not found"}
        }

        const groupData = groupSnapshot.data();
        const updateMembers = groupData.membersList.filter(user => user.id  !== userId)
        const kickedMembers = [...(groupData.kickedMembers || []), userId];

        await updateDoc(ref, {membersList: updateMembers, kickedMembers: kickedMembers})

        return {success: true}
    } catch (error) {
        return {success: false, error: error.message}
    }
}

export const deleteGroup = async (groupId) => {
    try {
        await deleteDoc(doc(db, 'groups', groupId))

        const tasksQuer = query(collection(db, 'tasks'), where('groupId', '==', groupId))
        const tasksResult = await getDocs(tasksQuer)
        const deletes = tasksResult.docs.map(taskDoc => deleteDoc(doc(db, 'tasks', taskDoc.id)))

        await Promise.all(deletes)

        return {success: true}
    } catch (error) {
        return {success: false, error: error.message}
    }

}

export const changeSettings = async (groupId, updates) => {
    try {
        await updateDoc(doc(db, 'groups', groupId), updates);
        return {success: true}
    } catch (error) {
        return {success: false, error: error.message}
    }
}

// ├── name (GROUPS)
// ├── code
// ├── colour
// ├── icon
// ├── type ("Public" | "Private")
// ├── creatorId (userId)
// ├── membersList: [
//     { id: userId1, name: "Alice", role: "admin", joinedAt },
//     { id: userId2, name: "Ben", role: "member", joinedAt }
//     ]
// ├── createdAt

export const createTask = async (taskData) => {
    try {
        const docRef = await addDoc(collection(db, 'tasks'), {
            title: taskData.title,
            description: taskData.description || '',
            dueDate: taskData.dueDate || '',
            difficulty: taskData.difficulty,
            groupId: taskData.groupId,
            completedAt: [],
            completedBy: [],
            deletedBy: [],
            createdBy: taskData.createdBy,
            createdAt: serverTimestamp(),
        })
        return {success: true, taskId: docRef.id}
    } catch (error) {
        return {success: false, error: error.message}
    }
}

export const getUserTasks = async (groupIds) => {
  try {
    if (!groupIds || groupIds.length === 0) {
      return { success: true, tasks: [] };
    }
    const allTasks = [];
    
    for (let i = 0; i < groupIds.length; i += 10) {
      const batch = groupIds.slice(i, i + 10);
      const q = query(collection(db, 'tasks'), where('groupId', 'in', batch));
      const snapshot = await getDocs(q);
      allTasks.push(...snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }
    
    return { success: true, tasks: allTasks };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateTask = async (taskId, updates) => {
    try {
        await updateDoc(doc(db, 'tasks', taskId), updates);
        return {success: true}
    } catch (error) {
        return {success: false, error: error.message}
    }
}

export const deleteTask = async (taskId) => {
    try {
        await deleteDoc(doc(db, 'tasks', taskId))
        return {success: true}
    } catch (error) {
        return {success: false}
    }
}

// ├── title (TASKS)
// ├── description
// ├── dueDate
// ├── completed
// ├── completedAt (when it was marked done)
// ├── completedBy (userId who marked it - optional but useful!)
// ├── difficulty ("Easy" | "Medium" | "Hard")
// ├── groupId
// ├── createdBy (userId)
// ├── createdAt