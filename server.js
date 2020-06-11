const express = require("express");
const cors = require("cors");
const app = express();
const moment = require('moment');
const fs = require('fs');
const firebase = require('firebase');
const firebaseConfig = {
  apiKey: "AIzaSyA403C-coHnnBtA5YrmFsXdee4ur41eu0E",
  authDomain: "crossplatformfinalapp.firebaseapp.com",
  databaseURL: "https://crossplatformfinalapp.firebaseio.com",
  projectId: "crossplatformfinalapp",
  storageBucket: "crossplatformfinalapp.appspot.com",
  messagingSenderId: "906037836650",
  appId: "1:906037836650:web:be2bc5e2bd11cbd233c313",
  measurementId: "G-TK9XTBNMJE"
};

app.use(cors({ origin: true }));

let rawdata = fs.readFileSync('data.json');
let records = JSON.parse(rawdata);

firebase.initializeApp(firebaseConfig);

app.get("/simple-cors", cors(), (req, res) => {
  console.info("GET /simple-cors");
  res.json({
    text: "Simple CORS requests are working. [GET]",
    records
  });
});

app.get("/public-projects", cors(), (req, res) => {

  console.log('fetching public projects from firebase.. ')
  const projectList = [];

  const getProjects = () => {
    console.log('async init')

    let data = firebase
      .firestore()
      .collection('projectList')
      .doc('projects')
      .collection('users')
      .get().catch(function (error) {
        console.error('failed:', error);
        throw error;
      }).then(snapshot => {
        if (snapshot.empty) {
          console.log('Public found no matching documents.');
          return;
        }
        else {
          snapshot.forEach(doc => {

            let publicRef = firebase
              .firestore()
              .collection('projectList')
              .doc('projects')
              .collection('users')
              .doc(doc.id)
              .collection('userproject');

            let query = publicRef.get()
              .then(snapshot => {
                console.log('user query results..');
                if (snapshot.empty) {
                  console.log('Public found no matching documents.');
                  return;
                }
                snapshot.forEach(doc => {
                  if (doc.data().shared) {
                    console.log('shared doc found');
                    console.log(doc.data());
                    const project = {
                      project: {
                        title: doc.data().title,
                        body: doc.data().body,
                        createdAt: moment(doc.data().createdAt.toDate()).calendar(),
                        solved: doc.data().solved,
                        shared: doc.data().shared,
                        id: doc.id,
                      }
                    }
                    projectList.push(project);
                  }
                });

                console.log('end of user foreach.. ');
              })
              .catch(err => {
                console.log('Error getting documents', err);
              });
          });
        }
      });
  }

  try {
    getProjects();
    setTimeout(() => {
      res.send(projectList);
    }, 3200);
  }
  catch (error) {
    console.error(error);
  }
})

app.get("/user-projects", cors(), (req, res) => {

  console.log('fetching users projects from firebase.. ')
  const projectList = [];
  try {
    getProjects();
  }
  catch (error) {
    console.error(error);
  }

  async function getProjects() {
    const data = await firebase
      .firestore()
      .collection('projectList')
      .doc('projects')
      .collection('users')
      .doc(req.headers.user)
      .collection('userproject')
      .get().catch(function (error) {
        console.error('failed:', error);
        throw error;
      })

    data.forEach((doc) => {

      const project = {
        project: {
          title: doc.data().title,
          body: doc.data().body,
          createdAt: moment(doc.data().createdAt.toDate()).calendar(),
          solved: doc.data().solved,
          shared: doc.data().shared,
          id: doc.id,
        }
      }

      projectList.push(project);
    });

    console.log('sending list of projects to client.. ')

    res.send(projectList);
  }
})

app.get("/toggle-project", cors(), (req, res) => {

  let state = false;

  //toggle boolean state
  if(req.headers.boolean === 'false') {
    state = true;
  }

  try {
    toggle();
  } catch (error) {
    console.error(error)
  }

  async function toggle() {
    if (req.headers.sender === 'solved') {
      firebase
      .firestore()
      .collection("projectList")
      .doc("projects")
      .collection('users')
      .doc(req.headers.user)
      .collection('userproject')
      .doc(req.headers.id)
      .update({ 'solved': state })
      .then(() => {
        console.log("toggled project solved to: " + state);
      })
      .catch((err) => {
        console.log(err);
        res.send({ error: err });
      }).then(() => {
        res.send({ success: 'success' });
      });
    }
    else {
      firebase
      .firestore()
      .collection("projectList")
      .doc("projects")
      .collection('users')
      .doc(req.headers.user)
      .collection('userproject')
      .doc(req.headers.id)
      .update({ 'shared': state })
      .then(() => {
        console.log("toggled project shared to: " + state);
      })
      .catch((err) => {
        console.log(err);
        res.send({ error: err });
      }).then(() => {
        res.send({ success: 'success' });
      });
    }
  }
})

app.get("/project-comments", cors(), (req, res) => {
  console.log('fetching project comments from firebase.. ')
  const commentList = [];

  try {
    getComments();
  }
  catch (error) {
    console.error(error);
  }

  async function getComments() {
    const data = await firebase
      .firestore()
      .collection('projectList')
      .doc('projects')
      .collection('users')
      .doc(req.headers.user)
      .collection('userproject')
      .doc(req.headers.id)
      .collection('comments')
      .get().catch(function (error) {
        console.error('failed:', error);
        throw error;
      })

    data.forEach((doc) => {

      const comment = {
        comment: {
          comment: doc.data().comment,
          id: doc.id,
          createdAt: moment(doc.data().createdAt.toDate()).calendar(),
        }
      }

      commentList.push(comment);
    });

    console.log('sending list of comments to client.. ')
    res.send(commentList);
  }



})

app.get("/auth-user", cors(), (req, res) => {
  console.log('signing in user.. ');
  console.log(req.headers.email, req.headers.password)
  try {
    firebase
      .auth()
      .signInWithEmailAndPassword(req.headers.email, req.headers.password)
      .then(function (user) {
        console.log('user: ' + JSON.stringify(user.user.uid) + ' signed in.. ');
        res.send(JSON.stringify(user.user.uid));
      })
      .catch(function (error) {
        console.log(error);
        res.send({ error: error })
      });
  } catch (error) {
    console.log(error);
    res.send({ error: error })
  }
})

app.get("/post-comment", cors(), (req, res) => {
  console.log('adding comment to project: ' + req.headers.id);

  console.log('comment: ' + req.headers.comment);
  const createdAt = new Date();
  console.log('createdAt: ' + createdAt);

  const newComment = {
    comment: req.headers.comment,
    createdAt: createdAt
  }
  try {
    firebase
      .firestore()
      .collection('projectList')
      .doc('projects')
      .collection('users')
      .doc(req.headers.user)
      .collection('userproject')
      .doc(req.headers.id)
      .collection('comments')
      .add({
        ...newComment
      })
      .then(() => {
        console.log("added comment");
        res.send({ success: 'success' });
      })
      .catch((err) => {
        console.log(err);
        res.send({ error: error })
      });
  } catch (error) {
    console.error(error);
    res.send({ error: error })
  }
})

if (!module.parent) {

  const port = process.env.PORT || 3000;

  app.listen(port, () => {
    console.log("Express server listening on port " + port + ".");
  });
}