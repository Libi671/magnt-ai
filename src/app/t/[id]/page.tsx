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
    .select('*, users(name, avatar_url)')
    .eq('id', id)
    .single()

  if (error || !task) {
    notFound()
  }

  return <TaskClient task={task} />
}
