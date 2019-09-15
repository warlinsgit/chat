
const Chat = require('./models/Chat')

module.exports = function (io) {

  let nicknames = [];
  let users  = {};


  io.on('connection',async socket => {
    console.log('new user connected');

    let messages = await Chat.find({});
    socket.emit('load old msgs', messages);

    socket.on('new user', (data, cb) => {

      if(data in users) {
        cb(false);
      }else{
        cb(true);
        socket.nickname = data;
        //users.push(socket.nickname);
        users[socket.nickname] = socket;
        updateNicknames();

      }


    });

    socket.on('send message', async (data, cb) => {
      //console.log(data);
      var msg = data.trim();
      if(msg.substr(0, 3) === '/w '){
        msg = msg.substr(3);
        const index = msg.indexOf(' ');
        if(index !== -1){
          var name = msg.substring(0, index);
          var msg = msg.substring(index + 1);
          if(name in users){
            users[name].emit('whisper', {
              msg,
              nick: socket.nickname
            });
          }else{
              cb('Error! Please enter a valid username');
          }
        }else{
          cb('Error! Please enter your message');
        }
      }else{
        var newMsg =  new Chat({
          msg: msg,
          nick: socket.nickname
        });
        await newMsg.save();



        io.sockets.emit('new message', {
          msg: data,
          nick: socket.nickname


      });

}
    });

socket.on('disconnect', data => {
  if(!socket.nickname) return;
  //nicknames.splice(nicknames.indexOf(socket.nickname), 1);
  delete users[socket.nickname];
  updateNicknames();

});

function updateNicknames(){
    io.sockets.emit('usernames', Object.keys(users));
}
  });
}
