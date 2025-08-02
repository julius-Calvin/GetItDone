import { db } from "./firebase-config";

import { 
    addDoc, 
    collection,
    getDocs,
    where,
    orderBy, 
    query
} from "firebase/firestore";

// Create task

export const addTask = async (userId, taskData) => {
    try {
        const docRef = await addDoc(collection(db,"tasks"), {
            ...taskData,
            userId: userId,
            createdAt: new Date().toDateString(),
            updatedAt: new Date().toDateString(),
        })
        console.log("Document written with ID: ", docRef.id);
        return { id: docRef.id, ...taskData, userId };
    } catch (error) {
        console.error("Error adding document: ", error);
        throw error;
    }
};

// READ - Get all tasks for a user
export const getUserTasks = async (userId) => {
  try {
    const q = query(
      collection(db, "tasks"), 
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
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