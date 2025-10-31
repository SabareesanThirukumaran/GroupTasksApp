import React, {createContext, useContext, useState, useEffect} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserGroups, getAllGroups, getUserTasks } from '../firebase/firebaseService';
import { useAuth } from './AuthContext';

const DataContext = createContext();

const CACHE_KEYS = {
    MY_GROUPS: 'cached_my_groups',
    ALL_GROUPS: 'cached_all_groups',
    TASKS: 'cached_tasks',
    LAST_UPDATED: 'cached_last_updated'
};
const CACHE_EXPIRY_HOURS = 24;

export const useData = () => {
    const context = useContext(DataContext);
    if (!context) {
        throw new Error("useData must be within a DataProvider")
    }
    return context
}

export const DataProvider = ({children}) => {
    const {user} = useAuth();
    const [tasks, setTasks] = useState([]);
    const [allGroups, setAllGroups] = useState([]);
    const [myGroups, setMyGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingProgress, setLoadingProgress] = useState(0);

    const loadCachedData = async () => {
        try {

            const lastUpdated = await AsyncStorage.getItem(CACHE_KEYS.LAST_UPDATED)

            if (lastUpdated) {
                const cacheAge = Date.now() - new Date(lastUpdated).getTime()
                const cacheAgeHours = cacheAge / (1000 * 60 * 60)

                if (cacheAgeHours > CACHE_EXPIRY_HOURS){
                    console.log("Cache expired, will fetch fresh data")
                    return false;
                }
            }

            const [cachedMyGroups, cachedAllGroups, cachedTasks] = await Promise.all([
                AsyncStorage.getItem(CACHE_KEYS.MY_GROUPS),
                AsyncStorage.getItem(CACHE_KEYS.ALL_GROUPS),
                AsyncStorage.getItem(CACHE_KEYS.TASKS)
            ]);

            if (cachedMyGroups) {
                setMyGroups(JSON.parse(cachedMyGroups));
            }
            if (cachedAllGroups) {
                setAllGroups(JSON.parse(cachedAllGroups));
            }
            if (cachedTasks) {
                const parsedTasks = JSON.parse(cachedTasks);
                const tasksWithCompletedStatus = parsedTasks.map(task => ({
                    ...task,
                    completed: task.completedBy && task.completedBy.includes(user?.uid)
                }));
                setTasks(tasksWithCompletedStatus);
            }

            console.log("Loaded cached data");
            return true;
        } catch (error) {
            console.log("Error loading cached data:", error);
            return false;
        }
    };

    const saveCacheData = async (myGroupsData, allGroupsData, tasksData) => {
        try {
            await Promise.all([
                AsyncStorage.setItem(CACHE_KEYS.MY_GROUPS, JSON.stringify(myGroupsData)),
                AsyncStorage.setItem(CACHE_KEYS.ALL_GROUPS, JSON.stringify(allGroupsData)),
                AsyncStorage.setItem(CACHE_KEYS.TASKS, JSON.stringify(tasksData)),
                AsyncStorage.setItem(CACHE_KEYS.LAST_UPDATED, new Date().toISOString())
            ]);
            console.log("Data cached successfully");
        } catch (error) {
            console.log("Error caching data:", error);
        }
    };

    const clearCache = async () => {
        try {
            await Promise.all([
                AsyncStorage.removeItem(CACHE_KEYS.MY_GROUPS),
                AsyncStorage.removeItem(CACHE_KEYS.ALL_GROUPS),
                AsyncStorage.removeItem(CACHE_KEYS.TASKS),
                AsyncStorage.removeItem(CACHE_KEYS.LAST_UPDATED)
            ]);
            console.log("Cache cleared");
        } catch (error) {
            console.log("Error clearing cache:", error);
        }
    };

    const loadFreshData = async () => {
        if (!user?.uid) {
            setLoading(false);
            return;
        }

        try {
            setLoadingProgress(0);

            const allGroupsResult = await getAllGroups();
            if (allGroupsResult.success) {
                setAllGroups(allGroupsResult.groups);
            }
            setLoadingProgress(33);

            const myGroupsResult = await getUserGroups(user.uid);
            if (myGroupsResult.success) {
                setMyGroups(myGroupsResult.groups);
                setLoadingProgress(66);

                const groupIds = myGroupsResult.groups.map(group => group.id);
                const tasksResult = await getUserTasks(groupIds);
                if (tasksResult.success) {
                    const tasksWithCompletedStatus = tasksResult.tasks.map(task => ({
                        ...task,
                        completed: task.completedBy && task.completedBy.includes(user.uid)
                    }));
                    setTasks(tasksWithCompletedStatus);
                    
                    await saveCacheData(
                        myGroupsResult.groups,
                        allGroupsResult.groups,
                        tasksResult.tasks
                    );
                }
            }
            setLoadingProgress(100);
        } catch (error) {
            console.log("Error loading fresh data:", error);
        } finally {
            setLoading(false);
        }
    };

    const loadData = async () => {
        if (!user?.uid) {
            setLoading(false);
            return;
        }

        setLoading(true);

        const hasCachedData = await loadCachedData();
        
        if (hasCachedData) {
            setLoading(false);
            loadFreshData();
        } else {
            await loadFreshData();
        }
    };

    useEffect(() => {
        loadData();
    }, [user?.uid]);

    useEffect(() => {
        if (!user) {
            clearCache();
            setTasks([]);
            setMyGroups([]);
            setAllGroups([]);
        }
    }, [user]);

    const refreshData = () => {
        setLoading(true);
        loadFreshData();
    };

    return (
        <DataContext.Provider
            value={{
                tasks,
                setTasks,
                allGroups,
                setAllGroups,
                myGroups,
                setMyGroups,
                loading,
                loadingProgress,
                refreshData,
                clearCache
            }}
        >
            {children}
        </DataContext.Provider>
    );
};