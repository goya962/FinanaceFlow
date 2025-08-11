"use server";

// This file is intended to hold server-side logic for data mutations,
// such as adding, updating, or deleting data in Firestore.
// Using server actions helps keep sensitive logic off the client.

// Example of a future server action:
/*
import { firestore } from './firebase';
import { collection, addDoc } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';

export async function addExpense(expenseData) {
  try {
    const docRef = await addDoc(collection(firestore, "expenses"), expenseData);
    console.log("Document written with ID: ", docRef.id);
    revalidatePath('/gastos'); // Revalidate the expenses page
    return { success: true, id: docRef.id };
  } catch (e) {
    console.error("Error adding document: ", e);
    return { success: false, error: e.message };
  }
}
*/

console.log("Server actions loaded.");
