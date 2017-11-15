/* Net configuration */
var serverTCP = require('net');

/* Database connection */
var ObjectID = require('mongodb').ObjectID;

/* Voice requiment */
var spawn = require('child_process').spawn;

/* Serial port required */
// var serialport = require("serialport");
// var SerialPort = serialport.SerialPort;

// /* HTTP with build in node */
// var app = require('http').createServer(handler);  // no express
// var io = require('socket.io').listen(app);
// var url = require('url');
 var fs = require('fs');

// /* HTTPS with build in node */
// const options = {
//   key: fs.readFileSync('ryans-key.pem'),
//   cert: fs.readFileSync('ryans-cert.pem')
// };
// const https = require('https').createServer(options, httpsHandler);
// //var io = require('socket.io').listen(https);

//var privateKey  = fs.readFileSync('sslcert/ryans-key.pem', 'utf8');
//var certificate = fs.readFileSync('sslcert/ryans-cert.pem', 'utf8');

// var privateKey  = fs.readFileSync('sslcert/server3.key');
// var certificate = fs.readFileSync('sslcert/pprdlusmqwap01_base64.cer');
// var credentials = {key: privateKey, cert: certificate, secureOptions: constants.SSL_OP_NO_SSLv3 | constants.SSL_OP_NO_SSLv2};
/**
 * Get port from environment and store in Express.
 */

// /* Password encrypt */
// var crypto = require('crypto'), algorithm = 'aes-128-cbc', key = 'Pas$w0rd';  

/* library */
var lib = require('./lib.js');
var connectionCheck = lib.connectionCheck;
//var serialList = lib.serialList;
//var alphabetCheck = lib.alphabetCheck;
//var strSepPush = lib.strSepPush;
//var checkDev = lib.checkDev;
var zeroFill = lib.zeroFill;
var dbGet = lib.dbGet;
var dbInsert = lib.dbInsert;
//var copyReport = lib.copyReport;
//var resetQ = lib.resetQ;
var dbFindUpdate = lib.dbFindUpdate;
var clientCheck = lib.clientCheck;
var getWebSock = lib.getWebSock;
var rowIndexOf = lib.rowIndexOf;
var itemIndexOf = lib.itemIndexOf;
//var svgIndexOf = lib.svgIndexOf;
var dbDrop = lib.dbDrop;
var rpDrop = lib.rpDrop;
// var findRmtID = lib.findRmtID;
// var clearZbox = lib.clearZbox;
// var soundSplit = lib.soundSplit;
// var systemUpdate = lib.systemUpdate;
// var dbArrayUpdate = lib.dbArrayUpdate;
// var listDir = lib.listDir;
// var getReportInfo = lib.getReportInfo;
// var copyQtoday = lib.copyQtoday;
// var jsonWrite = lib.jsonWrite;

/* Load config */
var conf = {};
var loadConfig = lib.loadConfig;


/* Eminter event define */
var SimpleEE = function() {
  this.events = {};
};
SimpleEE.prototype.on = function(eventname, callback) {
  this.events[eventname] || (this.events[eventname] = []);
  this.events[eventname].push(callback);
};
SimpleEE.prototype.emit = function(eventname) {
  var args = Array.prototype.slice.call(arguments, 1);
  if (this.events[eventname]) {
    this.events[eventname].forEach(function(callback) {
      callback.apply(this, args);
    });
  }
};
var emitter = new SimpleEE();


/* App start here */
//var rmtUdateBuff = [];
//var rmtUpdateFlag = 0;
//var rmtReserve = [];
//var usbScan = 0;
//var sendText = [];  //new Array();
//var tcpPort = 6213;
var hostIP =  '';
//var httpPort = '8001';
var httpIP = '';
var dbx;
var dbr;
var serverUrl = '';
// Connection check
connectionCheck(function (ip, _dbx, mb, _dbr, mr)  {
  hostIP = ip;
  httpIP = ip;
  if (hostIP == '')  {
    hostIP = '127.0.0.1';
    // console.log('Use internal IP ->', hostIP);
  }
  console.log ('Used IP ->', hostIP);
  dbx = _dbx;
  dbr = _dbr;
  // console.log('mbedq list ->');
  // console.log(mb);
  // Load config table
  loadConfig(dbx, function (err, item) {
    conf = item;
    //tcpPort = conf.tcpPort;
    //httpPort = conf.httpPort;
    serverUrl = conf.server+'/ns';
    restartFlag = 2;
    //emitter.emit('client-start1', '');
    console.log('Host ip ->', httpIP);
    console.log('listening on localhost:9002');
  });
});


