import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
} from 'firebase/firestore'
import type { Unsubscribe } from 'firebase/firestore'
import { db } from './firebase'
import type { Project } from '../types'

const projectsCollection = (userId: string) => collection(db, `users/${userId}/projects`)

export async function createProject(
  userId: string,
  data: Omit<Project, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const now = Date.now()
  const docRef = await addDoc(projectsCollection(userId), {
    ...data,
    userId,
    createdAt: now,
    updatedAt: now,
  })
  return docRef.id
}

export async function updateProject(
  userId: string,
  id: string,
  data: Partial<Project>
): Promise<void> {
  const ref = doc(db, `users/${userId}/projects/${id}`)
  await updateDoc(ref, { ...data, updatedAt: Date.now() })
}

export async function deleteProject(userId: string, id: string): Promise<void> {
  const ref = doc(db, `users/${userId}/projects/${id}`)
  await deleteDoc(ref)
}

export function subscribeProjects(
  userId: string,
  callback: (projects: Project[]) => void
): Unsubscribe {
  const q = query(projectsCollection(userId), orderBy('createdAt', 'desc'))
  return onSnapshot(q, (snap) => {
    const items: Project[] = []
    snap.forEach((d) => {
      items.push({ id: d.id, ...d.data() } as Project)
    })
    callback(items)
  })
}
