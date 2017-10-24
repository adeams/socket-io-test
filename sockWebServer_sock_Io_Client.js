var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var client = require('socket.io/node_modules/socket.io-client');
//var client = require('socket.io-client');
//var serverUrl = 'http://10.1.3.186:9001';
//var clientSock;

app.get('/', function(req, res) {
   res.sendfile('index.html');
});

users = [];
io.on('connection', function(socket) {
   var clientSock;
   console.log('A user connected');
   socket.on('api-connectet', function(data) {
      console.log(data);
      
      // if(users.indexOf(data) > -1) {
      //    socket.emit('userExists', data + ' username is taken! Try some other username.');
      // } else {
         //if(!clientSock){
            users.push(data);
            var serverUrl = 'http://'+data+':9002';
            clientSock = client.connect(serverUrl, { 'force new connection': true, secure: true });   // https

            clientSock.on('connect', function () {
               socket.emit('fn-api-connectet', {username: data});
               console.log('clientSock.on(connect)');
            });

            clientSock.on('disconnect', function () {
               console.log('1clientSock.on(connect)');
               //clientSock = 0;
            });
         //}
      //}
   });

   socket.on('msg', function(data) {
      //Send message to everyone
      io.sockets.emit('newmsg', data);
   })

   socket.on('api-getdata', function(dataIn) {
      console.log('datain ->',dataIn);
      var tbNames = dataIn.split(',');
      //console.log('tbName ->',tbName);
      if(clientSock){
         console.log('tbName ->',tbNames);
         clientSock.emit('api-get-table',tbNames, function (err, data_get, branchId) {  
            console.log('data_get[0].tableName ->',data_get[0].tableName);
            //console.log('data.data ->',JSON.stringify(data[0].data[0], null, 2));
            data_get.forEach(function(data_to_web) {
               console.log('data_to_web.tableName ->',data_to_web.tableName);
               socket.emit('fn-api-getdata', data_to_web);
            });
         });
      }
   })

   socket.on('api-setdata', function(dataIn) {
      //console.log('datain ->',dataIn);
      var data_set = JSON.parse(dataIn);
      console.log('data_set.tableName ->',data_set.tableName);
      if(clientSock){
         //console.log('data_set.tableName ->',data_set[0].tableName);
         clientSock.emit('api-set-table',[data_set], function (err, data, branchId) {  
            console.log('data ->',data);
            //console.log('data.data ->',JSON.stringify(data[0].data[0], null, 2));
         });
      }
   })


   socket.on('api-disconnetc', function(data) {
      //Send message to everyone
      //io.sockets.emit('newmsg', data);
      if(clientSock){
         console.log('socket.on(secdDisconnetc)');
         clientSock.disconnect();
      }
      console.log('data ->',data);
   })

   socket.on('disconnect', function () {
      //Send message to everyone
      if(clientSock){
         clientSock.disconnect();
         console.log('clientSock.disconnect()');
      }
      console.log('socket.on disconnect');
   })

});

http.listen(3001, function() {
   console.log('listening on localhost:3001');
});
