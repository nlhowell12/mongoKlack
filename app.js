const express = require('express')
const querystring = require('querystring');
const app = express()
const mongoose = require('mongoose');
const port = process.env.PORT || 3000
// setting up websockets
const socket = require('socket.io');
const server = app.listen(port);
const io = socket(server);

// mlab/heroku stuff
const dbName = 'klack';
const DB_USER = 'admin';
const DB_PASSWORD = 'admin';
const DB_URI = "ds119306.mlab.com:19306";


//mongo stuff
mongoose.connect(`mongodb://${DB_USER}:${DB_PASSWORD}@${DB_URI}/${dbName}`, () => {
console.log('connection success')
})
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection fuckup'))

//define the schema

const Schema = mongoose.Schema;
const messageSchema = new Schema({
    name: String,
    message: String,
    timestamp: Number,
});

//compile a response model from the schema

const Message = mongoose.model('Message', messageSchema)


app.use(express.static("./public"))
app.use(express.json())

// Track last active times for each sender
const usersTimestamps = {}


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

// Setting up socket endpoints
io.on('connection', (socket) => {
    console.log(`Connected on Port: ${port}`)
    console.log(usersTimestamps)
    Message.find((err, messages) => {
        socket.emit('initial', messages);
    })
    

    socket.on('chat', (data) =>{
        // get the current time
        const now = Date.now();
    
        // consider users active if they have connected (GET or POST) in last 15 seconds
        const requireActiveSince = now - (15*1000)
        
        // update the requesting user's last access time
        usersTimestamps[data.name] = now;
        
        // create a new list of users with a flag indicating whether they have been active recently
        usersSimple = Object.keys(usersTimestamps).map((x) => ({name: x, active: (usersTimestamps[x] > requireActiveSince)}))
        
        // sort the list of users alphabetically by name
        usersSimple.sort(userSortFn);
        usersSimple.filter((a) => (a.name !== data.name))
        
        
        
        let message = new Message({
            name: data.name,
            message: data.message,
            timestamp: now,
            
        })
        message.save()
         
        io.sockets.emit('chat', {message, users: usersSimple})
    })
    
    socket.on('typing', (data) => {
        socket.broadcast.emit('typing', data);
    })
})

