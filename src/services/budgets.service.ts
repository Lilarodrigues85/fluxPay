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
import type { Budget } from '../types'

const budgetsCollection = (userId: string) => collection(db, `users/${userId}/budgets`)

export async function createBudget(
  userId: string,
  data: Omit<Budget, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const now = Date.now()
  const ref = await addDoc(budgetsCollection(userId), {
    ...data,
    userId,
    createdAt: now,
    updatedAt: now,
  })
  return ref.id
}

export async function updateBudget(
  userId: string,
  id: string,
  data: Partial<Budget>
): Promise<void> {
  const ref = doc(db, `users/${userId}/budgets/${id}`)
  await updateDoc(ref, { ...data, updatedAt: Date.now() })
}

export async function deleteBudget(userId: string, id: string): Promise<void> {
  const ref = doc(db, `users/${userId}/budgets/${id}`)
  await deleteDoc(ref)
}

export function subscribeBudgets(
  userId: string,
  callback: (items: Budget[]) => void
): Unsubscribe {
  const q = query(budgetsCollection(userId), orderBy('createdAt', 'asc'))
  return onSnapshot(q, (snap) => {
    const items: Budget[] = []
    snap.forEach((d) => items.push({ id: d.id, ...d.data() } as Budget))
    callback(items)
  })
}
