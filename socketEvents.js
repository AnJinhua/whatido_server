const userStatus = require("./models/userStatus");

userStatus
//for active chat users
let users = [];

//check if there is a user id already in the users array before adding a user
const addUser = async(userSlug, socketId) => {
  !users.some((user) => user.userSlug === userSlug) &&
    users.push({ userSlug, socketId});
    userSlug && userStatus.find({userSlug:userSlug},async (er,user)=>{
      if (user.length == 1 && user[0].status=="OFFLINE"){
        user[0].status = "ONLINE"
        user.save()
        // userStatus.create({socketId,userSlug,status:"ONLINE"})
    }
    else {
      userStatus.create({socketId,userSlug,status:"ONLINE"})
    }
  }
    )
};

//get a user by id
const getUser = async(userSlug) => {
  return users.find((user) => user.userSlug === userSlug);
  
};

//remove a user from users array
const removeUser = async (socketId) => {
  users = users.filter((user) => user.socketId !== socketId);
  const userSlug = (await userStatus.findOne({socketId:socketId}))?.slug;
  userSlug && userStatus.find({userSlug:userSlug},async (er,user)=>{
    if (user.length > 1){
      await userStatus.findOneAndDelete({socketId:socketId})
    }
    else if (user){
      userStatus.findOneAndUpdate({userSlug},{status:'OFFLINE'})
    }
  });
   if (!userSlug){userStatus.findOneAndDelete({socketId:socketId})}
};

//register callbacks for audiocalls received/rejected
const inviteToCallCallbacks = {};

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("[SOCKET]:[USER]:[CONNECTED]");

    //take userId and socketId from client
    socket.on("addUser", (userSlug) => {
      const socketId = socket.id? socket.id : socket.conn.id
      addUser(userSlug, socketId);
      io.emit("getUsers", users);
    });

    //send and get message
    socket.on("sendMessage", ({ data, recieverSlug }) => {
      const user = getUser(recieverSlug);
      if (user) {
        return io.to(user.socketId).emit("getMessage", { data });
      }
    });
    socket.on("istyping", ({ data, recieverSlug }) => {
      const user = getUser(recieverSlug);
      if (user) {
        return io.to(user.socketId).emit("onTyping", { data });
      }
    });
    //send and get read messages
    socket.on("readMessage", ({ data, recieverSlug }) => {
      const user = getUser(recieverSlug);
      if (user) {
        return io.to(user.socketId).emit("getReadMessage", { data });
      }
    });

    //update conversation
    socket.on("updateConversation", ({ data, recieverSlug }) => {
      const user = getUser(recieverSlug);
      if (user) {
        return io.to(user.socketId).emit("getUpdateConversation", { data });
      }
    });
    //delete message
    socket.on("deleteMessage", ({ data, recieverSlug }) => {
      const user = getUser(recieverSlug);
      if (user) {
        return io.to(user.socketId).emit("getDeletedMessage", { data });
      }
    });

    //on user disconnect
    socket.on("disconnect", () => {
      const socketId = socket.id? socket.id : socket.conn.id
      console.log("[SOCKET]:[USER]:[DISCONNECTED]",socketId);
      removeUser(socket.conn.id);
      io.emit("getUsers", users);
    });


  });
};