/* HTTPS function */
function httpsHandler (req, res) {
  fromBrowser(req, res);
}

/* HTTP function */
function handler (req, res) {
  fromBrowser(req, res);
}

function fromBrowser(req, res)  {
  var path = url.parse(req.url).pathname;
  var ext = lib.getExt(path);
  var text = {"Content-Type": lib.getContentType(ext)};
  // console.log('GET:',path, text);
  if (ext == 'mp4') {
    var stat = fs.statSync(__dirname + path);
    var total = stat.size;
    if (req.headers['range'])  {
      var range = req.headers.range;
      var parts = range.replace(/bytes=/, "").split("-");
      var partialstart = parts[0];
      var partialend = parts[1];
      var start = parseInt(partialstart, 10);
      var end = partialend ? parseInt(partialend, 10) : total-1;
      var chunksize = (end-start)+1;
      console.log('RANGE: ' + start + ' - ' + end + ' = ' + chunksize);
      var file = fs.createReadStream(__dirname + path, {start: start, end: end});
      res.writeHead(206, { 'Content-Range': 'bytes ' + start + '-' + end + '/' + total, 'Accept-Ranges': 'bytes', 
                           'Content-Length': chunksize, 'Content-Type': 'video/mp4' });
      file.pipe(res);   
    }
    else  {
      console.log('ALL: ' + total);
      res.writeHead(200, { 'Content-Length': total, 'Content-Type': 'video/mp4' });
      fs.createReadStream(__dirname + path).pipe(res);
    }
  }
  else  {
    if (ext == 'reboot')  {
      res.writeHead(404, {"Content-Type": "text/plain"});
      res.end("System reboot --->");
      var exec = require('child_process').exec;
      exec ('sudo reboot', function (err, stdout, stderr)  {
        console.log('Reboot from web ->', err, stdout);
        console.log(stdout);
      });      
    }
    else  {
      fs.readFile(__dirname + path, function(error, data){
        if (!error) {
          res.writeHead(200, text);
          res.end(data);        
        }  
        else  {
          res.writeHead(404, {"Content-Type": "text/plain"});
          res.end("opps this doesn't exist - 404");
        }
      });
    }
  }  
}

var isDate = function(date) {
    return (new Date(date) !== "Invalid Date" && !isNaN(new Date(date)) )  ? true : false;
}

// var isValidDate = function (s) {
//     var status = false;
//     var bits = [];
//     if (s && s.length >= 6) {
//         if (s.indexOf(".") > -1) {
//             bits = s.split(".");
//             if(bits.length == 2){
//               if(bits[1].length == 4){
//                 console.log(bits[1].substring (3)); 
//                 if(bits[1].substring (3) ==='Z'){
//                   status = true;  
//                 }
//               }
//             }
//             console.log(bits[0]);
//             console.log(bits[1]);
//         }
//     } 
//     return status;
// }

