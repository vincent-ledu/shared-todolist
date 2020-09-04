
// Connexion à socket.io

var socket = io();


// Lors de la première connexion, récupère toutes les tâches
socket.on('updateTask', function(todolist) {
    $('#todolist').empty(); // Refresh the list
    todolist.forEach(function(task, index) {
        insertTask(task, index);
    });
});

//
$('#todolistForm').submit(function ()
{
    var task = $('#task').val();
    var user = $('#user').val();
    console.log('user: ' + user)
    socket.emit('addTask', task, user);
    $('#task').val('').focus();

});




function   insertTask(task, index) {
    $('#todolist').append('<li><a class="delete" href="#" data-index="' + index + '">✘</a> ' + task + '</li>');

}

// supprime une tâche
$('body').on('click', '.delete', function()
{
    socket.emit('deleteTask', $(this).data('index'));
});