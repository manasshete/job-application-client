'use client'

import React from "react"

import { useState } from 'react'
import type { Interview, Task, InterviewStatus, TaskStatus } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, Calendar, CheckCircle2, Clock, Circle } from 'lucide-react'
import { sanitizeInput, MAX_LENGTHS } from '@/lib/validation'

interface InterviewTaskSectionProps {
  interviews: Interview[]
  tasks: Task[]
  onUpdateInterviews: (interviews: Interview[]) => void
  onUpdateTasks: (tasks: Task[]) => void
}

const interviewStatusConfig: Record<InterviewStatus, { label: string; icon: React.ReactNode; color: string }> = {
  pending: { label: 'Pending', icon: <Clock className="h-3 w-3" />, color: 'text-yellow-500' },
  scheduled: { label: 'Scheduled', icon: <Calendar className="h-3 w-3" />, color: 'text-blue-500' },
  completed: { label: 'Completed', icon: <CheckCircle2 className="h-3 w-3" />, color: 'text-green-500' },
  cancelled: { label: 'Cancelled', icon: <Circle className="h-3 w-3" />, color: 'text-muted-foreground' },
}

const taskStatusConfig: Record<TaskStatus, { label: string; icon: React.ReactNode; color: string }> = {
  pending: { label: 'Pending', icon: <Circle className="h-3 w-3" />, color: 'text-gray-500' },
  'in-progress': { label: 'In Progress', icon: <Clock className="h-3 w-3" />, color: 'text-blue-500' },
  completed: { label: 'Completed', icon: <CheckCircle2 className="h-3 w-3" />, color: 'text-green-500' },
  submitted: { label: 'Submitted', icon: <CheckCircle2 className="h-3 w-3" />, color: 'text-primary' },
}

