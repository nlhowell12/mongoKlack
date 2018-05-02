const express = require('express')
const querystring = require('querystring');
const port = 3000
const app = express()
const mongoose = require('mongoose');

//mongo stuff
mongoose.connect('mongodb://localhost/klack', () => {
    console.log('connection success')
})
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection fuckup'))

//define the schema

const Schema = mongoose.Schema;
let messageSchema = new Schema({
    name: String,
    message: String,
    timestamp: Number,
});

//compile a response model from the schema

let Message = mongoose.model('Message', messageSchema)

// List of all messages
let messages = []

// Track last active times for each sender
let users = {}

app.use(express.static("./public"))
app.use(express.json())

// generic comparison function for case-insensitive alphabetic sorting on the name field
function userSortFn(a, b) {
    var nameA = a.name.toUpperCase(); // ignore upper and lowercase
    var nameB = b.name.toUpperCase(); // ignore upper and lowercase
    if (nameA < nameB) {
      return -1;
    }
    if (nameA > nameB) {
      return 1;
    }
  
    // names must be equal
    return 0;      
}

app.get("/messages", (request, response) => {
    
    

    // get the current time
    const now = Date.now();

    // consider users active if they have connected (GET or POST) in last 15 seconds
    const requireActiveSince = now - (15*1000)

    // create a new list of users with a flag indicating whether they have been active recently
    usersSimple = Object.keys(users).map((x) => ({name: x, active: (users[x] > requireActiveSince)}))

    // sort the list of users alphabetically by name
    usersSimple.sort(userSortFn);
    usersSimple.filter((a) => (a.name !== request.query.for))

    // update the requesting user's last access time
    users[request.query.for] = now;

    // send the latest 40 messages and the full user list, annotated with active flags
    Message.find((err, messages) => {
        response.send({messages: messages.slice(-40), users: usersSimple})
        
    }) 
})

app.post("/messages", (req, res) => {
    // add a timestamp to each incoming message.
    let timestamp = Date.now();
    let message = new Message({
        name: req.body.sender,
        message: req.body.message,
        timestamp: timestamp,

    })
    
    message.save()
    

    // append the new message to the message list
    messages.push(req.body)

    // update the posting user's last access timestamp (so we know they are active)
    // let lastMsgTimeStamp = 
    users[req.body.sender] = timestamp

    // Send back the successful response.
    res.status(201)
    res.send(req.body)
})

app.listen(3000)