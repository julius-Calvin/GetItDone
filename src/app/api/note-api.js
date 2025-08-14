import { db } from "./firebase-config";

import { 
    addDoc, 
    collection,
    getDocs,
    where,
    orderBy, 
    query,
    doc,
    updateDoc,
    deleteDoc
} from "firebase/firestore";

// Create task with date filtering
export const addTask = async (userId, taskData) => {
    try {
        // Ensure date is properly set (default to 'today' if not specified)
        const normalizedTaskData = {
            ...taskData,
            date: taskData.date || 'today', // Default to 'today' if no date specified
        };

        // Get current task count for the specific date
        let taskCount = 0;
        if (normalizedTaskData.date === 'tomorrow') {
            const tomorrowTasks = await getTomorrowTasks(userId);
            taskCount = tomorrowTasks.length;
        } else {
            const todayTasks = await getTodayTasks(userId);
            taskCount = todayTasks.length;
        }

        const docRef = await addDoc(collection(db,"tasks"), {
            ...normalizedTaskData,
            isFinished: false,
            userId: userId,
            rank: taskCount + 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        })
        console.log('Task added:', normalizedTaskData);
        console.log("Document written with ID: ", docRef.id);
        return { id: docRef.id, ...normalizedTaskData, userId };
    } catch (error) {
        console.error("Error adding document: ", error);
        throw error;
    }
};

// READ - Get all tasks for a user (legacy function)
export const getUserTasks = async (userId) => {
  try {
    const q = query(
      collection(db, "tasks"), 
      where("userId", "==", userId),
      orderBy("rank", "asc")
    );
    const querySnapshot = await getDocs(q);
    const tasks = [];
    querySnapshot.forEach((doc) => {
      tasks.push({ id: doc.id, ...doc.data() });
    });
    return tasks;
  } catch (error) {
    console.error("Error getting documents: ", error);
    throw error;
  }
};

// READ - Get today's tasks for a user
export const getTodayTasks = async (userId) => {
  try {
    // Get all tasks for the user and filter on client side
    const q = query(
      collection(db, "tasks"), 
      where("userId", "==", userId),
      orderBy("rank", "asc")
    );
    
    const querySnapshot = await getDocs(q);
    const tasks = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Only include tasks explicitly marked as 'today' or legacy tasks without any date field
      // Never include tasks explicitly marked as 'tomorrow'
      if (data.date === 'today' || (data.date === undefined && !data.hasOwnProperty('date'))) {
        tasks.push({ id: doc.id, ...data });
      }
    });
    
    return tasks;
  } catch (error) {
    console.error("Error getting today's documents: ", error);
    throw error;
  }
};

// READ - Get tomorrow's tasks for a user
export const getTomorrowTasks = async (userId) => {
  try {
    const q = query(
      collection(db, "tasks"), 
      where("userId", "==", userId),
      where("date", "==", "tomorrow"),
      orderBy("rank", "asc")
    );
    const querySnapshot = await getDocs(q);
    const tasks = [];
    querySnapshot.forEach((doc) => {
      tasks.push({ id: doc.id, ...doc.data() });
    });
    return tasks;
  } catch (error) {
    console.error("Error getting tomorrow's documents: ", error);
    throw error;
  }
};

// Update task
export const updateTask = async (taskId, updatedData) => {
  try {
    const taskRef = doc(db, "tasks", taskId);
    await updateDoc(taskRef, {
      ...updatedData,
      updatedAt: new Date().toISOString(),
    });
    console.log(updatedData);
  } catch (error) {
    throw error;
  }
};

// Delete task
export const deleteTask = async (taskId) => {
  try {
    const taskRef = doc(db, "tasks", taskId);
    await deleteDoc(taskRef);
  } catch (error) {
    throw error;
  }
};

// Rollover: Move all 'tomorrow' tasks into 'today' with appended ranks
export const rolloverTomorrowTasksToToday = async (userId) => {
  try {
    if (!userId) return { moved: 0 };

    // Check if rollover has already been done today to prevent double execution
    const rolloverKey = `rollover_${userId}_${new Date().toDateString()}`;
    if (typeof window !== 'undefined') {
      const alreadyRolledOver = localStorage.getItem(rolloverKey);
      if (alreadyRolledOver === 'true') {
        console.log('Rollover already completed today for this user');
        return { moved: 0, alreadyCompleted: true };
      }
    }

    // Fetch latest lists
    const [todayTasks, tomorrowTasks] = await Promise.all([
      getTodayTasks(userId),
      getTomorrowTasks(userId)
    ]);

    if (!tomorrowTasks || tomorrowTasks.length === 0) {
      // Mark as completed even if no tasks to move
      if (typeof window !== 'undefined') {
        localStorage.setItem(rolloverKey, 'true');
      }
      return { moved: 0 };
    }

    console.log(`API rollover: Moving ${tomorrowTasks.length} tasks from tomorrow to today...`);

    // Determine starting rank (handle empty today list gracefully)
    const maxRank = (todayTasks || []).reduce((max, t) => Math.max(max, t?.rank || 0), 0);
    let nextRank = maxRank + 1;

    // Preserve relative order of tomorrow tasks by their existing rank
    const tomorrowSorted = [...tomorrowTasks].sort((a, b) => (a.rank || 0) - (b.rank || 0));

    await Promise.all(
      tomorrowSorted.map(task => {
        const updates = { date: 'today', rank: nextRank++ };
        return updateTask(task.id, updates);
      })
    );

    // Mark rollover as completed for today
    if (typeof window !== 'undefined') {
      localStorage.setItem(rolloverKey, 'true');
    }

    console.log(`API rollover: Successfully moved ${tomorrowSorted.length} tasks to today`);
    return { moved: tomorrowSorted.length };
  } catch (error) {
    console.error('Error during rollover:', error);
    return { moved: 0, error: true };
  }
};