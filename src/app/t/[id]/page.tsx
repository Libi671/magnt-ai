import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import TaskClient from './TaskClient'

interface PageProps {
  params: Promise<{ id: string }>
}

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://magnt.ai'

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()

  const { data: task } = await supabase
    .from('tasks')
    .select('title, description')
    .eq('id', id)
    .single()

  if (!task) {
    return {
      title: 'מגנט לא נמצא',
    }
  }

  return {
    title: `${task.title} - Magnt.AI`,
    description: task.description || `אתגר אינטראקטיבי: ${task.title}`,
    openGraph: {
      title: `${task.title} - Magnt.AI`,
      description: task.description || `אתגר אינטראקטיבי: ${task.title}`,
      images: [
        {
          url: `${baseUrl}/logo.png`,
          width: 1200,
          height: 630,
          alt: task.title,
        },
      ],
      type: 'website',
      url: `${baseUrl}/t/${id}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${task.title} - Magnt.AI`,
      description: task.description || `אתגר אינטראקטיבי: ${task.title}`,
      images: [`${baseUrl}/logo.png`],
    },
  }
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
