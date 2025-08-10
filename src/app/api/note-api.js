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
        // Get current task count for the specific date
        let taskCount = 0;
        if (taskData.date === 'tomorrow') {
            const tomorrowTasks = await getTomorrowTasks(userId);
            taskCount = tomorrowTasks.length;
        } else {
            const todayTasks = await getTodayTasks(userId);
            taskCount = todayTasks.length;
        }

        const docRef = await addDoc(collection(db,"tasks"), {
            ...taskData,
            isFinished: false,
            userId: userId,
            rank: taskCount + 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        })
        console.log(taskData);
        console.log("Document written with ID: ", docRef.id);
        return { id: docRef.id, ...taskData, userId };
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
      // Include tasks with date = 'today' or no date field (legacy tasks)
      if (data.date === 'today' || !data.date) {
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