'use client';

import { auth } from "@/app/api/firebase-config";
import { useState, useEffect, useRef } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { FaPlus, FaSave } from "react-icons/fa";
import { FaTrashCan } from "react-icons/fa6";
import { addTask, getTodayTasks, updateTask } from "@/app/api/note-api";
import { MdOutlineCheckBoxOutlineBlank } from "react-icons/md";
import { RxCross2 } from "react-icons/rx";
import { ImCheckboxChecked } from "react-icons/im";
import { BsGripVertical } from "react-icons/bs";
import { deleteTask } from "@/app/api/note-api";
import LoadingPage from "@/app/loading-comp/LoadingPage";
import React from "react";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MdOutlineVisibilityOff } from "react-icons/md";
import { useRouter } from "next/navigation";

// Sortable Task Item Component
const SortableTaskItem = ({ task, index, editIdx, handleEditClick, handleTaskFinished, handleSaveClick, handleCancelButtonClick, localTitle, setLocalTitle, localDescription, setLocalDescription, inputRef, textareaRef }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: task.id,
        disabled: task?.isFinished || editIdx === index // Disable dragging for finished tasks or when editing
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`${task?.isFinished ? 'opacity-50 ' : ''} bg-[#A23E48] rounded-lg p-4 text-white transition-all duration-300 ease-out ${task?.isFinished ? '' : 'hover:shadow-lg hover:scale-[1.02]'} ${isDragging ? 'opacity-60 scale-98 shadow-2xl rotate-2' : ''}`}
        >
            {editIdx === index ? (
                // Edit form - centered layout
                <form onSubmit={handleSaveClick} className="w-full">
                    <div className="flex flex-col gap-3 items-center justify-center">
                        <div className="flex flex-col gap-2 w-full">
                            <input
                                ref={inputRef}
                                className="font-bold outline-none bg-white/10 rounded px-3 py-2 text-white placeholder-white/60 border border-white/20 focus:border-white/40 transition-colors w-full"
                                value={localTitle}
                                onChange={(e) => setLocalTitle(e.target.value)}
                                placeholder="Task title"
                            />
                            <textarea
                                ref={textareaRef}
                                className="text-sm outline-none bg-white/10 rounded px-3 py-2 text-white placeholder-white/60 border border-white/20 focus:border-white/40 transition-colors resize-none w-full"
                                value={localDescription}
                                onChange={(e) => setLocalDescription(e.target.value)}
                                placeholder="Task description"
                                rows="3"
                            />
                        </div>
                        <div className="flex justify-center gap-3 pt-2">
                            <button
                                className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-all duration-200 ease-in-out hover:scale-105 flex items-center gap-2 hover:cursor-pointer"
                                type="button"
                                onClick={handleCancelButtonClick}
                            >
                                <RxCross2 className="w-4 h-4" />
                                Cancel
                            </button>
                            <button
                                className="bg-white text-[#A23E48] px-4 py-2 rounded-lg transition-all duration-200 ease-in-out hover:scale-105 flex items-center gap-2 font-semibold hover:cursor-pointer"
                                type="submit"
                            >
                                <FaSave className="w-4 h-4" />
                                Save
                            </button>
                        </div>
                    </div>
                </form>
            ) : (
                // Normal display layout
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {/* Checkbox for task completion */}
                        <div className="w-5 h-5 flex items-center justify-center">
                            <button
                                className="hover:cursor-pointer"
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleTaskFinished(e, index);
                                }}
                            >
                                {task?.isFinished ? (
                                    <ImCheckboxChecked />
                                ) : (
                                    <MdOutlineCheckBoxOutlineBlank className="w-5 h-5" />
                                )}
                            </button>
                        </div>

                        {/* Drag handle for unfinished tasks */}
                        {!task?.isFinished && (
                            <div
                                {...attributes}
                                {...listeners}
                                className="w-4 h-4 flex items-center justify-center text-white/60 hover:text-white/80 transition-colors cursor-grab active:cursor-grabbing"
                            >
                                <BsGripVertical className="w-4 h-4" />
                            </div>
                        )}

                        <div>
                            <h4 className="font-bold">{task.title}</h4>
                            <p className={`${task.description ? "" : "italic text-white/50"} text-sm opacity-90`}>
                                {task.description || "Add your description"}
                            </p>
                        </div>
                    </div>

                    {/* Edit button */}
                    <div className="flex gap-2">
                        <button
                            className="w-8 h-8 flex items-center justify-center hover:cursor-pointer hover:scale-105 transition duration-300 ease-in-out"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleEditClick(index);
                            }}
                        >
                            <img
                                src="/dashboard/edit-task.svg"
                                className="w-5"
                                alt="Edit task"
                            />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const DeleteConfirmationAlert = ({ isOpen, onClose, onConfirm, title, message }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-[#F3F1F1] rounded-lg p-6 shadow-lg w-[350px] flex flex-col gap-4" onClick={e => e.stopPropagation()}>
                <h2 className="text-lg font-bold text-[#A23E48]">{title}</h2>
                <p className="text-gray-700">{message}</p>
                <div className="flex justify-end gap-3 mt-2">
                    <button
                        className="hover:cursor-pointer font-bold px-4 rounded-lg py-2 bg-gray-300 hover:bg-gray-400/50 hover:scale-105 transition-all duration-300 ease-in-out"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button
                        className="hover:cursor-pointer hover:scale-105 font-bold px-4 py-2 rounded-lg bg-[#A23E48] text-white hover:bg-[#8e3640] transition-all duration-300 ease-in-out"
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
};

export const Today = () => {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthResolved, setIsAuthResolved] = useState(false);
    const [user, setUser] = useState(null);
    const [editIdx, setEditIdx] = useState(null);
    const [userInfo, setUserInfo] = useState({ displayName: '' });
    const [tasks, setTasks] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [error, setError] = useState(null);

    // DnD sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Fetch tasks when user changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setIsAuthResolved(true);
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
                const data = await getTodayTasks(userId);
                setTasks(data || []);
                console.log('Today tasks:', data)
            } catch (error) {
                setError("Failed to get your tasks");
            } finally {
                setIsLoading(false);
            }
        };

        if (isAuthResolved) {
            fetchTasks();
        }
    }, [user, isAuthResolved]);

    // Handle edit button click
    const handleEditClick = (idx) => {
        setEditIdx(idx);
        setTitle(tasks[idx].title);
        setDescription(tasks[idx].description);
    };

    // Handle add task (submit form)
    const handleAddTask = async (e) => {
        if (e) e.preventDefault();
        try {
            if (user) {
                const userId = user.uid;
                const taskData = { title, description, date: 'today' };
                await addTask(userId, taskData);
                setTitle("");
                setDescription("");
                setShowModal(false);
                // Refetch tasks after adding
                const data = await getTodayTasks(userId);
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

    // Handle drag end
    const handleDragEnd = async (event) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            setTasks((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over.id);

                const newTasks = arrayMove(items, oldIndex, newIndex);

                // Update ranks for all tasks
                const updatedTasks = newTasks.map((task, index) => ({
                    ...task,
                    rank: index + 1
                }));

                // Update all tasks in the database
                const updatePromises = updatedTasks.map(task =>
                    updateTask(task.id, { rank: task.rank })
                );

                Promise.all(updatePromises).catch(error => {
                    console.error("Error updating task ranks:", error);
                    setError("Failed to reorder tasks.");
                });

                return updatedTasks;
            });
        }
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
                        <span className="flex gap-2 items-center font-bold">
                            <FaPlus />
                            Add task
                        </span>
                    </button>
                </div>
            </div>
        );
    };

    const TaskList = () => {
        const inputRef = useRef(null);
        const textareaRef = useRef(null);
        const [localTitle, setLocalTitle] = useState("");
        const [localDescription, setLocalDescription] = useState("");

        const unfinishedTask = tasks.filter((task) => !task.isFinished);
        useEffect(() => {
            if (editIdx !== null) {
                setLocalTitle(tasks[editIdx]?.title || "");
                setLocalDescription(tasks[editIdx]?.description || "");
                inputRef.current?.focus();
            }
        }, [editIdx]);

        // Handle save button
        const handleSaveClick = async (e) => {
            e.preventDefault();
            if (editIdx !== null) {
                try {
                    const taskId = tasks[editIdx].id;
                    const updatedData = { title: localTitle, description: localDescription };
                    await updateTask(taskId, updatedData);

                    const updatedTasks = [...tasks];
                    updatedTasks[editIdx] = { ...updatedTasks[editIdx], ...updatedData };

                    setTasks(updatedTasks);
                    setEditIdx(null);
                } catch (error) {
                    setError("Failed to update task.");
                }
            }
        };

        // Cancel editing task
        const handleCancelButtonClick = () => {
            setLocalTitle("");
            setLocalDescription("");
            setEditIdx(null);
        };

        // Toggle check mark to finish a task
        const handleTaskFinished = async (e, idx) => {
            e.preventDefault();
            try {
                const taskId = tasks[idx].id;
                const isFinished = tasks[idx].isFinished;
                const updatedData = {
                    ...tasks[idx],
                    isFinished: true,
                };

                await updateTask(taskId, updatedData);

                setTasks((prevTasks) => {
                    const updatedTasks = [...prevTasks];
                    updatedTasks[idx] = updatedData;
                    return updatedTasks;
                });
            } catch (error) {
                console.error("Error marking task as complete:", error);
            }
        };

        // Render
        return (
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext items={tasks.map(task => task.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-4">
                        {unfinishedTask.map((task, index) => (
                            <SortableTaskItem
                                key={task.id}
                                task={task}
                                index={index}
                                editIdx={editIdx}
                                handleEditClick={handleEditClick}
                                handleTaskFinished={handleTaskFinished}
                                handleSaveClick={handleSaveClick}
                                handleCancelButtonClick={handleCancelButtonClick}
                                localTitle={localTitle}
                                setLocalTitle={setLocalTitle}
                                localDescription={localDescription}
                                setLocalDescription={setLocalDescription}
                                inputRef={inputRef}
                                textareaRef={textareaRef}
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>
        );
    };
    // Finsihed Task 
    const FinishedTask = () => {
        // Filter out finished tasks
        const finishedTasks = tasks.filter(task => task.isFinished);
        
        // State for delete confirmation alerts
        const [deleteAlert, setDeleteAlert] = useState({
            isOpen: false,
            title: "",
            message: "",
            taskId: null,
            isDeleteAll: false
        });
        
        // Close the alert
        const closeDeleteAlert = () => {
            setDeleteAlert({
                isOpen: false,
                title: "",
                message: "",
                taskId: null,
                isDeleteAll: false
            });
        };

        const handleFinishedTaskClick = async (e, taskId) => {
            e.preventDefault();
            try {
                // Find the task index in the original tasks array
                const taskIdx = tasks.findIndex(task => task.id === taskId);

                if (taskIdx !== -1) {
                    const updatedData = {
                        ...tasks[taskIdx],
                        isFinished: false,
                    };

                    await updateTask(taskId, updatedData);

                    setTasks((prevTasks) => {
                        const updatedTasks = [...prevTasks];
                        updatedTasks[taskIdx] = updatedData;
                        return updatedTasks;
                    });
                }
            } catch (error) {
                console.error("Error marking task as incomplete:", error);
            }
        };

        // Show confirmation before deleting a single task
        const confirmDeleteTask = (taskId) => {
            const taskToDelete = tasks.find(task => task.id === taskId);
            if (!taskToDelete) return;
            
            setDeleteAlert({
                isOpen: true,
                title: "Delete Task",
                message: `Are you sure you want to delete "${taskToDelete.title}"?`,
                taskId: taskId,
                isDeleteAll: false
            });
        };
        
        // Show confirmation before deleting all tasks
        const confirmDeleteAllTasks = () => {
            const taskCount = finishedTasks.length;
            
            setDeleteAlert({
                isOpen: true,
                title: "Delete All Finished Tasks",
                message: `Are you sure you want to delete all ${taskCount} finished ${taskCount === 1 ? 'task' : 'tasks'}?`,
                taskId: null,
                isDeleteAll: true
            });
        };

        // Handle actual deletion of a task
        const handleDeleteTask = async (taskId) => {
            try {
                // Delete the task from Firestore
                await deleteTask(taskId);
                
                // Remove the task from local state
                setTasks((prevTasks) => prevTasks.filter(task => task.id !== taskId));
            } catch (error) {
                console.error("Error deleting task:", error);
                setError("Failed to delete task.");
            }
        };

        // Handle actual deletion of all finished tasks
        const handleDeleteAllFinished = async () => {
            if (!finishedTasks.length) return;
            
            try {
                // Create an array of promises to delete each finished task
                const deletePromises = finishedTasks.map(task => deleteTask(task.id));
                
                // Execute all delete operations
                await Promise.all(deletePromises);
                
                // Update the local state to remove all finished tasks
                setTasks((prevTasks) => prevTasks.filter(task => !task.isFinished));
            } catch (error) {
                console.error("Error deleting all finished tasks:", error);
                setError("Failed to delete all finished tasks.");
            }
        };
        
        // Handle the confirmation from the alert
        const handleDeleteConfirm = () => {
            if (deleteAlert.isDeleteAll) {
                handleDeleteAllFinished();
            } else if (deleteAlert.taskId) {
                handleDeleteTask(deleteAlert.taskId);
            }
        };

        return (
            <div className="flex flex-col card-shadow p-5 rounded-lg bg-[#F3F1F1] mt-5">
                <div className="flex justify-between items-center mb-3">
                    <h1 className="font-bold text-xl">Finished</h1>
                    {finishedTasks.length > 0 && (
                        <button
                            onClick={confirmDeleteAllTasks}
                            className="bg-[#A23E48] text-white px-3 py-1 rounded-md text-sm hover:scale-105 transition-all duration-300 ease-in-out hover:cursor-pointer flex items-center gap-1"
                        >
                            <FaTrashCan className="w-4 h-4 bg-[#A23E48]" />
                        </button>
                    )}
                </div>
                
                {finishedTasks.length > 0 ? (
                    <div className="space-y-3">
                        {finishedTasks.map((task) => (
                            <div
                                key={task.id}
                                className="bg-[#A23E48] bg-opacity-80 rounded-lg p-3 text-white flex items-center gap-3"
                            >
                                <div className="w-5 h-5 flex items-center justify-center">
                                    <button
                                        onClick={(e) => handleFinishedTaskClick(e, task.id)}
                                        className="hover:cursor-pointer"
                                        type="button"
                                    >
                                        <ImCheckboxChecked />
                                    </button>
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold">{task.title}</h4>
                                    <p className={`${task.description ? "" : "italic text-white/50"} text-sm opacity-90`}>
                                        {task.description || "No description"}
                                    </p>
                                </div>
                                <button
                                    onClick={() => confirmDeleteTask(task.id)}
                                    className="text-white hover:cursor-pointer hover:scale-105 transition-colors duration-200"
                                    title="Delete task"
                                >
                                    <RxCross2 className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 italic">No finished tasks yet</p>
                )}
                
                {/* Render the custom alert component */}
                <DeleteConfirmationAlert
                    isOpen={deleteAlert.isOpen}
                    onClose={closeDeleteAlert}
                    onConfirm={handleDeleteConfirm}
                    title={deleteAlert.title}
                    message={deleteAlert.message}
                />
            </div>
        )
    };
    // Add this function to handle navigation to the Pomodoro page
    const navigateToPomodoro = () => {
        router.push('/dashboard/pomodoro');
    };

    // Render all element
    return (
        <div className="flex-1 bg-white relative">
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
                    <div className="p-5 flex flex-col bg-[#F3F1F1] card-shadow rounded-lg">
                        <div className="mb-2">
                            <h1 className="font-bold text-xl ">Finish your task!</h1>
                        </div>
                        {isLoading || !isAuthResolved ? (
                            <LoadingPage message="Loading data..." useFullScreen={false} />
                        ) : tasks.length > 0 ? (
                            <div className="flex flex-col">
                                <TaskList />
                                <div className="mt-5 flex justify-center items-center">
                                    <button
                                        type="button"
                                        className="button-bg text-lg"
                                        onClick={handleOpenModal}
                                    >
                                        <span className="flex gap-2 items-center font-bold">
                                            <FaPlus />
                                            Add task
                                        </span>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <NoTaskCard />
                        )}
                        {/* Modal */}
                        {showModal && (
                            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                                <form
                                    className="bg-[#F3F1F1] rounded-lg p-8 shadow-lg w-[350px] flex flex-col gap-4"
                                    onSubmit={handleAddTask}
                                >
                                    <h2 className="text-lg font-bold mb-2">Add Task</h2>
                                    <input
                                        className="border rounded p-2 mb-2 w-full outline-none"
                                        placeholder="Title"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        required
                                    />
                                    <textarea
                                        className="border rounded p-2 mb-2 w-full outline-none"
                                        placeholder="Description (optional)"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                    />
                                    {error && <p className="text-red-500 text-sm">{error}</p>}
                                    <div className="flex justify-end gap-2">
                                        <button
                                            className="px-4 rounded-lg py-2 bg-gray-300 hover:scale-105 hover:bg-gray-400/70 hover:cursor-pointer transition-all duration-300 ease-in-out"
                                            onClick={() => setShowModal(false)}
                                            type="button"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            className="px-4 py-2 rounded-lg bg-[#A23E48] text-white flex items-center gap-2 justify-center hover:cursor-pointer hover:scale-105 hover:bg-[#8e3640] transition-all duration-300 ease-in-out"
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
                    <FinishedTask />
                </div>
            </div>

            {/* Floating Eye Button */}
            <button 
                onClick={navigateToPomodoro}
                className="hover:cursor-pointer fixed bottom-6 right-6 bg-[#A23E48] text-white p-4 rounded-full shadow-lg hover:bg-[#8e3640] transition-all duration-300 hover:scale-110 z-30"
                aria-label="Focus Mode"
                title="Pomodoro Mode"
            >
                <MdOutlineVisibilityOff className="w-6 h-6" />
            </button>
        </div>
    );
};




