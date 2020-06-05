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

app.use(cors({ origin: true}));

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
  try {
    getProjects();    
  }
  catch(error) {
    console.error(error);
  }

  async function getProjects() {
    const data = await firebase
    .firestore()
    .collection('publicProjects')
    .doc('projectList')
    .collection('projects')      
    .get().catch(function(error) {             
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
        id: doc.id   
        }
      }
      
      projectList.push(project);
    });
      
    console.log('sending list of projects to client.. ')
    res.send(projectList);
  }    

})


app.get("/user-projects", cors(), (req, res) => {

  console.log('fetching users projects from firebase.. ')
  const projectList = [];
  try {
    getProjects();    
  }
  catch(error) {
    console.error(error);
  }

  async function getProjects() {
    const data = await firebase
    .firestore()
    .collection(req.headers.userid)
    .doc('projectList')
    .collection('projects')      
    .get().catch(function(error) {             
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


app.get("/project-comments", cors(), (req, res) => {
  console.log('fetching project comments from firebase.. ')
  const commentList = [];

  try {
    getComments();    
  }
  catch(error) {
    console.error(error);
  }

  async function getComments() {
    const data = await firebase
    .firestore()
    .collection(req.headers.userid)
    .doc('projectList')
    .collection('projects')
    .doc(req.headers.projectid)
    .collection('comments')      
    .get().catch(function(error) {             
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

if (!module.parent) {
  
    const port = process.env.PORT || 3000;
  
    app.listen(port, () => {
      console.log("Express server listening on port " + port + ".");
    });
}