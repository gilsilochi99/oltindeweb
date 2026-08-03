
import { FieldValue } from 'firebase-admin/firestore';
import type {
  CollectionReference,
  DocumentReference,
  DocumentSnapshot,
  Query,
  QuerySnapshot,
  WhereFilterOp,
  OrderByDirection,
} from 'firebase-admin/firestore';
import { getAdminDb } from './firebase-admin';

// Drop-in replacements for the modular `firebase/firestore` (client SDK)
// functions actions.ts was written against, backed by the Admin SDK instead.
// This exists so actions.ts's ~3000 lines of existing, already-correct
// Firestore call sites don't need to be hand-rewritten to the Admin SDK's
// different (chained) API — only the import line changes. Every `db`
// parameter below is accepted for call-signature compatibility and ignored;
// the real handle always comes from getAdminDb().
//
// The one real behavioral gap: the client SDK's DocumentSnapshot.exists is a
// *method*, the Admin SDK's is a *property*. wrapDocSnap below normalizes to
// the client SDK's method form, since that's what every callsite in
// actions.ts uses (`snap.exists()`).

type WrappedDocSnap = {
  exists(): boolean;
  data(): any;
  id: string;
  ref: DocumentReference;
};

type WrappedQuerySnap = {
  docs: WrappedDocSnap[];
  empty: boolean;
  size: number;
};

function wrapDocSnap(snap: DocumentSnapshot): WrappedDocSnap {
  return {
    exists: () => snap.exists,
    data: () => snap.data(),
    id: snap.id,
    ref: snap.ref,
  };
}

function wrapQuerySnap(snap: QuerySnapshot): WrappedQuerySnap {
  return {
    docs: snap.docs.map(wrapDocSnap),
    empty: snap.empty,
    size: snap.size,
  };
}

export function collection(_db: unknown, path: string): CollectionReference {
  return getAdminDb().collection(path);
}

export function doc(dbOrCollection: unknown, pathOrId?: string, maybeId?: string): DocumentReference {
  // doc(collectionRef) — auto-generated id
  if (typeof dbOrCollection === 'object' && dbOrCollection !== null && pathOrId === undefined) {
    return (dbOrCollection as CollectionReference).doc();
  }
  // doc(db, 'collectionPath', id)
  if (typeof pathOrId === 'string' && typeof maybeId === 'string') {
    return getAdminDb().collection(pathOrId).doc(maybeId);
  }
  throw new Error('Unsupported doc() call shape in firestore-admin-shim');
}

export async function getDoc(ref: DocumentReference): Promise<WrappedDocSnap> {
  return wrapDocSnap(await ref.get());
}

export async function getDocs(refOrQuery: CollectionReference | Query): Promise<WrappedQuerySnap> {
  return wrapQuerySnap(await refOrQuery.get());
}

export async function addDoc(colRef: CollectionReference, data: any): Promise<DocumentReference> {
  return colRef.add(data);
}

export async function updateDoc(ref: DocumentReference, data: any): Promise<void> {
  await ref.update(data);
}

export async function setDoc(ref: DocumentReference, data: any, options?: { merge?: boolean }): Promise<void> {
  await (options ? ref.set(data, options) : ref.set(data));
}

export async function deleteDoc(ref: DocumentReference): Promise<void> {
  await ref.delete();
}

export function arrayUnion(...items: any[]) {
  return FieldValue.arrayUnion(...items);
}
export function arrayRemove(...items: any[]) {
  return FieldValue.arrayRemove(...items);
}
export function increment(n: number) {
  return FieldValue.increment(n);
}

export function writeBatch(_db: unknown) {
  return getAdminDb().batch();
}

type Constraint = (q: Query) => Query;

export function where(field: string, op: WhereFilterOp, value: any): Constraint {
  return (q) => q.where(field, op, value);
}
export function orderBy(field: string, direction?: OrderByDirection): Constraint {
  return (q) => q.orderBy(field, direction);
}
export function limit(n: number): Constraint {
  return (q) => q.limit(n);
}

export function query(base: CollectionReference | Query, ...constraints: Constraint[]): Query {
  return constraints.reduce((q, c) => c(q), base as Query);
}
