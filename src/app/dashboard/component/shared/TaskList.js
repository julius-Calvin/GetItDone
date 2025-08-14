'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { DndContext, closestCenter, TouchSensor, MouseSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MdOutlineCheckBoxOutlineBlank } from 'react-icons/md';
import { ImCheckboxChecked } from 'react-icons/im';
import { BsGripVertical } from 'react-icons/bs';
import { RxCross2 } from 'react-icons/rx';
import { FaSave } from 'react-icons/fa';
import { updateTask } from '@/app/api/note-api';

const SortableTaskItem = ({
  task,
  index,
  editIdx,
  onEdit,
  onToggleFinished,
  onSave,
  onCancel,
  localTitle,
  setLocalTitle,
  localDescription,
  setLocalDescription,
  inputRef,
  textareaRef,
  isSavingEdit,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    disabled: task?.isFinished || editIdx === index,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${task?.isFinished ? 'opacity-50 ' : ''} rounded-lg p-4 text-white transition-all duration-300 ease-out bg-[#A23E48] dark:bg-gradient-to-br dark:from-[#A23E48] dark:to-[#7d2d35] ${task?.isFinished ? '' : 'hover:shadow-lg hover:scale-[1.02] dark:hover:shadow-[#A23E48]/20'} ${isDragging ? 'opacity-60 scale-98 shadow-2xl rotate-2 z-50 dragging-mobile' : ''} select-none draggable-item-mobile sortable-item-mobile`}
    >
      {editIdx === index ? (
        <form onSubmit={onSave} className="w-full">
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
                onClick={onCancel}
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 flex items-center justify-center">
              <button
                className="hover:cursor-pointer"
                type="button"
                onClick={onToggleFinished}
              >
                {task?.isFinished ? <ImCheckboxChecked /> : <MdOutlineCheckBoxOutlineBlank className="w-5 h-5" />}
              </button>
            </div>

            {!task?.isFinished && (
              <div
                {...attributes}
                {...listeners}
                className="w-8 h-8 flex items-center justify-center text-white/60 hover:text-white/80 transition-colors cursor-grab active:cursor-grabbing touch-manipulation select-none drag-handle-mobile"
                style={{ touchAction: 'none' }}
              >
                <BsGripVertical className="w-5 h-5" />
              </div>
            )}

            <div>
              <h4 className="font-bold">{task.title}</h4>
              <p className={`${task.description ? '' : 'italic text-white/50'} text-sm opacity-90`}>{task.description || 'Add your description'}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              className="w-8 h-8 flex items-center justify-center hover:cursor-pointer hover:scale-105 transition duration-300 ease-in-out"
              onClick={onEdit}
            >
              <Image src="/dashboard/edit-task.svg" className="w-5" alt="Edit task" width={20} height={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const TaskList = ({ tasks, setTasks, editIdx, setEditIdx, sensors, onDragEnd, setError }) => {
  const inputRef = useRef(null);
  const textareaRef = useRef(null);
  const [localTitle, setLocalTitle] = useState('');
  const [localDescription, setLocalDescription] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Mobile-optimized sensors
  const mobileSensors = useSensors(
    useSensor(MouseSensor, {
      // Require the mouse to move by 10 pixels before activating
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      // Press delay of 250ms, with tolerance of 10px of movement
      activationConstraint: {
        delay: 250,
        tolerance: 10,
      },
    })
  );

  const unfinishedTask = tasks.filter((task) => !task.isFinished);

  // When edit index changes, derive current unfinished tasks from source list (tasks) to avoid stale data
  useEffect(() => {
    if (editIdx !== null) {
      const currentUnfinished = tasks.filter((task) => !task.isFinished);
      if (currentUnfinished[editIdx]) {
        setLocalTitle(currentUnfinished[editIdx]?.title || '');
        setLocalDescription(currentUnfinished[editIdx]?.description || '');
        inputRef.current?.focus();
      }
    }
  }, [editIdx, tasks]);

  const handleEditClick = (idx) => {
    setEditIdx(idx);
  };

  const handleCancelButtonClick = () => {
    setLocalTitle('');
    setLocalDescription('');
    setEditIdx(null);
  };

  const handleSaveClick = async (e) => {
    e.preventDefault();
    setIsSavingEdit(true);
    if (editIdx !== null) {
      try {
        const taskId = unfinishedTask[editIdx].id;
        const originalTask = unfinishedTask[editIdx];
        // Preserve the original date field and other important fields
        const updatedData = { 
          title: localTitle, 
          description: localDescription,
          date: originalTask.date, // Preserve the original date
          rank: originalTask.rank, // Preserve the original rank
          isFinished: originalTask.isFinished // Preserve completion status
        };
        await updateTask(taskId, updatedData);

        const updatedTasks = tasks.map((t) => (t.id === taskId ? { ...t, ...updatedData } : t));
        setTasks(updatedTasks);
        setEditIdx(null);
      } catch (error) {
        setError?.('Failed to update task.');
      } finally {
        setIsSavingEdit(false);
      }
    }
  };

  const handleTaskFinished = async (e, idx) => {
    e.preventDefault();
    try {
      const taskId = unfinishedTask[idx].id;
      const originalTask = unfinishedTask[idx];
      // Preserve all original data when marking as finished
      const updatedData = { 
        ...originalTask, 
        isFinished: true,
        date: originalTask.date // Explicitly preserve the date
      };
      await updateTask(taskId, updatedData);
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updatedData : t)));
    } catch (error) {
      setError?.('Error marking task as complete.');
    }
  };

  return (
    <DndContext 
      sensors={mobileSensors} 
      collisionDetection={closestCenter} 
      onDragEnd={onDragEnd}
    >
      <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-4 dnd-context-mobile">
          {unfinishedTask.map((task, index) => (
            <SortableTaskItem
              key={task.id}
              task={task}
              index={index}
              editIdx={editIdx}
              onEdit={() => handleEditClick(index)}
              onToggleFinished={(e) => handleTaskFinished(e, index)}
              onSave={handleSaveClick}
              onCancel={handleCancelButtonClick}
              localTitle={localTitle}
              setLocalTitle={setLocalTitle}
              localDescription={localDescription}
              setLocalDescription={setLocalDescription}
              inputRef={inputRef}
              textareaRef={textareaRef}
              isSavingEdit={isSavingEdit}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};

export default TaskList;
