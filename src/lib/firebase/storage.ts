
// src/lib/firebase/storage.ts
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase";

export async function uploadImage(file: File, path: string): Promise<string> {
  const storageRef = ref(storage, path);
  const snapshot = await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(snapshot.ref);
  return downloadURL;
}