//'2016-07-08T17:13:27.781Z'
//'2015-03-25T12:00:00-06:30'
//'Wed Mar 25 2015 07:00:00 GMT+0700'
//'Wed Mar 25 2015 07:00:00 GMT+0700 (SE Asia Standard Time)'
var isValidDate = function (s) {
    if (s && s.length >= 24) {
      if(s.indexOf("-") > -1){
        var bits = s.split("-");
        //console.log('ex1',bits.length);
        if(bits.length == 3 ){
          //console.log(bits[2]);
          if(bits[2].length == 16){
            //console.log(bits[2].substring (2,3)); 
            if((bits[2].substring (2,3) ==='T') && (bits[2].substring (11,12) ==='.') && (bits[2].substring (15) ==='Z')){
              return true;
            }
          }
        }
      }
    } 

    if (s && s.length >= 25) {
      if(s.indexOf("-") > -1){
        var bits = s.split("-");
        //console.log('ex2',bits.length);
        if(bits.length == 4 ){
          //console.log(bits[2]);
          if(bits[2].length == 11){
            //console.log(bits[2].substring (2,3)); 
            if((bits[2].substring (2,3) ==='T') && (bits[2].substring (5,6) ===':') && (bits[2].substring (8,9) ===':')){
              return true;
            }
          }
        }
      }
    } 

    if (s && s.length >= 32) {
      if(s.indexOf(" ") > -1){
        var bits = s.split(" ");
        //console.log('ex3',bits.length);
        if(bits.length >= 5 ){
          //console.log(bits[5]);
          if(bits[4].length == 8 && bits[5].length == 8){
            //console.log(bits[5].substring (0,4)); 
            if( (bits[4].substring (2,3) === ':') && (bits[4].substring (5,6) === ':') && (bits[5].substring (0,4) ==='GMT+') ){
              return true;
            }
          }
        }
      }
    } 

    return false;
}

// function chengDateTime(dataIn,callback){
//   var obj_out = {}
//   Object.keys(dataIn).forEach(function(key) {
//       console.log(key, dataIn[key]);
//       console.log('isValidDate ->',isValidDate(dataIn[key]));
//       if(isValidDate(dataIn[key])){
//         var date = new Date(dataIn[key]);
//  //       console.log(date instanceof Date);
// //        console.log('isDate1 ->',isDate1(dataIn[key]));
//         obj_out[key] = date;
//       }else{
//         obj_out[key] = dataIn[key];
//       }

//   });
//   callback(obj_out);
// }

function chengDateTime(dataIn,callback){
  //var Type = require('type-of-is');
  var obj_out = {}
  Object.keys(dataIn).forEach(function(key) {
      console.log(key, dataIn[key]);
      if(key == '_id') { 
        obj_out[key] = dataIn[key];
        console.log('data = _id');
        return; 
      }
      //console.log('isDate ->',isDate(dataIn[key]));
      console.log('isValidDate ->',isValidDate(dataIn[key]));
      //if(isDate(dataIn[key])){
      if(isValidDate(dataIn[key])){
        var date = new Date(dataIn[key]);
        console.log(date instanceof Date);
        obj_out[key] = date;
      }else{
         switch(typeof dataIn[key]){
          case 'object':
            obj_out[key] = dataIn[key];
            var obj_outSp1 = obj_out[key];
            var dataSp1 = dataIn[key];
            Object.keys(dataSp1).forEach(function(keySp1) {
              console.log(keySp1, dataSp1[keySp1]);
              console.log('isValidDate Sp1 ->',isValidDate(dataSp1[keySp1])); 
              if(isValidDate(dataSp1[keySp1])){
                var dateSp1 = new Date(dataSp1[keySp1]);
                console.log(dateSp1 instanceof Date);
                obj_outSp1[keySp1] = dateSp1;
            }else{
              switch(typeof dataSp1[keySp1]){
                  case 'object':
                    obj_outSp1[keySp1] = dataSp1[keySp1];
                    var obj_outSp2 = obj_outSp1[keySp1];
                    var dataSp2 = dataSp1[keySp1];
                    Object.keys(dataSp2).forEach(function(keySp2) {
                      console.log(keySp2, dataSp2[keySp2]);
                      console.log('isValidDate Sp2 ->',isValidDate(dataSp2[keySp2])); 
                      if(isValidDate(dataSp2[keySp2])){
                        var dateSp2 = new Date(dataSp2[keySp2]);
                        console.log(dateSp2 instanceof Date);
                        obj_outSp2[keySp2] = dateSp2;
                    }else{
                      switch(typeof dataSp2[keySp2]){
                          case 'object':
                            obj_outSp2[keySp2] = dataSp2[keySp2];
                            var obj_outSp3 = obj_outSp2[keySp2];
                            var dataSp3 = dataSp2[keySp2];
                            Object.keys(dataSp3).forEach(function(keySp3) {
                              console.log(keySp3, dataSp3[keySp3]);
                              console.log('isValidDate Sp3 ->',isValidDate(dataSp3[keySp3])); 
                              if(isValidDate(dataSp3[keySp3])){
                                var dateSp3 = new Date(dataSp3[keySp3]);
                                console.log(dateSp3 instanceof Date);
                                obj_outSp3[keySp3] = dateSp3;
                            }else{
                              obj_outSp3[keySp3] = dataSp3[keySp3];
                            }
                            }); 
                          break;
                          default:
                            obj_outSp2[keySp2] = dataSp2[keySp2];
                          break;
                        }

                    }
                    }); 
                  break;
                  default:
                    obj_outSp1[keySp1] = dataSp1[keySp1];
                  break;
                }
            }
            }); 
          break;
          default:
            obj_out[key] = dataIn[key];
          break;
         }
        console.log('Type -> ',(typeof dataIn[key]));
      }
  });
  callback(obj_out);
}

