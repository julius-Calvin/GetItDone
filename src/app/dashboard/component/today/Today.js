'use client';

import { auth } from "@/app/api/firebase-config";
import { useState, useEffect, useRef } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { FaPlus, FaSave } from "react-icons/fa";
import { FaTrashCan } from "react-icons/fa6";
import { addTask, getTodayTasks, updateTask, rolloverTomorrowTasksToToday } from "@/app/api/note-api";
import { MdOutlineCheckBoxOutlineBlank } from "react-icons/md";
import { RxCross2 } from "react-icons/rx";
import { FiTrash2 } from "react-icons/fi";
import { ImCheckboxChecked } from "react-icons/im";
import { BsGripVertical } from "react-icons/bs";
import { deleteTask } from "@/app/api/note-api";
import LoadingPage from "@/app/loading-comp/LoadingPage";
import React from "react";
import { KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import TaskList from "@/app/dashboard/component/shared/TaskList";
import Image from 'next/image';
import { MdOutlineVisibilityOff } from "react-icons/md";
import { useRouter } from "next/navigation";

// Sortable Task Item Component
const SortableTaskItem = ({ task, index, editIdx, handleEditClick, handleTaskFinished, handleSaveClick, handleCancelButtonClick, localTitle, setLocalTitle, localDescription, setLocalDescription, inputRef, textareaRef, isSavingEdit }) => {
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
            className={`${task?.isFinished ? 'opacity-50 ' : ''} bg-[#A23E48] rounded-lg p-4 text-white transition-all duration-300 ease-out ${task?.isFinished ? '' : 'hover:shadow-lg hover:scale-[1.02] dark:hover:shadow-[#A23E48]/20'} ${isDragging ? 'opacity-60 scale-98 shadow-2xl rotate-2' : ''}`}
        >
            {editIdx === index ? (
                // Edit form - centered layout
                <form onSubmit={handleSaveClick} className="w-full">
                    <div className="flex flex-col gap-3 items-center justify-center">
                        <div className="flex flex-col gap-2 w-full">
                            <input
                                ref={inputRef}
                                className="font-bold outline-none bg-white/10 rounded px-3 py-2 text-white placeholder-white/60 border border-white/20 focus:border-white/40 transition-colors w-full disabled:opacity-60"
                                value={localTitle}
                                onChange={(e) => setLocalTitle(e.target.value)}
                                placeholder="Task title"
                                disabled={isSavingEdit}
                            />
                            <textarea
                                ref={textareaRef}
                                className="text-sm outline-none bg-white/10 rounded px-3 py-2 text-white placeholder-white/60 border border-white/20 focus:border-white/40 transition-colors resize-none w-full disabled:opacity-60"
                                value={localDescription}
                                onChange={(e) => setLocalDescription(e.target.value)}
                                placeholder="Task description"
                                rows="3"
                                disabled={isSavingEdit}
                            />
                        </div>
                        <div className="flex justify-center gap-3 pt-2">
                            <button
                                className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-all duration-200 ease-in-out hover:scale-105 flex items-center gap-2 hover:cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                                type="button"
                                onClick={handleCancelButtonClick}
                                disabled={isSavingEdit}
                            >
                                <RxCross2 className="w-4 h-4" />
                                Cancel
                            </button>
                            <button
                                className="bg-white text-[#A23E48] px-4 py-2 rounded-lg transition-all duration-200 ease-in-out hover:scale-105 flex items-center gap-2 font-semibold hover:cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                                type="submit"
                                disabled={isSavingEdit}
                            >
                                {isSavingEdit ? (
                                    <>
                                        <span className="inline-block h-4 w-4 rounded-full border-2 border-[#A23E48]/40 border-t-[#A23E48] animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <FaSave className="w-4 h-4" />
                                        Save
                                    </>
                                )}
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
                            <Image
                                src="/dashboard/edit-task.svg"
                                className="w-5"
                                alt="Edit task"
                                width={20}
                                height={20}
                            />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const DeleteConfirmationAlert = ({ isOpen, onClose, onConfirm, title, message, isProcessing }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => { if (!isProcessing) onClose(); }}>
            <div className="bg-[#F3F1F1] dark:bg-[#1e1e1e] rounded-lg p-6 shadow-lg w-[350px] flex flex-col gap-4 transition-theme" onClick={e => e.stopPropagation()}>
                <h2 className="text-lg font-bold text-[#A23E48]">{title}</h2>
                <p className="text-gray-700 dark:text-gray-300">{message}</p>
                <div className="flex justify-end gap-3 mt-2">
                    <button
                        className="hover:cursor-pointer font-bold px-4 rounded-lg py-2 bg-gray-300 dark:bg-neutral-700 hover:bg-gray-400/50 dark:hover:bg-neutral-600 hover:scale-105 transition-all duration-300 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed"
                        onClick={onClose}
                        disabled={isProcessing}
                    >
                        Cancel
                    </button>
                    <button
                        className="hover:cursor-pointer hover:scale-105 font-bold px-4 py-2 rounded-lg bg-[#A23E48] text-white hover:bg-[#8e3640] transition-all duration-300 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                        onClick={onConfirm}
                        disabled={isProcessing}
                    >
                        {isProcessing ? (
                            <>
                                <span className="inline-block h-4 w-4 rounded-full border-2 border-white/60 border-t-white animate-spin" />
                                Deleting...
                            </>
                        ) : (
                            <>Delete</>
                        )}
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
    const [isSaving, setIsSaving] = useState(false);

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

        // Listen for profile updates from Sidebar
        const handleProfileUpdated = (e) => {
            if (e.detail?.displayName) {
                setUserInfo(prev => ({ ...prev, displayName: e.detail.displayName }));
            }
        };
        if (typeof window !== 'undefined') {
            window.addEventListener('profile-updated', handleProfileUpdated);
        }

        return () => {
            unsubscribe();
            if (typeof window !== 'undefined') {
                window.removeEventListener('profile-updated', handleProfileUpdated);
            }
        };
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

    // Schedule daily rollover at local midnight while Today component is mounted
    useEffect(() => {
        if (!isAuthResolved || !user) return;

        // Track last rollover date in localStorage to prevent duplicate moves if component remounts shortly after midnight
        const lastKey = 'lastTomorrowRolloverDate';

        const scheduleNextMidnight = () => {
            const now = new Date();
            const next = new Date(now);
            next.setHours(24, 0, 0, 0); // next local midnight
            const delay = next.getTime() - now.getTime();
            const timeoutId = setTimeout(async () => {
                try {
                    const todayStr = new Date().toDateString();
                    const last = (typeof window !== 'undefined') ? localStorage.getItem(lastKey) : null;
                    if (last !== todayStr) {
                        await rolloverTomorrowTasksToToday(user.uid);
                        if (typeof window !== 'undefined') {
                            localStorage.setItem(lastKey, todayStr);
                        }
                        const refreshed = await getTodayTasks(user.uid);
                        setTasks(refreshed || []);
                    }
                } catch (e) {
                    console.error('Midnight rollover failed:', e);
                }
                scheduleNextMidnight();
            }, Math.max(0, delay));
            return timeoutId;
        };
        // Also attempt a rollover immediately if day changed while app closed
        try {
            const todayStr = new Date().toDateString();
            const last = (typeof window !== 'undefined') ? localStorage.getItem(lastKey) : null;
            if (last !== todayStr) {
                rolloverTomorrowTasksToToday(user.uid).then(() => {
                    if (typeof window !== 'undefined') localStorage.setItem(lastKey, todayStr);
                    getTodayTasks(user.uid).then(data => setTasks(data || []));
                }).catch(() => { });
            }
        } catch { /* ignore */ }
        const id = scheduleNextMidnight();
        return () => clearTimeout(id);
    }, [isAuthResolved, user]);

    // Handle edit button click
    const handleEditClick = (idx) => {
        setEditIdx(idx);
        setTitle(tasks[idx].title);
        setDescription(tasks[idx].description);
    };

    // Handle add task (submit form)
    const handleAddTask = async (e) => {
        if (e) e.preventDefault();
        setIsSaving(true);
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
        } finally {
            setIsSaving(false);
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

    // Reusable TaskList moved to shared component
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
            isDeleteAll: false,
            isProcessing: false,
        });

        // Close the alert
        const closeDeleteAlert = () => {
            setDeleteAlert({
                isOpen: false,
                title: "",
                message: "",
                taskId: null,
                isDeleteAll: false,
                isProcessing: false,
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
        const handleDeleteConfirm = async () => {
            try {
                setDeleteAlert(prev => ({ ...prev, isProcessing: true }));
                if (deleteAlert.isDeleteAll) {
                    await handleDeleteAllFinished();
                } else if (deleteAlert.taskId) {
                    await handleDeleteTask(deleteAlert.taskId);
                }
                closeDeleteAlert();
            } catch (err) {
                // Any unexpected error
                setError("Failed to delete.");
                setDeleteAlert(prev => ({ ...prev, isProcessing: false }));
            }
        };

        return (
            <div className="flex flex-col card-shadow p-5 rounded-lg bg-surface-alt dark:bg-[#1f1f1f] mt-5 transition-theme">
                <div className="flex justify-between items-center mb-3">
                    <h1 className="font-bold text-xl text-foreground">Finished</h1>
                    {finishedTasks.length > 0 && (
                        <button
                            onClick={confirmDeleteAllTasks}
                            className="brand-btn px-3 py-1 !rounded-md text-sm hover:scale-105 transition-all duration-300 ease-in-out hover:cursor-pointer flex items-center gap-1"
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
                                className="rounded-lg p-3 flex items-center gap-3 bg-[#A23E48] text-white dark:shadow-inner"
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
                                    <FiTrash2 className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 dark:text-gray-400 italic">No finished tasks yet</p>
                )}

                {/* Render the custom alert component */}
                <DeleteConfirmationAlert
                    isOpen={deleteAlert.isOpen}
                    onClose={closeDeleteAlert}
                    onConfirm={handleDeleteConfirm}
                    title={deleteAlert.title}
                    message={deleteAlert.message}
                    isProcessing={deleteAlert.isProcessing}
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
        <div className="flex-1 bg-surface transition-theme relative dark:bg-[#1f1f1f]">
            {/* Header Section */}
            <div className="w-full p-5 md:p-7 dark:bg-[#161616] transition-theme border-b border-transparent dark:border-neutral-800/80">
                <div className="flex flex-col gap-2">
                    <span className="text-3xl md:text-4xl font-bold flex flex-row gap-2">
                        <h1 className="text-foreground"> Hello,</h1>
                        <h1 className="text-[#A23E48]">
                            {userInfo.displayName ? userInfo.displayName.split(' ')[0] : ''}
                        </h1>
                    </span>
                    <h2 className="text-lg md:text-xl font-bold text-neutral-600 dark:text-neutral-400">
                        Let&apos;s finish some things today!
                    </h2>
                </div>
            </div>

            {/* Main Content Section */}
            <div className="p-4 md:p-5">
                <div className="flex-1">
                    <div className="p-4 md:p-5 flex flex-col bg-surface-alt dark:bg-[#1f1f1f] card-shadow rounded-lg transition-theme">
                        <div className="mb-2">
                            <h1 className="font-bold text-lg md:text-xl text-foreground">Finish your task!</h1>
                        </div>
                        {isLoading || !isAuthResolved ? (
                            <LoadingPage message="Loading data..." useFullScreen={false} />
                        ) : tasks.length > 0 ? (
                            <div className="flex flex-col">
                                <TaskList
                                    tasks={tasks}
                                    setTasks={setTasks}
                                    editIdx={editIdx}
                                    setEditIdx={setEditIdx}
                                    sensors={sensors}
                                    onDragEnd={handleDragEnd}
                                    setError={setError}
                                />
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
                                    className="bg-surface-alt dark:bg-[#1e1e1e] rounded-lg p-8 shadow-lg w-[350px] flex flex-col gap-4 transition-theme"
                                    onSubmit={handleAddTask}
                                >
                                    <h2 className="text-lg font-bold mb-2 text-foreground">Add Task</h2>
                                    <input
                                        className="input-fields mb-2 w-full"
                                        placeholder="Title"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        required
                                        disabled={isSaving}
                                    />
                                    <textarea
                                        className="input-fields mb-2 w-full"
                                        placeholder="Description (optional)"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        disabled={isSaving}
                                    />
                                    {error && <p className="text-red-500 dark:text-red-400 text-sm">{error}</p>}
                                    <div className="flex justify-end gap-2">
                                        <button
                                            className="px-4 rounded-lg py-2 button-no-brand"
                                            onClick={() => setShowModal(false)}
                                            type="button"
                                            disabled={isSaving}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            className="px-4 py-2 rounded-lg brand-btn flex items-center gap-2 justify-center hover:cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                                            type="submit"
                                            disabled={isLoading || isSaving}
                                        >
                                            {isSaving ? (
                                                <>
                                                    <span className="inline-block h-4 w-4 rounded-full border-2 border-white/60 border-t-white animate-spin" />
                                                    Saving...
                                                </>
                                            ) : (
                                                <>
                                                    <FaSave className="w-5 h-5" />
                                                    Save
                                                </>
                                            )}
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
                className="hover:cursor-pointer fixed bottom-5 right-5 md:bottom-6 md:right-6 bg-[#A23E48] text-white p-4 rounded-full shadow-lg hover:bg-[#8e3640] transition-all duration-300 hover:scale-110 z-30"
                aria-label="Focus Mode"
                title="Pomodoro Mode"
            >
                <MdOutlineVisibilityOff className="w-6 h-6" />
            </button>
        </div>
    );
};




