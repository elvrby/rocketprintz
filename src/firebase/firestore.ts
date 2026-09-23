import {
    doc,
    getDoc,
} from "firebase/firestore";

import { UserProfile } from "../types";
import { db } from "./config";

export async function getUserProfile(
  uid: string
): Promise<UserProfile | null> {

  const userRef = doc(
    db,
    "users",
    uid
  );

  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    return null;
  }

  const data = snapshot.data();

  return {
    uid,
    name: data.name,
    email: data.email,
    role: data.role,
  };
}