//===== Socket IO server =====//
//var port = 9001;
var io = require('socket.io');
var clientSock = [];
// var httpsIo = https.createServer(credentials);
// //httpsIo.listen(config.socketIoPort);
// httpsIo.listen('9001');
// var ns = io.listen(httpsIo);

var ns= io.listen('9002');

//credentials.requestCert = true;
//credentials.rejectUnauthorized = false;

// if(config.socketIoSslEnable == 'true') {
//   var httpsIo = https.createServer(credentials);
//   httpsIo.listen(config.socketIoPort);
//   var ns = io.listen(httpsIo);
//   // var nsx = io.listen(httpsIo);
//   // var ns  = nsx;
//    var ns1 = ns.of('/ns');
//   //var ns1 = io.listen(httpsIo).of('/ns');
// }else{
//   var ns= io.listen(config.socketIoPort);
//   // var nsx= io.listen(config.socketIoPort);
//   // var ns = nsx;
//    var ns1 = ns.of('/ns');
//   //var ns1 = io.listen(config.socketIoPort).of('/ns');
// }

ns.on('connection', function (sockAPI) {
  // New connection in comming
  console.log(' www '+'Server-socket.io start...',sockAPI.client.id);
  //sockAPI.disconnect() //test
  //return;

  var bA = sockAPI.client.conn.remoteAddress;

  var ii;
  if(clientSock.length == 0) {
     clientSock.push({ bSock: sockAPI, branchID: '', bAddr: bA });
     console.log('www','========== clientSock.length == 0 ==========','io connection',bA);
  }
  else {
    for(ii=0; ii<clientSock.length; ii++) {
      if(clientSock[ii].bAddr== bA) {
        break;          
        //console.log("==========bA",bA);
      }
    }
  }
  if(ii >= clientSock.length) {
    clientSock.push({ bSock: sockAPI, branchID: '', bAddr: bA });
    console.log('www','io connection',bA);
    }else{
      console.log('ii ->',ii,' clientSock.length ->',clientSock.length);
    }

  // Connection colse
  sockAPI.on('disconnect', function () {
    console.log(' www '+ 'io disconnect ...');
    var bC = '';
    for (var i=0; i< clientSock.length; i++)  {
      if (sockAPI == clientSock[i].bSock)  {  
        console.log(' www '+ 'io disconnect',clientSock[i].bAddr+ ' branchID:'+clientSock[i].branchID+' clientSock.length:'+clientSock.length);
        clientSock.splice(i, 1); 
        break;
      }
    }
    //console.log('Server-Socket.io already close for :', bC, '->',clientSock.length);
  });

  sockAPI.on('api-command-line', function (dataCmd, fn) {
    var exec = require('child_process').exec;
    if(dataCmd == 'sudo reboot' || dataCmd == 'sudo poweroff' || dataCmd == 'sudo shutdown now' || dataCmd == 'sudo shutdown -h now'){
      console.log('err -> ', null, 'stdout -> done');
      fn(null, {cmd : dataCmd, stdout:'done'}); // success
    }
    exec (dataCmd, function (err, stdout, stderr)  {
      console.log('err -> ',err, 'stdout ->',stdout);
      fn(err, {cmd : dataCmd, stdout:stdout}); // success
    });
  });

  sockAPI.on('api-resetQ', function (fn) {
    var exec = require('child_process').exec;
    loadConfig(dbx, function (err, item) {
      if(!err){
        var lastDate = new Date(item.lastDate);
        console.log('lastDate 1 ->',lastDate);
        lastDate = lastDate.setDate(lastDate.getDate()-1);
        item.lastDate = new Date(lastDate)
        console.log('item.lastDate ->',item.lastDate);
        
        dbFindUpdate (dbx, 'configs', {_id: item._id}, item, function (err, cnf) {
          if(!err){  
              exec ('sudo reboot', function (err, stdout, stderr)  {
                if(!err){
                  console.log('err -> ',err, 'stdout ->',stdout);
                  fn(null, {err:null,msg:'done'}); // success
                }else{
                  fn(err,{err:3,msg:'exec sudo reboot'}); // err      
                }
              });
          }else{
            fn(err,{err:2,msg:'dbFindUpdate configs'}); // err    
          }
        });
      }else{
        fn(err,{err:1,msg:'loadConfig'}); // err  
      }
    }); 
  });

  sockAPI.on('api-get-table', function (tableName, fn) {
      console.log('Read tables ->', tableName);
      var table = [];
      var statusReadTable = null;
      var async = require('async');  
      var q = async.queue(function (item, callback) {
        // console.log('Read table ->', item);
        dbx.collection(item).find({}).toArray(function (err, tbl) {
          if(!err){
            console.log('Read table ->', item, tbl.length);
            table.push({tableName: item, data: tbl});
          }
          callback(err);
        });
      });
      q.drain = function() {
        fn(statusReadTable, table, conf.branch.branchID); // success
      }
      if (tableName.length)  {
        q.push(tableName, function (err) {
          if(err){
            statusReadTable = err;
          }
        });
      }
    });  
    
    // Save table
    sockAPI.on('api-set-table', function (dataIn, fn) {
       console.log('Write table ->0', dataIn);
      var statusWriteTable = null;
      var table = [];
      var async = require('async');  
      var q = async.queue(function (item, callback) {
        dbx.collection(item.tableName).drop(function (err) {
          console.log('Write table ->', item.tableName);
          var count = item.data.length;
          var n = 0;
          for (var i = 0; i < item.data.length; i++)  {
            var obj = item.data[i];
            // if (obj._id == '')  var objId = new ObjectID();
            // else  var objId = new ObjectID(obj._id);
            var objId = new ObjectID();
            obj._id = objId;
            //console.log(obj);

            chengDateTime(obj,function (obj_out){

              console.log('obj_out -> ',obj_out);
              //console.log('Write table ->', item.tableName, objId, obj);
              dbx.collection(item.tableName).update({_id: objId}, {"$set": obj_out}, { upsert: true },function (err, res)  {
                if(!err){
                  console.log('n ->',n,' err ->',err);
                  if (++n >= count)  {
                    //var data = [];
                    //data.push({status:'done'});
                    table.push({tableName: item.tableName, data: [{status:'done'}]});
                    callback(err);          
                  }
                }else{
                   console.log('n ->',n,' err ->',err);
                  n = count + 1;
                  callback(err); 
                }
              });
            });
          } 
        });
      });
      q.drain = function() {
        restartFlag = 1;  
        fn(statusWriteTable, table , conf.branch.branchID); // success
        //emitter.emit('client-start', 'restart');
      }
      if (dataIn.length)  {
        q.push(dataIn, function (err) {
          if(err){
            statusWriteTable = err;
          }
        });
      }
    });  
});

