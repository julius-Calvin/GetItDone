'use client';

// React and Next.js imports
import { useState, useEffect, useRef } from "react";
import React from "react";
import Image from 'next/image';

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
    TouchSensor,
    MouseSensor,
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
        disabled: editIdx === index
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`bg-[#A23E48] dark:bg-gradient-to-br dark:from-[#A23E48] dark:to-[#7d2d35] rounded-lg p-4 text-white transition-all duration-300 ease-out hover:shadow-lg hover:scale-[1.02] dark:hover:shadow-[#A23E48]/20 ${isDragging ? 'opacity-60 scale-98 shadow-2xl rotate-2 z-50 dragging-mobile' : ''} select-none draggable-item-mobile sortable-item-mobile`}
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
                        {/* Drag handle */}
                        <div
                            {...attributes}
                            {...listeners}
                            className="w-8 h-8 flex items-center justify-center text-white/60 hover:text-white/80 transition-colors cursor-grab active:cursor-grabbing touch-manipulation select-none drag-handle-mobile"
                            style={{ touchAction: 'none' }}
                        >
                            <BsGripVertical className="w-5 h-5" />
                        </div>
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
    taskType,
    editIdx,
    handleEditClick,
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
    sensors,
    handleDragEnd,
}) => (
    <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
    >
        <SortableContext
            items={tasks.map(task => `${taskType}-${task.id}`)}
            strategy={verticalListSortingStrategy}
        >
            <div className="space-y-4 dnd-context-mobile">
                {tasks.map((task, index) => (
                    <SortableTaskItem
                        key={task.id}
                        task={task}
                        index={index}
                        editIdx={editIdx}
                        handleEditClick={handleEditClick}
                        // completion functionality removed
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

    // Mobile-optimized DnD sensors configuration
    const sensors = useSensors(
        useSensor(MouseSensor, { 
            activationConstraint: { 
                distance: 10 
            } 
        }),
        useSensor(TouchSensor, { 
            activationConstraint: { 
                delay: 250, 
                tolerance: 10 
            } 
        }),
        useSensor(KeyboardSensor, { 
            coordinateGetter: sortableKeyboardCoordinates 
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

            // Check if rollover has already been done today using localStorage
            const lastRolloverKey = `lastRollover_${userId}`;
            const today = new Date().toDateString();
            const lastRollover = localStorage.getItem(lastRolloverKey);
            
            if (lastRollover === today) {
                console.log('Rollover already completed today, skipping...');
                return;
            }

            // Fetch latest to avoid acting on stale state
            const [latestToday, latestTomorrow] = await Promise.all([
                getTodayTasks(userId),
                getTomorrowTasks(userId),
            ]);

            if (!latestTomorrow || latestTomorrow.length === 0) {
                // Still mark as completed even if no tasks to move
                localStorage.setItem(lastRolloverKey, today);
                return; // Nothing to move
            }

            console.log(`Moving ${latestTomorrow.length} tasks from tomorrow to today...`);

            // Determine next rank sequence after current today list
            let nextRank = (latestToday || []).reduce((max, t) => Math.max(max, t?.rank || 0), 0) + 1;

            // Prepare updates: move every tomorrow task to today with consecutive ranks
            const updates = latestTomorrow.map((t) => ({ id: t.id, rank: nextRank++, isFinished: t.isFinished }));

            await Promise.all(
                updates.map(({ id, rank }) => updateTask(id, { date: 'today', rank }))
            );

            // Mark rollover as completed for today
            localStorage.setItem(lastRolloverKey, today);

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

            console.log('Rollover completed successfully');
        } catch (e) {
            console.error('Failed to rollover tasks to today:', e);
            setError('Failed to rollover tasks to today.');
        }
    };

    /**
     * Schedule rollover at next local midnight and re-arm daily.
     * Also check for missed rollovers when component mounts.
     * TEMPORARILY DISABLED FOR DEBUGGING
     */
    useEffect(() => {
        if (!isAuthResolved || !user) return;

        console.log('Rollover effect disabled for debugging');
        
        // TEMPORARY: Disable automatic rollover to debug the issue
        // The rollover functionality has been temporarily disabled to isolate the problem
        // where tomorrow tasks are moving to today tasks unexpectedly.
        
        return () => {
            console.log('Rollover cleanup (disabled)');
        };
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
                console.log('Tasks fetched - Today:', todayTasks.length, 'Tomorrow:', tomorrowTasks.length);
                
                // Debug: Log the actual tasks and their dates
                console.log('TODAY TASKS:', todayTasks.map(t => ({ id: t.id, title: t.title, date: t.date })));
                console.log('TOMORROW TASKS:', tomorrowTasks.map(t => ({ id: t.id, title: t.title, date: t.date })));
                
                // Debug: Log any tomorrow tasks that might be mislabeled
                tomorrowTasks.forEach(task => {
                    if (task.date !== 'tomorrow') {
                        console.warn('Found tomorrow task with incorrect date:', task);
                    }
                });
                
                // Debug: Log any today tasks that might be mislabeled
                todayTasks.forEach(task => {
                    if (task.date === 'tomorrow') {
                        console.warn('Found today task with tomorrow date:', task);
                    }
                });
            } catch (error) {
                console.error('Error fetching tasks:', error);
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
                    date: modalType // Ensure date is explicitly set to modalType ('today' or 'tomorrow')
                };

                console.log(`Adding ${modalType} task:`, taskData);
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
                
                console.log(`Task added successfully. Today: ${todayTasks.length}, Tomorrow: ${tomorrowTasks.length}`);
            } else {
                setError("Current user is not found.");
            }
        } catch (error) {
            console.error('Error adding task:', error);
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

                // Update all tasks in the database - preserve date field
                const updatePromises = updatedTasks.map(task =>
                    updateTask(task.id, { 
                        rank: task.rank,
                        date: task.date || 'today' // Ensure date is preserved
                    })
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

                // Update all tasks in the database - preserve date field
                const updatePromises = updatedTasks.map(task =>
                    updateTask(task.id, { 
                        rank: task.rank,
                        date: task.date || 'tomorrow' // Ensure date is preserved
                    })
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
                const originalTask = todayTasks[todayEditIdx];
                // Preserve the original date and other important fields
                const updatedData = { 
                    title: todayLocalTitle, 
                    description: todayLocalDescription,
                    date: originalTask.date || 'today', // Ensure date is preserved
                    rank: originalTask.rank,
                    isFinished: originalTask.isFinished
                };
                await updateTask(taskId, updatedData);

                const updatedTasks = [...todayTasks];
                updatedTasks[todayEditIdx] = { ...updatedTasks[todayEditIdx], ...updatedData };

                setTodayTasks(updatedTasks);
                setTodayEditIdx(null);
                console.log('Today task updated successfully:', updatedData);
            } catch (error) {
                console.error('Error updating today task:', error);
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
                const originalTask = tomorrowTasks[tomorrowEditIdx];
                // Preserve the original date and other important fields
                const updatedData = { 
                    title: tomorrowLocalTitle, 
                    description: tomorrowLocalDescription,
                    date: originalTask.date || 'tomorrow', // Ensure date is preserved
                    rank: originalTask.rank,
                    isFinished: originalTask.isFinished
                };
                await updateTask(taskId, updatedData);

                const updatedTasks = [...tomorrowTasks];
                updatedTasks[tomorrowEditIdx] = { ...updatedTasks[tomorrowEditIdx], ...updatedData };

                setTomorrowTasks(updatedTasks);
                setTomorrowEditIdx(null);
                console.log('Tomorrow task updated successfully:', updatedData);
            } catch (error) {
                console.error('Error updating tomorrow task:', error);
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
                    // Persist new ranks best-effort with date preservation
                    Promise.all(reRanked.map((t) => updateTask(t.id, { 
                        rank: t.rank,
                        date: t.date || 'today' 
                    }))).catch(() => { });
                    return reRanked;
                });
            } else if (deleteAlert.list === 'tomorrow') {
                setTomorrowTasks((prev) => {
                    const filtered = prev.filter((t) => t.id !== deleteAlert.taskId);
                    const reRanked = filtered.map((t, i) => ({ ...t, rank: i + 1 }));
                    // Persist new ranks best-effort with date preservation
                    Promise.all(reRanked.map((t) => updateTask(t.id, { 
                        rank: t.rank,
                        date: t.date || 'tomorrow' 
                    }))).catch(() => { });
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
    // Completion toggle removed

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
        <div className="flex-1 bg-surface transition-theme relative dark:bg-[#1f1f1f]">
            {/* Header Section */}
            <div className="w-full p-5 md:p-7 dark:bg-[#161616] transition-theme border-b border-transparent dark:border-neutral-800/80">
                <div className="flex flex-col gap-2">
                    <span className="text-3xl md:text-4xl font-bold flex flex-row gap-2">
                        <h1>Hello,</h1>
                        <h1 className="text-[#A23E48]">
                            {userInfo.displayName ? userInfo.displayName.split(' ')[0] : ''}
                        </h1>
                    </span>
                    <h2 className="text-lg md:text-xl font-bold text-neutral-600 dark:text-neutral-400">
                        Let&apos;s plan your tomorrow!
                    </h2>
                </div>
            </div>

            {/* Main Content Section */}
            <div className="p-4 md:p-5">
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Today Card */}
                    <div className="flex-1 dark:bg-[#1f1f1f] rounded-lg shadow-lg p-5 transition-theme card-shadow">
                        <h3 className="text-lg md:text-xl font-bold mb-4">Today, {getCurrentDay()}</h3>
                        {isLoading || !isAuthResolved ? (
                            <LoadingPage message="Loading data..." useFullScreen={false} />
                        ) : todayTasks.length > 0 ? (
                            <div className="flex flex-col">
                                <TaskList
                                    tasks={todayTasks}
                                    taskType="today"
                                    editIdx={todayEditIdx}
                                    handleEditClick={handleTodayEditClick}
                                    // completion removed
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
                                    sensors={sensors}
                                    handleDragEnd={handleTodayDragEnd}
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
                    <div className="flex-1 dark:bg-[#1f1f1f] rounded-lg shadow-lg p-5 transition-theme card-shadow">
                        <h3 className="text-lg md:text-xl font-bold mb-4">Tomorrow, {getTomorrowDay()}</h3>
                        {isLoading || !isAuthResolved ? (
                            <LoadingPage message="Loading data..." useFullScreen={false} />
                        ) : tomorrowTasks.length > 0 ? (
                            <div className="flex flex-col">
                                <TaskList
                                    tasks={tomorrowTasks}
                                    taskType="tomorrow"
                                    editIdx={tomorrowEditIdx}
                                    handleEditClick={handleTomorrowEditClick}
                                    // completion removed
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
                                    sensors={sensors}
                                    handleDragEnd={handleTomorrowDragEnd}
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
                            className="bg-surface rounded-lg p-8 shadow-lg w-[350px] flex flex-col gap-4 transition-theme border border-neutral-200 dark:border-neutral-800"
                            onSubmit={handleAddTask}
                        >
                            <h2 className="text-lg font-bold mb-2">
                                Add {modalType === 'today' ? "Today's" : "Tomorrow's"} Task
                            </h2>
                            <input
                                className="border bg-surface input-fields border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 rounded p-2 mb-2 w-full outline-none focus:ring-2 focus:ring-[#A23E48]/40 focus:border-[#A23E48]/50"
                                placeholder="Title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                                disabled={isSaving}
                            />
                            <textarea
                                className="border bg-surface input-fields dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 rounded p-2 mb-2 w-full outline-none focus:ring-2 focus:ring-[#A23E48]/40 focus:border-[#A23E48]/50 resize-none"
                                placeholder="Description (optional)"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                disabled={isSaving}
                                rows={4}
                            />
                            {error && <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>}
                            <div className="flex justify-end gap-2">
                                <button
                                    className="px-4 button-no-brand rounded-lg py-2"
                                    onClick={() => { setShowModal(false); setModalType(''); }}
                                    type="button"
                                    disabled={isSaving}
                                >
                                    Cancel
                                </button>
                                <button
                                  className="brand-btn px-4 py-2 rounded-lg text-white flex items-center gap-2 justify-center hover:cursor-pointer bg-[#A23E48] hover:bg-[#8e3640] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 ease-in-out"
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
                        <div className="bg-white dark:bg-[#1e1e1e] rounded-lg p-6 shadow-lg w-[360px] transition-theme">
                            <h3 className="text-lg font-bold mb-2">Delete task?</h3>
                            <p className="text-sm text-neutral-600 dark:text-neutral-300 mb-4">This action cannot be undone.</p>
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    className="font-bold hover:cursor-pointer hover:scale-105 px-4 py-2 rounded-lg bg-gray-300 dark:bg-neutral-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
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
