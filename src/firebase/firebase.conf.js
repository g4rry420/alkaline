import firebase from "firebase/app"
import "firebase/firestore"

const firebaseConfig = {
    apiKey: "AIzaSyDVu7V-dqcZaUjQXGL1UQaqq__Y0EVQyVg",
    authDomain: "fir-rtc-6652d.firebaseapp.com",
    databaseURL: "https://fir-rtc-6652d.firebaseio.com",
    projectId: "fir-rtc-6652d",
    storageBucket: "fir-rtc-6652d.appspot.com",
    messagingSenderId: "239223973916",
    appId: "1:239223973916:web:e6f003f207284aa295d7d9",
    measurementId: "G-BS6ZNVC5QK"
};

firebase.initializeApp(firebaseConfig);


export const firestore = firebase.firestore();

export default firebase;