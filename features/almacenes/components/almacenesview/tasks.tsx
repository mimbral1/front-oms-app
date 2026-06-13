import React, { useState } from "react";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { ActionButton } from "@/components/ui/button/action-button";

interface TareasFieldProps {
  tasks: string[];
  onChange: (newTasks: string[]) => void;
}

export function TareasField({ tasks, onChange }: TareasFieldProps) {
  const [open, setOpen] = useState(false);
  const [newTask, setNewTask] = useState("");

  const handleAdd = () => {
    const trimmed = newTask.trim();
    if (trimmed && !tasks.includes(trimmed)) {
      onChange([...tasks, trimmed]);
      setNewTask("");
    }
  };

  const handleRemove = (taskToRemove: string) => {
    onChange(tasks.filter((t) => t !== taskToRemove));
  };

  return (
    <div className="flex flex-col border-b border-gray-100 pb-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">Tareas</span>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1 text-blue-600"
        >
          {open ? (
            <ChevronUpIcon className="h-4 w-4" />
          ) : (
            <ChevronDownIcon className="h-4 w-4" />
          )}
        </button>
      </div>

      {open && (
        <div className="mt-2 space-y-2">
          {/* Lista de tareas en forma de chips */}
          <div className="flex flex-wrap gap-2">
            {tasks.map((task) => (
              <div
                key={task}
                className="inline-flex items-center rounded bg-gray-200 px-2 py-1 text-xs text-gray-700"
              >
                {task}
                <button
                  onClick={() => handleRemove(task)}
                  className="ml-1 text-red-600 hover:text-red-800"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>

          {/* Input para agregar nueva tarea */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              className="w-40 rounded border px-2 py-1 text-sm"
              placeholder="Nueva tarea"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
            />
            <ActionButton variant="primary" size="sm" onClick={handleAdd}>
              Agregar
            </ActionButton>
          </div>
        </div>
      )}
    </div>
  );
}
