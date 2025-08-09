'use client';

import { auth } from "@/app/api/firebase-config";
import { useState, useEffect, useRef } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { FaPlus, FaSave } from "react-icons/fa";
import { addTask, getTodayTasks, updateTask } from "@/app/api/note-api";
import { MdOutlineCheckBoxOutlineBlank } from "react-icons/md";
import { RxCross2 } from "react-icons/rx";
import { ImCheckboxChecked } from "react-icons/im";
import { BsGripVertical } from "react-icons/bs";
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

export const Today = () => {
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
                    <span className="flex gap-1">No <p className="text-[#2E5A88]">Task</p> for today yet</span>
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
                    isFinished: !isFinished,
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

        return (
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext items={tasks.map(task => task.id)} strategy={verticalListSortingStrategy}>
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
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>
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
                <div className="flex-1 ">
                    <div className="p-5 flex flex-col bg-[#F3F1F1] card-shadow rounded-lg">
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
                                    className="bg-white rounded-lg p-8 shadow-lg w-[350px] flex flex-col gap-4"
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
                                            className="px-4 rounded-lg py-2 bg-gray-300"
                                            onClick={() => setShowModal(false)}
                                            type="button"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            className="px-4 py-2 rounded-lg bg-[#2E5A88] text-white flex items-center gap-2 justify-center hover:cursor-pointer"
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




