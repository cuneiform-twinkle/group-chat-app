import express from "express";
import http from "http";
import dotenv from "dotenv";
import path from "path";
import {dirname} from "path";
import { fileURLToPath } from "url";
import{Server} from "socket.io";
import { formatMessage } from "./utils/messages.js";
// import formatMessage from "./utils/messages.js";
import { userJoin, getCurrentUser, getRoomUsers, userLeave } from "./utils/users.js";



const app = express();
const PORT=process.env.port || 3000;
dotenv.config();
const httpServer = http.createServer(app);


const __dirname = dirname(fileURLToPath(import.meta.url));
//Set static folder
app.use(express.static(path.join(__dirname,"/public")))

const botName = "ChatCord Bot"

const io = new Server(httpServer)
//Run when client connects
io.on("connection",socket=>{   
    socket.on("joinRoom", ({username,room})=>{
    const user = userJoin(socket.id,username,room);
    socket.join(user.room);

     //Welcome Current user
     socket.emit('message',formatMessage(botName, "Welcome to ChatCord"));

     //Broadcast when a user connects
     socket.broadcast.to(user.room).emit("message", formatMessage(botName, `${user.username} has joined the chat`));

     //Send users and room info
     io.to(user.room).emit('roomUsers',{
         room:user.room,
         users:getRoomUsers(user.room)
     })
    })

    //LIsten for chat message
    socket.on("chatMessage", data=>{
        const user = getCurrentUser(socket.id);
       // io.emit("message",data)
       io.to(user.room).emit("message", formatMessage(user.username,data));
    })

    // //Runs when client disconnects
    // socket.on("disconnect",()=>{
    //     const user = userLeave(socket.id);
    //     if(user){
    //       io.to(user.room).emit("message",`${user.username} has left the chat`)
    //      console.log("User Disconnected");
    //           //Send users and room info
    //      io.to(user.room).emit('roomUsers',{
    //      room:user.room,
    //      users:getRoomUsers(user.room)
    //  })
    //     }
    // })

     // Runs when client disconnects
  socket.on("disconnect", () => {
    const user = userLeave(socket.id);

    if (user) {
      io.to(user.room).emit(
        "message",
        formatMessage(botName, `${user.username} has left the chat`)
      );

      // Send users and room info
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    }
  });
});


httpServer.listen(PORT,()=>{
    console.log(`Server is listening on PORT:${PORT}`)
})












