'use client';

import { auth } from "@/app/api/firebase-config";
import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { FaPlus, FaSave } from "react-icons/fa";
import { addTask, getUserTasks } from "@/app/api/note";
import { MdOutlineCheckBoxOutlineBlank } from "react-icons/md";
import LoadingPage from "@/app/loading-comp/LoadingPage";

export const Today = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthResolved, setIsAuthResolved] = useState(false); // New state to track auth resolution
    const [user, setUser] = useState(null);
    const [userInfo, setUserInfo] = useState({ displayName: '' });
    const [tasks, setTasks] = useState([]);
    const [editIdx, setEditIdx] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [error, setError] = useState(null);

    // Fetch tasks when user changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setIsAuthResolved(true); // Mark auth as resolved
            if (currentUser) {
                setUserInfo({ displayName: currentUser.displayName });
            } else {
                setUserInfo({ displayName: '' });
            }
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const fetchTasks = async () => {
            setIsLoading(true);
            if (!user) {
                setTasks([]);
                setIsLoading(false);
                return;
            }
            try {
                const userId = user.uid;
                const data = await getUserTasks(userId);
                setTasks(data || []);
            } catch (error) {
                setError("Failed to get your tasks");
            } finally {
                setIsLoading(false);
            }
        };

        if (isAuthResolved) {
            fetchTasks(); // Fetch tasks only after auth is resolved
        }
    }, [user, isAuthResolved]);

    // Handle edit button click
    const handleEditClick = (idx) => {
        setEditIdx(idx);
        setIsEditing(true);
        setTitle(tasks[idx].title);
        setDescription(tasks[idx].description);
    };

    // Handle save button click
    const handleSaveClick = () => {
        setIsEditing(false);
        setEditIdx(null);
        // Optionally: update the task in the backend here
    };

    // Handle add task (submit form)
    const handleAddTask = async (e) => {
        if (e) e.preventDefault();
        try {
            if (user) {
                const userId = user.uid;
                await addTask(userId, { title, description });
                setTitle("");
                setDescription("");
                setShowModal(false);
                // Refetch tasks after adding
                const data = await getUserTasks(userId);
                setTasks(data || []);
            } else {
                setError("Current user is not found.");
            }
        } catch (error) {
            setError("Failed to add task.");
        }
    };

    // Handle opening the modal
    const handleOpenModal = () => {
        setTitle("");
        setDescription("");
        setError(null);
        setShowModal(true);
    };

    const NoTaskCard = () => {
        return (
            <div className="p-4">
                <div className="flex flex-col items-center text-2xl font-bold gap-3">
                    <span className="flex gap-1">No <p className="text-[#A23E48]">Task</p> for today yet</span>
                    <button
                        type="button"
                        className="button-bg text-xl"
                        onClick={handleOpenModal}
                    >
                        <span className="flex gap-2 items-center">
                            <FaPlus />
                            Add task
                        </span>
                    </button>
                </div>
            </div>
        );
    };

    const TaskList = () => {
        return (
            tasks.map((task, idx) => (
                <div key={task.id || idx} className="bg-[#A23E48] rounded-lg p-4 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {!isEditing && (
                                <div className="w-5 h-5 flex items-center justify-center">
                                    <button className="hover:cursor-pointer">
                                        <MdOutlineCheckBoxOutlineBlank className="w-5 h-5" />
                                    </button>
                                </div>
                            )}
                            <div>
                                {isEditing && editIdx === idx ? (
                                    <div className="flex flex-row gap-10">
                                        <div className="flex flex-col flex-1 w-90">
                                            <input
                                                className="font-bold outline-none"
                                                value={title}
                                                onChange={(e) => setTitle(e.target.value)}
                                            />
                                            <textarea
                                                className="text-sm opacity-90 outline-none"
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                            />
                                        </div>
                                        <div className="flex flex-row items-center ml-110">
                                            <button
                                                className="hover:scale-105 hover:cursor-pointer transition duration-300 ease-in-out"
                                                onClick={handleSaveClick}
                                            >
                                                <FaSave className="w-4.5 h-4.5" />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <h4 className="font-bold">{task.title}</h4>
                                        <p className="text-sm opacity-90">{task.description}</p>
                                    </>
                                )}
                            </div>
                        </div>
                        {!isEditing && (
                            <div className="flex gap-2">
                                <button
                                    className="w-8 h-8 flex items-center justify-center hover:cursor-pointer hover:scale-105 transition duration-300 ease-in-out"
                                    onClick={() => handleEditClick(idx)}
                                >
                                    <img
                                        src="/dashboard/edit-task.svg"
                                        className="w-5"
                                        alt="Edit task"
                                    />
                                </button>
                                <button className="w-8 h-8 flex items-center justify-center hover:cursor-grab active:cursor-grabbing hover:scale-105 transition duration-300 ease-in-out">
                                    <img
                                        src="/dashboard/drag-task.svg"
                                        className="w-7"
                                        alt="Drag task"
                                    />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            ))
        );
    };


    return (
        <div className="flex-1 bg-white">
            {/* Header Section */}
            <div className="w-full p-7 bg-white">
                <div className="flex flex-col gap-2">
                    <span className="text-4xl font-bold flex flex-row gap-2">
                        <h1>Hello,</h1>
                        <h1 className="text-[#A23E48]">
                            {userInfo.displayName ? userInfo.displayName.split(' ')[0] : ''}
                        </h1>
                    </span>
                    <h2 className="text-xl font-bold text-black/30">
                        Let's finish some things today!
                    </h2>
                </div>
            </div>

            {/* Main Content Section */}
            <div className="p-5">
                <div className="flex-1">
                    <div className="p-5 flex flex-col gap-4 bg-[#F3F1F1] card-shadow rounded-lg">
                        {isLoading || !isAuthResolved ? (
                            <LoadingPage message="Loading data..." useFullScreen = {false}/>
                        ) : tasks.length > 0 ? (
                            <TaskList />
                        ) : (
                            <NoTaskCard />
                        )}
                        {/* Modal */}
                        {showModal && (
                            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                                <form
                                    className="bg-white rounded-lg p-8 shadow-lg w-[350px] flex flex-col gap-4"
                                    onSubmit={handleAddTask}
                                >
                                    <h2 className="text-lg font-bold mb-2">Add Task</h2>
                                    <input
                                        className="border rounded p-2 mb-2 w-full outline-none"
                                        placeholder="Title"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                    />
                                    <textarea
                                        className="border rounded p-2 mb-2 w-full outline-none"
                                        placeholder="Description"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                    />
                                    {error && <p className="text-red-500 text-sm">{error}</p>}
                                    <div className="flex justify-end gap-2">
                                        <button
                                            className="px-4 rounded-lg py-2 bg-gray-300"
                                            onClick={() => setShowModal(false)}
                                            type="button"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            className="px-4 py-2 rounded-lg bg-[#A23E48] text-white flex items-center gap-2 justify-center hover:cursor-pointer"
                                            type="submit"
                                        >
                                            <FaSave className="w-5 h-5" />
                                            Save
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};




