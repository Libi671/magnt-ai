import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import TaskClient from './TaskClient'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function TaskPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: task, error } = await supabase
    .from('tasks')
    .select('*, users(name, avatar_url, id)')
    .eq('id', id)
    .single()

  if (error || !task) {
    notFound()
  }

  // Get other tasks from the same creator
  const { data: otherTasks } = await supabase
    .from('tasks')
    .select('id, title, description, created_at')
    .eq('user_id', task.users?.id)
    .eq('is_public', true)
    .neq('id', id)
    .limit(3)

  return <TaskClient task={task} otherTasks={otherTasks || []} />
}
