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
import type { Category } from '../types'

const categoriesCollection = (userId: string) => collection(db, `users/${userId}/categories`)

export async function createCategory(
  userId: string,
  data: Omit<Category, 'id' | 'userId' | 'createdAt'>
): Promise<string> {
  const docRef = await addDoc(categoriesCollection(userId), {
    ...data,
    userId,
    createdAt: Date.now(),
  })
  return docRef.id
}

export async function updateCategory(
  userId: string,
  id: string,
  data: Partial<Category>
): Promise<void> {
  const ref = doc(db, `users/${userId}/categories/${id}`)
  await updateDoc(ref, data)
}

export async function deleteCategory(userId: string, id: string): Promise<void> {
  const ref = doc(db, `users/${userId}/categories/${id}`)
  await deleteDoc(ref)
}

export function subscribeCategories(
  userId: string,
  callback: (items: Category[]) => void
): Unsubscribe {
  const q = query(categoriesCollection(userId), orderBy('name', 'asc'))
  return onSnapshot(q, (snap) => {
    const items: Category[] = []
    snap.forEach((d) => {
      items.push({ id: d.id, ...d.data() } as Category)
    })
    callback(items)
  })
}
