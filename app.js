const express = require("express");

const app = express();
const server = require("http").createServer(app);
const ent = require("ent");
const io = require("socket.io").listen(server);
const fs = require("fs");
const ntlm = require("express-ntlm");
const dotenv = require("dotenv");
const { pathToFileURL } = require("url");

var todolists = {}; // Créer le tableau todolist pour stocker les tâches sur le serveur

dotenv.config();
const DOMAIN = process.env.DOMAIN;
const DOMAIN_CONTROLLER = process.env.DOMAIN_CONTROLLER;
const USE_AD = JSON.parse(process.env.USE_AD);
const DATA_DIR = process.env.DATA_DIR || "."

const tasksFile = DATA_DIR + "/todo.txt";

function init() {
  if (USE_AD) {
    console.log(`usead: ${USE_AD}`);
    const ntlmRetry = (req, res, next) => {
      console.log("Sending 503 following NTLM auth error. NTLM: " + req.ntlm);
      res.status(503);
      next();
    };
    app.use(
      ntlm({
        domain: DOMAIN,
        domaincontroller: DOMAIN_CONTROLLER,
        internalservererror: ntlmRetry,
        forbidden: ntlmRetry,
      })
    );
  }
}
init();

app
  .use(express.static("public")) // Gestion des fichiers statiques

  .get("/todolist/:id", function (request, response) {
    var user = "(?)";
    if (USE_AD && request.ntlm) {
      user = request.ntlm.UserName;
      console.log(`User ${user} connected`);
    }
    const id = request.params.id;
    response.render("todo.ejs", { user: user, todolistId: id });
    //response.sendFile(__dirname + '/views/todo.html');
  })
  .post("/todolist/:id", function (request, response) {
    var user = "(?)";
    if (USE_AD && request.ntlm) {
      user = request.ntlm.UserName;
      console.log(`User ${user} connected`);
    }
    const id = request.params.id;
    response.render("todo.ejs", { user: user, todolistId: id });
  })

  // On redirige vers la todolist si la page demandée n'est pas trouvée
  .use("/", function (request, response, next) {
    console.log(`request: ${request.url}`)
    response.redirect("/todolist/common");
  });

function saveTask(tasks) {
  fs.writeFile(tasksFile, JSON.stringify(tasks), (err) => {
    if (err) {
      console.log("Error while trying to write todolist to file. Err: ", err);
      console.log("Data was:", tasks);
    }
  });
}

function readTasks() {
  if (fs.existsSync(tasksFile)) {
    console.log(`File ${tasksFile} exists.`);
    let fileContent = fs.readFileSync(tasksFile);
    console.log(`typeof :  ${typeof fileContent}`)
    console.log(`filecontent: |${fileContent}|`);
    if (fileContent || !str || /^\s*$/.test(fileContent)) {
      todolists = {};
    } else {
      todolists = JSON.parse(fileContent);
    }
    console.log(`It contains: ${JSON.stringify(todolists)}`);
  } else {
    console.log(`File ${tasksFile} doesn't exists.`);
  }
}

// L'événement
io.on("connection", function (socket) {
  console.log("user connected");
  // Envoyer l'événement  updateTask à tous les utilisateurs e
  //socket.emit("updateTask", todolists);

  /**
   * Réception de l'événement 'addTask' et réémission vers tous les utilisateurs
   */
  socket.on("addTask", function (task, user, todolistId) {
    console.log(`addTask: ${task} - ${user} - ${todolistId}`)
    task = ent.encode(task);
    user = ent.encode(user);
    if (todolists[todolistId] === undefined) {
      todolists[todolistId] = [];
    }
    todolists[todolistId].push(`${user}: ${task}`); // Ajouter une tâche au tableau todolist du serveur
    saveTask(todolists);

    // Envoyer une tâche à tous les utilisateurs en temps réel
    console.log(`Broadcast to updateTask${todolistId}`);
    socket.broadcast.emit(`updateTask${todolistId}`, todolists[todolistId]);

    console.log(todolists); // Debug
  });

  socket.on("firstConnection", function (todolistId) {
    console.log("firstConnection")
    socket.emit(`updateTask${todolistId}`, todolists[todolistId]);
    socket.broadcast.emit(`updateTask${todolistId}`, todolists[todolistId]);
  });

  // Delete tasks
  socket.on("deleteTask", function (item, todolistId) {
    // Supprime une tâche du tableau todolist du serveur
    //todolists[todolistId].splice(index, 1);
    console.log(`deleting item ${item} from ${todolistId}`)
    for (var i = 0; i < todolists[todolistId].length; i++) { 
      if (todolists[todolistId][i] === item) { 
        console.log('item found, splicing')
        todolists[todolistId].splice(i, 1); 
      } 
    }
    saveTask(todolists);

    //Mises à jour todolist de tous les utilisateurs en temps réel - rafraîchir l'index
    socket.emit(`updateTask${todolistId}`, todolists[todolistId]);
    socket.broadcast.emit(`updateTask${todolistId}`, todolists[todolistId]);
  });
});

// On lance le serveur en écoutant les connexions arrivant sur le port 8000
server.listen(8080, function () {
  console.log("Server is listening on *:8080");
  readTasks();
});
