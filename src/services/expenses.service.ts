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
import type { Expense } from '../types'

const expensesCollection = (userId: string) => collection(db, `users/${userId}/expenses`)

export async function createExpense(
  userId: string,
  data: Omit<Expense, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const now = Date.now()
  const docRef = await addDoc(expensesCollection(userId), {
    ...data,
    userId,
    createdAt: now,
    updatedAt: now,
  })
  return docRef.id
}

export async function updateExpense(
  userId: string,
  id: string,
  data: Partial<Expense>
): Promise<void> {
  const ref = doc(db, `users/${userId}/expenses/${id}`)
  await updateDoc(ref, { ...data, updatedAt: Date.now() })
}

export async function deleteExpense(userId: string, id: string): Promise<void> {
  const ref = doc(db, `users/${userId}/expenses/${id}`)
  await deleteDoc(ref)
}

export function subscribeExpenses(
  userId: string,
  callback: (items: Expense[]) => void
): Unsubscribe {
  const q = query(expensesCollection(userId), orderBy('date', 'desc'))
  return onSnapshot(q, (snap) => {
    const items: Expense[] = []
    snap.forEach((d) => {
      items.push({ id: d.id, ...d.data() } as Expense)
    })
    callback(items)
  })
}
