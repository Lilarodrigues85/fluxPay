import { collection, doc, setDoc, getDoc, query, orderBy, onSnapshot } from 'firebase/firestore'
import type { Unsubscribe } from 'firebase/firestore'
import { db } from './firebase'
import type { NetWorthSnapshot } from '../types'

const snapshotsCollection = (userId: string) => collection(db, `users/${userId}/networthSnapshots`)

export function getYearMonth(date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

export async function upsertSnapshot(
  userId: string,
  data: Omit<NetWorthSnapshot, 'id' | 'userId' | 'createdAt'>
): Promise<void> {
  const ref = doc(db, `users/${userId}/networthSnapshots/${data.yearMonth}`)
  const existing = await getDoc(ref)
  if (existing.exists()) return // só registra a primeira vez no mês
  await setDoc(ref, {
    ...data,
    userId,
    createdAt: Date.now(),
  })
}

export function subscribeSnapshots(
  userId: string,
  callback: (items: NetWorthSnapshot[]) => void
): Unsubscribe {
  const q = query(snapshotsCollection(userId), orderBy('yearMonth', 'asc'))
  return onSnapshot(q, (snap) => {
    const items: NetWorthSnapshot[] = []
    snap.forEach((d) => items.push({ id: d.id, ...d.data() } as NetWorthSnapshot))
    callback(items)
  })
}
