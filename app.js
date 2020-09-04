const express = require('express');

const app = express();
const server = require('http').createServer(app);
const ent = require('ent');
const io = require('socket.io').listen(server);
const fs = require('fs');
const ntlm = require('express-ntlm');
const dotenv = require('dotenv')

const tasksFile = "./todo.txt"

var todolist = []; // Créer le tableau todolist pour stocker les tâches sur le serveur

dotenv.config()
const DOMAIN=process.env.DOMAIN
const DOMAIN_CONTROLLER=process.env.DOMAIN_CONTROLLER
const USE_AD=process.env.USE_AD

function init() {

}
init()

const ntlmRetry = (req, res, next) => {
    console.log('Sending 503 following NTLM auth error. NTLM: ' + req.ntlm)
    res.status(503)
    next()
  }
  
  
app.use(ntlm({
    domain: DOMAIN,
    domaincontroller: DOMAIN_CONTROLLER,
    internalservererror: ntlmRetry,
    forbidden: ntlmRetry

}));

app.use(express.static('public')) // Gestion des fichiers statiques

    .get('/todolist', function (request, response) {
        var user = '(?)'
        if (USE_AD && request.ntlm) {
            user = request.ntlm.UserName
            console.log(`User ${user} connected`)
        } else {
          console.log("anonymous user")
        }
        response.render('todo.ejs', {user: user})
        //response.sendFile(__dirname + '/views/todo.html');
    })

    // On redirige vers la todolist si la page demandée n'est pas trouvée
    .use(function (request, response, next) {
        response.redirect('/todolist');
    });

function saveTask(tasks) {
    fs.writeFile(tasksFile, JSON.stringify(tasks), (err) => {
        if (err) {
            console.log("Error while trying to write todolist to file. Err: ", err)
            console.log("Data was:", tasks)
        }
    })
}

function readTasks() {
    if (fs.existsSync(tasksFile)) {
        console.log(`File ${tasksFile} exists.`)
        todolist = JSON.parse(fs.readFileSync(tasksFile))
        console.log(`It contains: ${JSON.stringify(todolist)}`)
    } else {
        console.log(`File ${tasksFile} doesn't exists.`)
    }
}

// L'événement
io.on('connection', function (socket) {
    /**
     * Déconnexion d'un utilisateur
     */
    socket.on('disconnect', function () {
        console.log('user disconnected : ');

    });

    // Envoyer l'événement  updateTask à tous les utilisateurs e
    socket.emit('updateTask', todolist);


    /**
     * Réception de l'événement 'addTask' et réémission vers tous les utilisateurs
     */
    socket.on('addTask', function (task, user) {
        task = ent.encode(task);
        console.log(`user: ${user}`)
        
        user = ent.encode(user);
        todolist.push(`${task} from: ${user}`); // Ajouter une tâche au tableau todolist du serveur
        saveTask(todolist)

        // Envoyer une tâche à tous les utilisateurs en temps réel
        socket.broadcast.emit('updateTask', todolist);
        console.log(todolist); // Debug
    });


    // Delete tasks
    socket.on('deleteTask', function (index) {
        // Supprime une tâche du tableau todolist du serveur
        todolist.splice(index, 1);
        saveTask(todolist)

        //Mises à jour todolist de tous les utilisateurs en temps réel - rafraîchir l'index
        io.emit('updateTask', todolist);
    });

});


// On lance le serveur en écoutant les connexions arrivant sur le port 8000
server.listen(8080, function () {
    console.log('Server is listening on *:8080');
    readTasks()
});