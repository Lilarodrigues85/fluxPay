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
import type { Savings } from '../types'

const savingsCollection = (userId: string) => collection(db, `users/${userId}/savings`)

export async function createSavings(
  userId: string,
  data: Omit<Savings, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const now = Date.now()
  const docRef = await addDoc(savingsCollection(userId), {
    ...data,
    userId,
    createdAt: now,
    updatedAt: now,
  })
  return docRef.id
}

export async function updateSavings(
  userId: string,
  id: string,
  data: Partial<Savings>
): Promise<void> {
  const ref = doc(db, `users/${userId}/savings/${id}`)
  await updateDoc(ref, { ...data, updatedAt: Date.now() })
}

export async function deleteSavings(userId: string, id: string): Promise<void> {
  const ref = doc(db, `users/${userId}/savings/${id}`)
  await deleteDoc(ref)
}

export function subscribeSavings(
  userId: string,
  callback: (items: Savings[]) => void
): Unsubscribe {
  const q = query(savingsCollection(userId), orderBy('amount', 'desc'))
  return onSnapshot(q, (snap) => {
    const items: Savings[] = []
    snap.forEach((d) => {
      items.push({ id: d.id, ...d.data() } as Savings)
    })
    callback(items)
  })
}
