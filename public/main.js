const userList = document.getElementById("users");
const messagesDiv = document.getElementById("messageslist");
const feedback = document.getElementById("feedback");
const textarea = document.getElementById("newmessage");
const ding = new Audio('typewriter_ding.m4a');
let name = window.prompt("Enter your name");

// Connects to the server
const socket = io.connect('https://kenzieslack.herokuapp.com/')

// if they didn't type anything at the prompt, make up a random name
if(name.length===0) name = "Anon-" + Math.floor(Math.random()*1000);

// redraw the entire list of users, indicating active/inactive
function listUsers(users) {
    console.log(users);
    let userStrings = users.map((user) =>
    (user.active ? `<span class="active"><span class="cyan">&#9679;</span> ${user.name}</span>` : `<span class="inactive">&#9675; ${user.name}</span>`)
);
userList.innerHTML = userStrings.join("<br>");
}

// true if the messages div is already scrolled down to the latest message
function scrolledToBottom() {
    return messagesDiv.scrollTop + 600 >= messagesDiv.scrollHeight;
}

// force the messages div to scroll to the latest message
function scrollMessages() {
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

document.getElementById("newmessage").addEventListener("keypress", (event) => {
    // If user is typing, send 'typing' to server
    socket.emit('typing', {
        name
    })
    // if the key pressed was enter (and not shift+enter), post the message.
    if(event.keyCode === 13 && !event.shiftKey) {
        ding.play();
        socket.emit('chat', {name, message: textarea.value});
        textarea.value = "";
        textarea.focus();
    }
})

// Prints out all the messages in the database when the server sends it on initial connection
socket.on('initial', (data) => {
    console.log(data);
    for (let message of data) {
        messagesDiv.innerHTML += `<div class="message"><strong>${message.name}</strong><br>${message.message}</div>`;
    }
})

// Redraws the user list to show inactive users when the server checks every 15 seconds
socket.on('activeUsers', (data) =>{
    listUsers(data.users);
})

// Creates a new chat message in the messagesDiv when a Chat message is received from the server
// Redraws the user list 
// Scrolls to the bottom of the messagesDiv
socket.on('chat', (data) => {
    feedback.innerHTML = "";
    messagesDiv.innerHTML +=
      `<div class="message"><strong>${data.message.name}</strong><br>${data.message.message}</div>`;
      console.log(data.users)
      listUsers(data.users);
      scrollMessages();
})

// Displays "User is typing" when the server sends a typing message
socket.on('typing', (data) => {
    feedback.innerHTML =
      `<strong>${data.name}</strong> is typing.`;
})

