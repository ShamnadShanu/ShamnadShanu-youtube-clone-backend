const io = require( "socket.io" )();
const videoHelpers = require("./helpers/videoHelpers");
const socketapi = {
    io: io
};

// Add your socket.io logic here!
// io.on( "connection", function( socket ) {
//     console.log( "A user connected" ); 
// });
io.on("connection",(socket)=>{
    console.log('poda pootta');
    socket.on('message',()=>{
        console.log('ssssssssssssssssss');
        videoHelpers.getAll().then((response)=>{
            io.emit('reply',{no:response})
        })
    })

        })
// end of socket.io logic

module.exports = socketapi;