export function InterviewTaskSection({
  interviews,
  tasks,
  onUpdateInterviews,
  onUpdateTasks,
}: InterviewTaskSectionProps) {
  const [isAddingInterview, setIsAddingInterview] = useState(false)
  const [isAddingTask, setIsAddingTask] = useState(false)
  const [newInterview, setNewInterview] = useState<Omit<Interview, 'id'>>({
    round: '',
    date: '',
    status: 'pending',
    notes: '',
  })
  const [newTask, setNewTask] = useState<Omit<Task, 'id'>>({
    title: '',
    dueDate: '',
    status: 'pending',
    notes: '',
  })

  const handleAddInterview = () => {
    if (!newInterview.round.trim()) return
    
    const sanitized: Interview = {
      id: crypto.randomUUID(),
      round: sanitizeInput(newInterview.round),
      date: newInterview.date,
      status: newInterview.status,
      notes: sanitizeInput(newInterview.notes || ''),
    }
    
    onUpdateInterviews([...interviews, sanitized])
    setNewInterview({ round: '', date: '', status: 'pending', notes: '' })
    setIsAddingInterview(false)
  }

  const handleAddTask = () => {
    if (!newTask.title.trim()) return
    
    const sanitized: Task = {
      id: crypto.randomUUID(),
      title: sanitizeInput(newTask.title),
      dueDate: newTask.dueDate,
      status: newTask.status,
      notes: sanitizeInput(newTask.notes || ''),
    }
    
    onUpdateTasks([...tasks, sanitized])
    setNewTask({ title: '', dueDate: '', status: 'pending', notes: '' })
    setIsAddingTask(false)
  }

  const handleUpdateInterview = (id: string, updates: Partial<Interview>) => {
    onUpdateInterviews(
      interviews.map((interview) =>
        interview.id === id ? { ...interview, ...updates } : interview
      )
    )
  }

  const handleDeleteInterview = (id: string) => {
    onUpdateInterviews(interviews.filter((interview) => interview.id !== id))
  }

  const handleUpdateTask = (id: string, updates: Partial<Task>) => {
    onUpdateTasks(
      tasks.map((task) => (task.id === id ? { ...task, ...updates } : task))
    )
  }

  const handleDeleteTask = (id: string) => {
    onUpdateTasks(tasks.filter((task) => task.id !== id))
  }

  return (
    <div className="space-y-6">
      {/* Interviews Section */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Interview Rounds</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsAddingInterview(true)}
          >
            <Plus className="mr-1 h-4 w-4" />
            Add Round
          </Button>
        </div>

        {interviews.length === 0 && !isAddingInterview && (
          <p className="text-sm text-muted-foreground">No interview rounds yet</p>
        )}

        <div className="space-y-2">
          {interviews.map((interview) => (
            <Card key={interview.id} className="bg-muted/20">
              <CardContent className="p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{interview.round}</span>
                      <Badge variant="outline" className="flex items-center gap-1">
                        {interviewStatusConfig[interview.status].icon}
                        {interviewStatusConfig[interview.status].label}
                      </Badge>
                    </div>
                    {interview.date && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date(interview.date).toLocaleDateString()}
                      </div>
                    )}
                    {interview.notes && (
                      <p className="text-xs text-muted-foreground">{interview.notes}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Select
                      value={interview.status}
                      onValueChange={(value) =>
                        handleUpdateInterview(interview.id, {
                          status: value as InterviewStatus,
                        })
                      }
                    >
                      <SelectTrigger className="h-7 w-[110px] text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleDeleteInterview(interview.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {isAddingInterview && (
            <Card className="bg-muted/20">
              <CardContent className="space-y-3 p-3">
                <div className="grid gap-2">
                  <Label htmlFor="interview-round" className="text-xs">
                    Round Name *
                  </Label>
                  <Input
                    id="interview-round"
                    placeholder="e.g., Phone Screen, Technical Interview"
                    value={newInterview.round}
                    onChange={(e) =>
                      setNewInterview({ ...newInterview, round: e.target.value })
                    }
                    maxLength={MAX_LENGTHS.POSITION}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="grid gap-2">
                    <Label htmlFor="interview-date" className="text-xs">
                      Date
                    </Label>
                    <Input
                      id="interview-date"
                      type="date"
                      value={newInterview.date}
                      onChange={(e) =>
                        setNewInterview({ ...newInterview, date: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="interview-status" className="text-xs">
                      Status
                    </Label>
                    <Select
                      value={newInterview.status}
                      onValueChange={(value) =>
                        setNewInterview({
                          ...newInterview,
                          status: value as InterviewStatus,
                        })
                      }
                    >
                      <SelectTrigger id="interview-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="interview-notes" className="text-xs">
                    Notes
                  </Label>
                  <Textarea
                    id="interview-notes"
                    placeholder="Interview details..."
                    value={newInterview.notes}
                    onChange={(e) =>
                      setNewInterview({ ...newInterview, notes: e.target.value })
                    }
                    rows={2}
                    maxLength={MAX_LENGTHS.NOTES}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsAddingInterview(false)}
                  >
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleAddInterview}>
                    Add
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Tasks Section */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Tasks & Assignments</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsAddingTask(true)}
          >
            <Plus className="mr-1 h-4 w-4" />
            Add Task
          </Button>
        </div>

        {tasks.length === 0 && !isAddingTask && (
          <p className="text-sm text-muted-foreground">No tasks yet</p>
        )}

        <div className="space-y-2">
          {tasks.map((task) => (
            <Card key={task.id} className="bg-muted/20">
              <CardContent className="p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{task.title}</span>
                      <Badge variant="outline" className="flex items-center gap-1">
                        {taskStatusConfig[task.status].icon}
                        {taskStatusConfig[task.status].label}
                      </Badge>
                    </div>
                    {task.dueDate && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </div>
                    )}
                    {task.notes && (
                      <p className="text-xs text-muted-foreground">{task.notes}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Select
                      value={task.status}
                      onValueChange={(value) =>
                        handleUpdateTask(task.id, {
                          status: value as TaskStatus,
                        })
                      }
                    >
                      <SelectTrigger className="h-7 w-[110px] text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="submitted">Submitted</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleDeleteTask(task.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {isAddingTask && (
            <Card className="bg-muted/20">
              <CardContent className="space-y-3 p-3">
                <div className="grid gap-2">
                  <Label htmlFor="task-title" className="text-xs">
                    Task Title *
                  </Label>
                  <Input
                    id="task-title"
                    placeholder="e.g., Take-home Coding Challenge"
                    value={newTask.title}
                    onChange={(e) =>
                      setNewTask({ ...newTask, title: e.target.value })
                    }
                    maxLength={MAX_LENGTHS.POSITION}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="grid gap-2">
                    <Label htmlFor="task-date" className="text-xs">
                      Due Date
                    </Label>
                    <Input
                      id="task-date"
                      type="date"
                      value={newTask.dueDate}
                      onChange={(e) =>
                        setNewTask({ ...newTask, dueDate: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="task-status" className="text-xs">
                      Status
                    </Label>
                    <Select
                      value={newTask.status}
                      onValueChange={(value) =>
                        setNewTask({
                          ...newTask,
                          status: value as TaskStatus,
                        })
                      }
                    >
                      <SelectTrigger id="task-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="submitted">Submitted</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="task-notes" className="text-xs">
                    Notes
                  </Label>
                  <Textarea
                    id="task-notes"
                    placeholder="Task details..."
                    value={newTask.notes}
                    onChange={(e) =>
                      setNewTask({ ...newTask, notes: e.target.value })
                    }
                    rows={2}
                    maxLength={MAX_LENGTHS.NOTES}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsAddingTask(false)}
                  >
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleAddTask}>
                    Add
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
