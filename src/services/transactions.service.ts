import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  writeBatch,
  where,
  getDocs,
} from 'firebase/firestore'
import type { Unsubscribe } from 'firebase/firestore'
import { addWeeks, addMonths, addYears } from 'date-fns'
import { db } from './firebase'
import type { Transaction } from '../types'

const txCollection = (userId: string) => collection(db, `users/${userId}/transactions`)

export async function createTransaction(
  userId: string,
  data: Omit<Transaction, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const now = Date.now()
  const docRef = await addDoc(txCollection(userId), {
    ...data,
    userId,
    createdAt: now,
    updatedAt: now,
  })
  return docRef.id
}

export async function updateTransaction(
  userId: string,
  id: string,
  data: Partial<Transaction>
): Promise<void> {
  const ref = doc(db, `users/${userId}/transactions/${id}`)
  await updateDoc(ref, { ...data, updatedAt: Date.now() })
}

export async function deleteTransaction(userId: string, id: string): Promise<void> {
  const ref = doc(db, `users/${userId}/transactions/${id}`)
  await deleteDoc(ref)
}

export async function deleteRecurringGroup(userId: string, groupId: string): Promise<number> {
  const q = query(txCollection(userId), where('recurring.groupId', '==', groupId))
  const snap = await getDocs(q)
  if (snap.empty) return 0
  const batch = writeBatch(db)
  snap.docs.forEach((d) => batch.delete(d.ref))
  await batch.commit()
  return snap.size
}

function advanceDate(timestamp: number, frequency: 'weekly' | 'monthly' | 'yearly', n: number): number {
  const d = new Date(timestamp)
  if (frequency === 'weekly') return addWeeks(d, n).getTime()
  if (frequency === 'monthly') return addMonths(d, n).getTime()
  return addYears(d, n).getTime()
}

export async function createRecurringSeries(
  userId: string,
  base: Omit<Transaction, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'recurring'>,
  frequency: 'weekly' | 'monthly' | 'yearly',
  total: number
): Promise<{ count: number; groupId: string }> {
  const groupId = `rec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const now = Date.now()
  const safeTotal = Math.max(1, Math.min(60, Math.floor(total)))

  let batch = writeBatch(db)
  let count = 0
  for (let i = 0; i < safeTotal; i++) {
    const docRef = doc(txCollection(userId))
    batch.set(docRef, {
      ...base,
      dueDate: advanceDate(base.dueDate, frequency, i),
      recurring: {
        frequency,
        groupId,
        occurrence: i + 1,
        total: safeTotal,
      },
      userId,
      createdAt: now,
      updatedAt: now,
    })
    count++
    if (count % 450 === 0) {
      await batch.commit()
      batch = writeBatch(db)
    }
  }
  if (count % 450 !== 0) await batch.commit()
  return { count, groupId }
}

export function subscribeTransactions(
  userId: string,
  callback: (transactions: Transaction[]) => void
): Unsubscribe {
  const q = query(txCollection(userId), orderBy('dueDate', 'desc'))
  return onSnapshot(q, (snap) => {
    const items: Transaction[] = []
    snap.forEach((d) => {
      items.push({ id: d.id, ...d.data() } as Transaction)
    })
    callback(items)
  })
}
