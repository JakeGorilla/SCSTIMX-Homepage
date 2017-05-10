var functions = require('firebase-functions');

const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);
var database = admin.database();

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

exports.initUserInDatabase = functions.auth.user().onCreate(event => {
    const user = event.data; // The Firebase user.
    const uid = user.uid;
    const email = user.email;
    database.ref('/userList/' + uid).set(email);
    database.ref('/users/' + uid + '/email').set(email);
});
exports.deleteUserInDatabase = functions.auth.user().onDelete(event => {
    const user = event.data; // The Firebase user.
    const uid = user.uid;
    database.ref('/users/' + uid).once('value').then(function (dataSnapshot) {
        database.ref('/removedUsers/' + uid).set(dataSnapshot.val()).then(function () {
            database.ref('/users/' + uid).remove();
            database.ref('/userList/' + uid).remove();
        });
    });
    database.ref('/privilegedUsers/' + uid).remove();
});