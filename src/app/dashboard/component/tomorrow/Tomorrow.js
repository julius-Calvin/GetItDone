'use client';

// React and Next.js imports
import { useState, useEffect, useRef } from "react";
import React from "react";

// Firebase imports
import { auth } from "@/app/api/firebase-config";
import { onAuthStateChanged } from "firebase/auth";
import { addTask, getTodayTasks, getTomorrowTasks, updateTask, deleteTask } from "@/app/api/note-api";

// React Icons imports
import { FaPlus, FaSave } from "react-icons/fa";
import { MdOutlineCheckBoxOutlineBlank } from "react-icons/md";
import { RxCross2 } from "react-icons/rx";
import { ImCheckboxChecked } from "react-icons/im";
import { BsGripVertical } from "react-icons/bs";
import { FiTrash2 } from "react-icons/fi";

// Component imports
import LoadingPage from "@/app/loading-comp/LoadingPage";

// Drag and Drop imports
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

/**
 * Generic Sortable Task Item Component
 * Handles both today and tomorrow task items with drag and drop functionality
 */
const SortableTaskItem = ({ 
    task, 
    index, 
    editIdx, 
    handleEditClick, 
    handleTaskFinished, 
    handleSaveClick, 
    handleCancelButtonClick, 
    localTitle, 
    setLocalTitle, 
    localDescription, 
    setLocalDescription, 
    inputRef, 
    textareaRef,
    taskType, // 'today' or 'tomorrow'
    isSavingEdit,
    confirmDeleteTask,
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: `${taskType}-${task.id}`,
        disabled: task?.isFinished || editIdx === index
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
                                className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-all duration-200 ease-in-out hover:scale-105 flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                                type="button"
                                onClick={handleCancelButtonClick}
                                disabled={isSavingEdit}
                            >
                                <RxCross2 className="w-4 h-4" />
                                Cancel
                            </button>
                            <button
                                className="bg-white text-[#A23E48] px-4 py-2 rounded-lg transition-all duration-200 ease-in-out hover:scale-105 flex items-center gap-2 font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
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
                            <img
                                src="/dashboard/edit-task.svg"
                                className="w-5"
                                alt="Edit task"
                            />
                        </button>
                        <button
                            className="w-8 h-8 flex items-center justify-center hover:cursor-pointer hover:scale-105 transition duration-300 ease-in-out text-white/90"
                            onClick={(e) => {
                                e.stopPropagation();
                                confirmDeleteTask(task.id, taskType);
                            }}
                            aria-label="Delete task"
                            title="Delete"
                        >
                            <FiTrash2 className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

/**
 * Generic Task List Component
 * Handles both today and tomorrow task lists with drag and drop functionality
 */
const TaskList = ({ 
    tasks, 
    setTasks, 
    handleDragEnd, 
    taskType, 
    editIdx, 
    modalType,
    handleEditClick,
    handleTaskFinished,
    handleSaveClick,
    handleCancelButtonClick,
    localTitle,
    setLocalTitle,
    localDescription,
    setLocalDescription,
    inputRef,
    textareaRef,
    isSavingEdit,
    confirmDeleteTask,
}) => {
    return (
        <DndContext
            sensors={useSensors(
                useSensor(PointerSensor, {
                    activationConstraint: { distance: 8 },
                }),
                useSensor(KeyboardSensor, {
                    coordinateGetter: sortableKeyboardCoordinates,
                })
            )}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <SortableContext 
                items={tasks.map(task => `${taskType}-${task.id}`)} 
                strategy={verticalListSortingStrategy}
            >
                <div className="space-y-4">
                    {tasks.map((task, index) => (
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
                            taskType={taskType}
                            isSavingEdit={isSavingEdit}
                            confirmDeleteTask={confirmDeleteTask}
                        />
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    );
};

/**
 * No Task Card Component
 * Displays when there are no tasks for a specific day
 */
const NoTaskCard = ({ type, handleOpenModal }) => {
    const isToday = type === 'today';
    const text = isToday ? 'No Task for today yet' : 'No task yet';

    return (
        <div className="p-4">
            <div className="flex flex-col items-center text-2xl font-bold gap-3">
                <span className="flex gap-1">
                    {isToday ? (
                        <>
                            No <p className="text-[#A23E48]">Task</p> for today yet
                        </>
                    ) : (
                        <p className="text-[#A23E48]">{text}</p>
                    )}
                </span>
                <button
                    type="button"
                    className="button-bg text-xl"
                    onClick={() => handleOpenModal(type)}
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

/**
 * Main Tomorrow Component
 * Manages both today and tomorrow tasks with full CRUD operations and drag-and-drop functionality
 */
export const Tomorrow = () => {
    // State management
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthResolved, setIsAuthResolved] = useState(false);
    const [user, setUser] = useState(null);
    const [userInfo, setUserInfo] = useState({ displayName: '' });
    const [todayTasks, setTodayTasks] = useState([]);
    const [tomorrowTasks, setTomorrowTasks] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState(''); // 'today' or 'tomorrow'
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [error, setError] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isSavingTodayEdit, setIsSavingTodayEdit] = useState(false);
    const [isSavingTomorrowEdit, setIsSavingTomorrowEdit] = useState(false);
    const [deleteAlert, setDeleteAlert] = useState({ open: false, taskId: null, list: null, isProcessing: false });

    // Separate edit states for today and tomorrow tasks
    const [todayEditIdx, setTodayEditIdx] = useState(null);
    const [tomorrowEditIdx, setTomorrowEditIdx] = useState(null);
    const [todayLocalTitle, setTodayLocalTitle] = useState("");
    const [todayLocalDescription, setTodayLocalDescription] = useState("");
    const [tomorrowLocalTitle, setTomorrowLocalTitle] = useState("");
    const [tomorrowLocalDescription, setTomorrowLocalDescription] = useState("");

    // Refs for form inputs
    const todayInputRef = useRef(null);
    const todayTextareaRef = useRef(null);
    const tomorrowInputRef = useRef(null);
    const tomorrowTextareaRef = useRef(null);

    // DnD sensors configuration
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 8 },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    /**
     * Move all 'tomorrow' tasks into 'today' at local midnight
     * - Persists by updating each task's date and assigning new ranks
     * - Refreshes local state afterwards
     */
    const moveTomorrowTasksToToday = async () => {
        try {
            if (!user) return;

            const userId = user.uid;

            // Fetch latest to avoid acting on stale state
            const [latestToday, latestTomorrow] = await Promise.all([
                getTodayTasks(userId),
                getTomorrowTasks(userId),
            ]);

            if (!latestTomorrow || latestTomorrow.length === 0) {
                return; // Nothing to move
            }

            // Determine next rank sequence after current today list
            let nextRank = (latestToday || []).reduce((max, t) => Math.max(max, t?.rank || 0), 0) + 1;

            // Prepare updates: move every tomorrow task to today with consecutive ranks
            const updates = latestTomorrow.map((t) => ({ id: t.id, rank: nextRank++, isFinished: t.isFinished }));

            await Promise.all(
                updates.map(({ id, rank }) => updateTask(id, { date: 'today', rank }))
            );

            // Refresh lists after move
            const [updatedToday, updatedTomorrow] = await Promise.all([
                getTodayTasks(userId),
                getTomorrowTasks(userId),
            ]);

            setTodayTasks(updatedToday);
            setTomorrowTasks(updatedTomorrow);
            // Reset any edit state referencing old indices
            setTomorrowEditIdx(null);
            setTodayEditIdx(null);
        } catch (e) {
            console.error('Failed to rollover tasks to today:', e);
            setError('Failed to rollover tasks to today.');
        }
    };

    /**
     * Schedule rollover at next local midnight and re-arm daily.
     */
    useEffect(() => {
        if (!isAuthResolved || !user) return;

        const scheduleNextMidnight = () => {
            const now = new Date();
            const next = new Date(now);
            // Set to next day 00:00:00.000 local time
            next.setHours(24, 0, 0, 0);
            const delay = next.getTime() - now.getTime();

            const timeoutId = setTimeout(async () => {
                await moveTomorrowTasksToToday();
                // Re-arm for the following midnight
                scheduleNextMidnight();
            }, Math.max(0, delay));

            return timeoutId;
        };

        const id = scheduleNextMidnight();
        return () => clearTimeout(id);
        // Intentionally only depend on auth resolution and user identity to avoid rescheduling on task changes
    }, [isAuthResolved, user]);

    /**
     * Handle authentication state changes
     */
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

    /**
     * Fetch tasks when user authentication is resolved
     */
    useEffect(() => {
        const fetchTasks = async () => {
            setIsLoading(true);
            if (!user) {
                setTodayTasks([]);
                setTomorrowTasks([]);
                setIsLoading(false);
                return;
            }
            
            try {
                const userId = user.uid;

                // Fetch today and tomorrow tasks in parallel
                const [todayTasks, tomorrowTasks] = await Promise.all([
                    getTodayTasks(userId),
                    getTomorrowTasks(userId)
                ]);

                setTodayTasks(todayTasks);
                setTomorrowTasks(tomorrowTasks);
                console.log('Today tasks:', todayTasks);
                console.log('Tomorrow tasks:', tomorrowTasks);
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

    /**
     * Handle edit button click for today tasks
     */
    const handleTodayEditClick = (idx) => {
        setTodayEditIdx(idx);
        setTodayLocalTitle(todayTasks[idx].title);
        setTodayLocalDescription(todayTasks[idx].description);
    };

    /**
     * Handle edit button click for tomorrow tasks
     */
    const handleTomorrowEditClick = (idx) => {
        setTomorrowEditIdx(idx);
        setTomorrowLocalTitle(tomorrowTasks[idx].title);
        setTomorrowLocalDescription(tomorrowTasks[idx].description);
    };

    /**
     * Handle adding new tasks
     */
    const handleAddTask = async (e) => {
        if (e) e.preventDefault();
        setIsSaving(true);
        try {
            if (user) {
                const userId = user.uid;
                const taskData = {
                    title,
                    description,
                    date: modalType
                };

                await addTask(userId, taskData);
                setTitle("");
                setDescription("");
                setShowModal(false);
                setModalType('');

                // Refetch tasks after adding
                const [todayTasks, tomorrowTasks] = await Promise.all([
                    getTodayTasks(userId),
                    getTomorrowTasks(userId)
                ]);
                setTodayTasks(todayTasks);
                setTomorrowTasks(tomorrowTasks);
            } else {
                setError("Current user is not found.");
            }
        } catch (error) {
            setError("Failed to add task.");
        } finally {
            setIsSaving(false);
        }
    };

    /**
     * Handle opening the add task modal
     */
    const handleOpenModal = (type) => {
        setTitle("");
        setDescription("");
        setError(null);
        setModalType(type);
        setShowModal(true);
    };

    /**
     * Handle drag end for today tasks
     */
    const handleTodayDragEnd = async (event) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            setTodayTasks((items) => {
                const oldIndex = items.findIndex((item) => `today-${item.id}` === active.id);
                const newIndex = items.findIndex((item) => `today-${item.id}` === over.id);

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

    /**
     * Handle drag end for tomorrow tasks
     */
    const handleTomorrowDragEnd = async (event) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            setTomorrowTasks((items) => {
                const oldIndex = items.findIndex((item) => `tomorrow-${item.id}` === active.id);
                const newIndex = items.findIndex((item) => `tomorrow-${item.id}` === over.id);

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

    /**
     * Handle save button for today task editing
     */
    const handleTodaySaveClick = async (e) => {
        e.preventDefault();
        if (todayEditIdx !== null) {
            try {
                setIsSavingTodayEdit(true);
                const taskId = todayTasks[todayEditIdx].id;
                const updatedData = { title: todayLocalTitle, description: todayLocalDescription };
                await updateTask(taskId, updatedData);

                const updatedTasks = [...todayTasks];
                updatedTasks[todayEditIdx] = { ...updatedTasks[todayEditIdx], ...updatedData };

                setTodayTasks(updatedTasks);
                setTodayEditIdx(null);
            } catch (error) {
                setError("Failed to update task.");
            } finally {
                setIsSavingTodayEdit(false);
            }
        }
    };

    /**
     * Handle save button for tomorrow task editing
     */
    const handleTomorrowSaveClick = async (e) => {
        e.preventDefault();
        if (tomorrowEditIdx !== null) {
            try {
                setIsSavingTomorrowEdit(true);
                const taskId = tomorrowTasks[tomorrowEditIdx].id;
                const updatedData = { title: tomorrowLocalTitle, description: tomorrowLocalDescription };
                await updateTask(taskId, updatedData);

                const updatedTasks = [...tomorrowTasks];
                updatedTasks[tomorrowEditIdx] = { ...updatedTasks[tomorrowEditIdx], ...updatedData };

                setTomorrowTasks(updatedTasks);
                setTomorrowEditIdx(null);
            } catch (error) {
                setError("Failed to update task.");
            } finally {
                setIsSavingTomorrowEdit(false);
            }
        }
    };

    /**
     * Cancel editing today task
     */
    const handleTodayCancelButtonClick = () => {
        setTodayLocalTitle("");
        setTodayLocalDescription("");
        setTodayEditIdx(null);
    };

    /**
     * Cancel editing tomorrow task
     */
    const handleTomorrowCancelButtonClick = () => {
        setTomorrowLocalTitle("");
        setTomorrowLocalDescription("");
        setTomorrowEditIdx(null);
    };

    /**
     * Delete confirmation flow
     */
    const confirmDeleteTask = (taskId, list) => {
        setDeleteAlert({ open: true, taskId, list, isProcessing: false });
    };

    const handleDeleteConfirm = async () => {
        if (!deleteAlert.open || !deleteAlert.taskId) return;
        try {
            setDeleteAlert((d) => ({ ...d, isProcessing: true }));
            await deleteTask(deleteAlert.taskId);

            if (deleteAlert.list === 'today') {
                setTodayTasks((prev) => {
                    const filtered = prev.filter((t) => t.id !== deleteAlert.taskId);
                    const reRanked = filtered.map((t, i) => ({ ...t, rank: i + 1 }));
                    // Persist new ranks best-effort
                    Promise.all(reRanked.map((t) => updateTask(t.id, { rank: t.rank }))).catch(() => {});
                    return reRanked;
                });
            } else if (deleteAlert.list === 'tomorrow') {
                setTomorrowTasks((prev) => {
                    const filtered = prev.filter((t) => t.id !== deleteAlert.taskId);
                    const reRanked = filtered.map((t, i) => ({ ...t, rank: i + 1 }));
                    Promise.all(reRanked.map((t) => updateTask(t.id, { rank: t.rank }))).catch(() => {});
                    return reRanked;
                });
            }

            setDeleteAlert({ open: false, taskId: null, list: null, isProcessing: false });
        } catch (err) {
            console.error('Failed to delete task:', err);
            setError('Failed to delete task.');
            setDeleteAlert({ open: false, taskId: null, list: null, isProcessing: false });
        }
    };

    const handleDeleteCancel = () => {
        if (deleteAlert.isProcessing) return; // prevent closing while processing
        setDeleteAlert({ open: false, taskId: null, list: null, isProcessing: false });
    };

    /**
     * Toggle check mark to finish a today task
     */
    const handleTodayTaskFinished = async (e, idx) => {
        e.preventDefault();
        try {
            const taskId = todayTasks[idx].id;
            const isFinished = todayTasks[idx].isFinished;
            const updatedData = {
                ...todayTasks[idx],
                isFinished: !isFinished,
                rank: isFinished ? todayTasks[idx].rank : todayTasks.length + 1,
            };

            await updateTask(taskId, updatedData);

            setTodayTasks((prevTasks) => {
                const updatedTasks = [...prevTasks];
                updatedTasks[idx] = updatedData;
                const sortedTasks = updatedTasks.sort((a, b) => a.rank - b.rank);
                return sortedTasks;
            });
        } catch (error) {
            console.error("Error marking task as complete:", error);
        }
    };

    /**
     * Toggle check mark to finish a tomorrow task
     */
    const handleTomorrowTaskFinished = async (e, idx) => {
        e.preventDefault();
        try {
            const taskId = tomorrowTasks[idx].id;
            const isFinished = tomorrowTasks[idx].isFinished;
            const updatedData = {
                ...tomorrowTasks[idx],
                isFinished: !isFinished,
                rank: isFinished ? tomorrowTasks[idx].rank : tomorrowTasks.length + 1,
            };

            await updateTask(taskId, updatedData);

            setTomorrowTasks((prevTasks) => {
                const updatedTasks = [...prevTasks];
                updatedTasks[idx] = updatedData;
                const sortedTasks = updatedTasks.sort((a, b) => a.rank - b.rank);
                return sortedTasks;
            });
        } catch (error) {
            console.error("Error marking task as complete:", error);
        }
    };

    // Update local state when edit index changes for today tasks
    useEffect(() => {
        if (todayEditIdx !== null) {
            setTodayLocalTitle(todayTasks[todayEditIdx]?.title || "");
            setTodayLocalDescription(todayTasks[todayEditIdx]?.description || "");
            todayInputRef.current?.focus();
        }
    }, [todayEditIdx, todayTasks]);

    // Update local state when edit index changes for tomorrow tasks
    useEffect(() => {
        if (tomorrowEditIdx !== null) {
            setTomorrowLocalTitle(tomorrowTasks[tomorrowEditIdx]?.title || "");
            setTomorrowLocalDescription(tomorrowTasks[tomorrowEditIdx]?.description || "");
            tomorrowInputRef.current?.focus();
        }
    }, [tomorrowEditIdx, tomorrowTasks]);

    /**
     * Get current day name
     */
    const getCurrentDay = () => {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[new Date().getDay()];
    };

    /**
     * Get tomorrow's day name
     */
    const getTomorrowDay = () => {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return days[tomorrow.getDay()];
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
                        Let's plan your tomorrow!
                    </h2>
                </div>
            </div>

            {/* Main Content Section */}
            <div className="p-5">
                <div className="flex gap-6">
                    {/* Today Card */}
                    <div className="flex-1 bg-white rounded-lg shadow-lg p-6">
                        <h3 className="text-xl font-bold mb-4">Today, {getCurrentDay()}</h3>
                        {isLoading || !isAuthResolved ? (
                            <LoadingPage message="Loading data..." useFullScreen={false} />
                        ) : todayTasks.length > 0 ? (
                            <div className="flex flex-col">
                                <TaskList
                                    tasks={todayTasks}
                                    setTasks={setTodayTasks}
                                    handleDragEnd={handleTodayDragEnd}
                                    taskType="today"
                                    editIdx={todayEditIdx}
                                    modalType={modalType}
                                    handleEditClick={handleTodayEditClick}
                                    handleTaskFinished={handleTodayTaskFinished}
                                    handleSaveClick={handleTodaySaveClick}
                                    handleCancelButtonClick={handleTodayCancelButtonClick}
                                    localTitle={todayLocalTitle}
                                    setLocalTitle={setTodayLocalTitle}
                                    localDescription={todayLocalDescription}
                                    setLocalDescription={setTodayLocalDescription}
                                    inputRef={todayInputRef}
                                    textareaRef={todayTextareaRef}
                                    isSavingEdit={isSavingTodayEdit}
                                    confirmDeleteTask={confirmDeleteTask}
                                />
                                <div className="mt-5 flex justify-center items-center">
                                    <button
                                        type="button"
                                        className="button-bg text-lg"
                                        onClick={() => handleOpenModal('today')}
                                    >
                                        <span className="flex gap-2 items-center font-bold">
                                            <FaPlus />
                                            Add task
                                        </span>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <NoTaskCard type="today" handleOpenModal={handleOpenModal} />
                        )}
                    </div>

                    {/* Tomorrow Card */}
                    <div className="flex-1 bg-white rounded-lg shadow-lg p-6">
                        <h3 className="text-xl font-bold mb-4">Tomorrow, {getTomorrowDay()}</h3>
                        {isLoading || !isAuthResolved ? (
                            <LoadingPage message="Loading data..." useFullScreen={false} />
                        ) : tomorrowTasks.length > 0 ? (
                            <div className="flex flex-col">
                                <TaskList
                                    tasks={tomorrowTasks}
                                    setTasks={setTomorrowTasks}
                                    handleDragEnd={handleTomorrowDragEnd}
                                    taskType="tomorrow"
                                    editIdx={tomorrowEditIdx}
                                    modalType={modalType}
                                    handleEditClick={handleTomorrowEditClick}
                                    handleTaskFinished={handleTomorrowTaskFinished}
                                    handleSaveClick={handleTomorrowSaveClick}
                                    handleCancelButtonClick={handleTomorrowCancelButtonClick}
                                    localTitle={tomorrowLocalTitle}
                                    setLocalTitle={setTomorrowLocalTitle}
                                    localDescription={tomorrowLocalDescription}
                                    setLocalDescription={setTomorrowLocalDescription}
                                    inputRef={tomorrowInputRef}
                                    textareaRef={tomorrowTextareaRef}
                                    isSavingEdit={isSavingTomorrowEdit}
                                    confirmDeleteTask={confirmDeleteTask}
                                />
                                <div className="mt-5 flex justify-center items-center">
                                    <button
                                        type="button"
                                        className="button-bg text-lg"
                                        onClick={() => handleOpenModal('tomorrow')}
                                    >
                                        <span className="flex gap-2 items-center font-bold">
                                            <FaPlus />
                                            Add task
                                        </span>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <NoTaskCard type="tomorrow" handleOpenModal={handleOpenModal} />
                        )}
                    </div>
                </div>

                {/* Add Task Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                        <form
                            className="bg-white rounded-lg p-8 shadow-lg w-[350px] flex flex-col gap-4"
                            onSubmit={handleAddTask}
                        >
                            <h2 className="text-lg font-bold mb-2">
                                Add {modalType === 'today' ? "Today's" : "Tomorrow's"} Task
                            </h2>
                            <input
                                className="border rounded p-2 mb-2 w-full outline-none"
                                placeholder="Title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                                disabled={isSaving}
                            />
                            <textarea
                                className="border rounded p-2 mb-2 w-full outline-none"
                                placeholder="Description (optional)"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                disabled={isSaving}
                            />
                            {error && <p className="text-red-500 text-sm">{error}</p>}
                            <div className="flex justify-end gap-2">
                                <button
                                    className="px-4 rounded-lg py-2 bg-gray-300 disabled:opacity-60 disabled:cursor-not-allowed"
                                    onClick={() => {
                                        setShowModal(false);
                                        setModalType('');
                                    }}
                                    type="button"
                                    disabled={isSaving}
                                >
                                    Cancel
                                </button>
                                <button
                                    className={`px-4 py-2 rounded-lg text-white flex items-center gap-2 justify-center hover:cursor-pointer bg-[#A23E48] disabled:opacity-60 disabled:cursor-not-allowed`}
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

                {/* Delete Confirmation Modal */}
                {deleteAlert.open && (
                    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 shadow-lg w-[360px]">
                            <h3 className="text-lg font-bold mb-2">Delete task?</h3>
                            <p className="text-sm text-black/70 mb-4">This action cannot be undone.</p>
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    className="font-bold hover:cursor-pointer hover:scale-105 px-4 py-2 rounded-lg bg-gray-300 disabled:opacity-60 disabled:cursor-not-allowed"
                                    onClick={handleDeleteCancel}
                                    disabled={deleteAlert.isProcessing}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="px-4 py-2 font-bold rounded-lg text-white bg-[#A23E48] hover:cursor-pointer hover:scale-105 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                                    onClick={handleDeleteConfirm}
                                    disabled={deleteAlert.isProcessing}
                                >
                                    {deleteAlert.isProcessing ? (
                                        <>
                                            <span className="inline-block h-4 w-4 rounded-full border-2 border-white/60 border-t-white animate-spin" />
                                            Deleting...
                                        </>
                                    ) : (
                                        'Delete'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
