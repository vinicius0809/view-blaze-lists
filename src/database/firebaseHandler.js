import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, addDoc, setDoc, doc, updateDoc, getDoc } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBq53ijjHtGzSvLh8s_TyT4WSxSQvz8DeE",
    authDomain: "blaze-lists.firebaseapp.com",
    projectId: "blaze-lists",
    storageBucket: "blaze-lists.appspot.com",
    messagingSenderId: "962023947890",
    appId: "1:962023947890:web:3d8d46f070ed2b21ad0ceb"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

export async function getAllDataFromCollection(collectionName) {
    let result = [];
    const querySnapshot = await getDocs(collection(db, collectionName));

    querySnapshot.forEach((doc) => {
        console.log(`${doc.id} => ${doc.data()}`);
        result.push(doc.data());
    });

    return result;
}

export async function addList(listDate, listSize, listHour, listElements, inverse) {
    try {
        let obj = {};
        obj[listHour] = {
            listSize,
            listElements,
            inverse
        };

        const docRef = await setDoc(doc(db, "lists", listDate), obj);
        console.log("Document written with ID: ", docRef.id);
    } catch (e) {
        console.error("Error adding document: ", e);
    }
}

export async function getList(listDate) {
    const docRetrieveRef = doc(db, "lists", listDate);
    const docSnap = await getDoc(docRetrieveRef);
    let obj = {};

    if (docSnap.exists()) {
        // console.log("Document data:", docSnap.data());
        obj = docSnap.data();
    } else {
        // docSnap.data() will be undefined in this case
        console.log("No such document!");
    }
    return obj;
}

export async function createOrUpdateList(objList) {
    const docRetrieveRef = doc(db, "lists", objList.listDate);
    const docSnap = await getDoc(docRetrieveRef);
    let obj = {};

    if (docSnap.exists()) {
        // console.log("Document data:", docSnap.data());
        obj = docSnap.data();
        if (obj[objList.listHour] == undefined) {
            obj[objList.listHour] = [];
        }
    } else {
        // docSnap.data() will be undefined in this case
        console.log("No such document!");
    }
    try {
        const index = obj[objList.listHour].findIndex(x => x.listSize == objList.listSize && x.inverse == objList.inverse);
        if (index == -1) {
            obj[objList.listHour].push(objList);
        } else {
            obj[objList.listHour][index] = objList;
        }

        await setDoc(doc(db, "lists", objList.listDate), obj);
        console.log("List added!");
    } catch (e) {
        console.error("Error adding document: ", e);
    }
}