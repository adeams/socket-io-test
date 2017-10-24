/* Check net connection */
var os = require('os');

/* get IP addresss */
function getAddrIP (callback)  {
  var dt = new Date();
  var d = ''+zeroFill(dt.getFullYear(), 4)+'-'+zeroFill((dt.getMonth()+1), 2)+'-'+zeroFill(dt.getDate(),2);
  var t = zeroFill(dt.getHours(), 2)+':'+zeroFill(dt.getMinutes(), 2)+':'+zeroFill(dt.getSeconds(), 2);
  var hostIP = '';
  var cpu = os.cpus();
  console.log('');
  console.log(d+'/'+t);
  console.log('<---------------------->');
  console.log('<- Smart-Q App start. ->');
  console.log('<---------------------->');
  console.log(cpu.length+'-Core', os.cpus()[0].model);
  console.log('Total mem', os.totalmem());
  console.log('Free mem', os.freemem());
  console.log('Found', os.platform(), os.release());
  var n = 0;
  var ifaces = os.networkInterfaces();
  Object.keys(ifaces).forEach(function (ifname) {
    var alias = 0;
    ifaces[ifname].forEach(function (iface) {
      if (++n >= (Object.keys(ifaces).length*ifaces[ifname].length))  callback(hostIP);
      // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
      if ('IPv4' !== iface.family || iface.internal !== false)  return;
      // this single interface has multiple ipv4 addresses
      if (alias >= 1) console.log(ifname + ':' + alias, iface.address);
      else {  // this interface has only one ipv4 adress
        console.log('Found', ifname, iface.address);
        // if (ifname == 'eth0' || ifname == 'eth1' || ifname == 'eth2' || ifname == 'eth3')  hostIP = iface.address;
        // if (ifname == 'wlan0' && hostIP == '')  hostIP = iface.address;
        if (ifname[0] == 'e')  hostIP = iface.address;
        if (ifname[0] == 'w' && hostIP == '')  hostIP = iface.address;
      }
    });
  });  
}

/* mongoDB conection */
var MongoClient = require('mongodb').MongoClient;
function baseConnect(baseName, callback)  {
  MongoClient.connect(baseName, function (err, _db) {
    if (err) throw err;
    _db.collections(function(err, collections){       
      var tmp = []; 
      for (var i in collections)  {
        // console.log(collections[i]);
        tmp.push(collections[i].s.name);
      }
      callback(_db, tmp);
    });
  });
}

/* connection to IP addr / MongoDB */
module.exports.connectionCheck = function (callback) {
  getAddrIP(function(ip)  {
    baseConnect('mongodb://localhost:27017/mbedq', function (dbx, mb) {
      // callback(ip, dbx, mb);
      baseConnect('mongodb://localhost:27017/report', function (dbr, mr) {
        callback(ip, dbx, mb, dbr, mr);
      });
    });
  });
}

/* Serial port list */
module.exports.serialList = function (callback)  {
serialport.list(sportName, function (err, ports) {
  var n = 0;
  if (ports)  {
    //console.log('-------------------------------------------Port', ports.length);
    ports.forEach(function(port) {
      //if (port.comName == '/dev/ttyUSB0' || port.comName == '/dev/ttyUSB1' || 
      //   port.comName == '/dev/ttyS0' || port.comName == '/dev/ttyS1')  {
      if (port.comName == '/dev/ttyUSB0')  {
        console.log('Serial-list ->', port.comName);
        sportName.push(port.comName);
      }
      if (++n >= ports.length)  callback(n);
    });
  }
  else callback(0);
});
}

/* Split text for mplayer */
module.exports.soundSplit = function (callSound, path, text, calltype, sndExt) {
  var num = text; //.toString();
  var tens = 0;
  while (num.length) {
    var str = num.substring(0, 1);
    if (calltype == '(Value)') {  // value call
      if (str >= '1' && str <= '9' && num.length) {
        str = zeroFill(str, num.length);
        str = str.split('').reverse().join('');
        if(num.length == 2) tens = 1;
        if((tens == 1 ) && (str == '1' )){
          callSound.push(path+'ed'+sndExt);
        }else{
          callSound.push(path+str+sndExt);  
        }
      } 
      else {  if (str != '0')  callSound.push(path+str+sndExt);  }
    } 
    else  callSound.push(path+str+sndExt);   // Digit call
    num = num.substr(1);
  }
}

/* Encode numeric key */
module.exports.alphabetCheck = function (a) {
  //var keyCode = ['key_0', 'key_1', 'key_2', 'key_3', 'key_4', 'key_5', 'key_6', 'key_7', 'key_8', 'key_9'];
  //for (var i in keyCode) {
  //	if (k == keyCode[i])  return(Number(i));
  //}
  if (a.length > 1)  return(-1);
  else return(a);
}

/* Clear Z-Box key */
module.exports.clearZbox = function (rmt, zbxAry)  {
  for (var j in zbxAry)  {  // clear zbox key
    if (zbxAry[j].zboxRemote[0] == rmt.remoteName && zbxAry[j].zboxRemote[1] == rmt.remoteID)  {
      zbxAry[j].zboxKey = '';
      return;
    }
  }
}

/* string seperate and push */
module.exports.strSepPush = function (val, str, sep_chr) {
  var index = str.indexOf(sep_chr);
  if (index >= 0) {
    val.push(str.substring(0, index));
    str = str.substr(index+1);
    return(str.trim());
  }
  else val.push(str);
  return('');
} 

/* Send check in */
module.exports.checkDev = function (cmd) {
  cmd.sockAddress.write(':,'+cmd.Device+','+cmd.ID+','+cmd.Func+','+cmd.Data);
  console.log('Device checkin....');
}

/* Zero padding */
function zeroFill (number, width) {
  width -= number.toString().length;
  if ( width > 0 )  {
    return new Array( width + (/\./.test( number ) ? 2 : 1) ).join( '0' ) + number;
  }
  return number + ""; // always return a string
}
module.exports.zeroFill = zeroFill;

/* Write to serial port */
module.exports.writeDrain = function (sock, data, callback) {
  sock.write(data, function () {
    sock.write([0], function () {
      sock.drain(callback);
    });
  });
}

/* get socket */
module.exports.getWebSock = function (webSock, devName, devID)  {
  for (var i in webSock)  {  
    if (devName ==  webSock[i].dev  && devID == webSock[i].id)  {
      return(webSock[i].socket);
    }
  }  
  return(-1);
}

/* Check kiosk-web */
module.exports.clientCheck = function (webSock, extSock, devName, devID)  {
  for (var j in webSock)  {
    if (devName ==  webSock[j].dev  && devID == webSock[j].id)  {
      return(webSock[j].socket);
    }
  }  
  for (var k in extSock)  {
    if (devName ==  extSock[k].dev  && devID == extSock[k].id)  {
      return(extSock[k].socket);
    }
  }  
  return(-1);
}

/* Search array object */
module.exports.rowIndexOf = function (item, search, property) {
//  for(var i = 0, len = wrgAry.length; i < len; i++) {
  for (var i in item)  {
    if (item[i][property] == search) return i;
  }
  return -1;
}

module.exports.itemIndexOf = function (item, search, property)  {
  //for (var i in itemAry)  {
    for (var j in item.segment)  {
      if (item.segment[j][property] == search)  {
        return j;
      }
    }
  //}
  return -1;
}

module.exports.svgIndexOf = function (wrgAry, search)  {
  for (var i in wrgAry)  {
    for (var j in wrgAry[i].svgPriority)  {
      for (var k in wrgAry[i].svgPriority[j])  {
        if (wrgAry[i].svgPriority[j][k] == search)  {
          return i;
        }
      }
    }
  }
  return -1;
}

/* find remote index */
module.exports.findRmtID = function (rmt, cmd, rmtAll, rmtObj)  {
  for (var i = 0; i<rmtAll.length; i++)  {
    if (rmtAll[i].remoteName == rmt.remoteName && rmtAll[i].remoteID == rmt.remoteID)  {
      if (cmd != null)  { rmtObj[i].rmtDevIP = cmd.clientIP;  }
      return(i);
    }
  }
  return(-1);
} 

/* Load remote */
module.exports.loadRemote = function (dbx, scan485, rmtAll, rmtList, rmtObj, callback) {
  rmtAll = [];
  rmtList = [];
  rmtObj = [];
  dbx.collection('remote').find({}).sort({_id: 1}).toArray(function(err, retAry) {
    console.log('remote list...', retAry.length);
    for (var i in retAry)  {
      var rmt = retAry[i];
      rmtObj.push ({ rmtKey: '', rmtPwd: '', rmtQnext: '', rmtQtrans: [], rmtQhold: [], rmtQwait: 0, 
        rmtLCD: 0,  rmtLCDbak: 0, rmtQlist: 0, rmtDevIP: '', rmtserviceBegin: rmt.serviceBegin, 
        rmtServTout: 0, rmtAlert: [0, 0, 0, 0, 0, 0], rmtAlertIdx: 0, rmtAlertFlg: 0, rmtPrtIdx: 0, 
        rmtLogin: '', rmtUSRlist: '', rmtQpressTime: new Date(), rmtWisdomWait: 0, rmtTextNote: [],
      });
      rmtList.push([rmt.remoteName, rmt.remoteID]);
      if (rmt.devType != '') {
        scan485.push({ scanName: rmt.remoteName, scanID: rmt.remoteID, scanDev: rmt.devType});
      }
      if (rmt.remoteStatus != 'standby')  {
        if (rmt.remoteStatus == 'transfer' && rmt.Qdup != '') {
          rmt.remoteStatus = 'service';
          //if (rmt.remoteStatus == 'waiting' && rmt.Qdup != '')  rmt.remoteStatus = 'calling';
          dbFindUpdate (dbx, 'remote', {_id: rmt._id}, rmt, function (err, rmt) {
            console.log('Change status ->', rmt.remoteName, rmt.remoteID, rmt.remoteStatus);
          });
        } 
      }
      else  {
        if (rmt.workGroup != rmt.ownerGroup)  {
          rmt.workGroup = rmt.ownerGroup;
          dbFindUpdate (dbx, 'remote', {_id: rmt._id}, rmt, function (err, rmt) {
            console.log('Restore workgroup ->', rmt.remoteName, rmt.remoteID, rmt.workGroup);
          });
        }
      }
      rmtAll.push(rmt); 
    }
    callback(0, rmtObj, rmtList, rmtAll, scan485);  // loded done
  });
}

/* Load printer */
// function loadPrinter (scan485, prtAry, callback) {
module.exports.loadPrinter = function (dbx, scan485, prtAry, callback) {
  prtAry = [];
  dbx.collection('printer').find({}).sort({_id: 1}).toArray(function(err, retAry) {
    console.log('printer list...', retAry.length);
    for (var i in retAry)  {
      var prt = retAry[i];
      if (prt.devType != '') {
        scan485.push({ scanName: prt.printerName, scanID: prt.printerID, scanDev: prt.devType});
      }
      prtAry.push(prt);
    }
    callback(0, prtAry);  // loded finish
  });
}

/* Load z-box */
// function loadZbox (scan485, zbxAry, callback) {
module.exports.loadZbox = function (dbx, scan485, zbxAry, callback) {
  zbxAry = [];
  dbx.collection('zbox').find({}).sort({_id: 1}).toArray(function(err, retAry) {
    console.log('zbox list...', retAry.length);
    for (var i in retAry)  {
      var zbx = retAry[i];
      if (zbx.devType != '' && zbx.zboxFunc != 'off') {
        scan485.push({ scanName: zbx.zboxName, scanID: zbx.zboxID, scanDev: zbx.devType});
      }
      zbxAry.push({zboxName: zbx.zboxName, zboxID: zbx.zboxID, zboxRemote: zbx.zboxRemote, 
                   zboxFunc: zbx.zboxFunc, zboxKey: ''});
    }
    callback(0, zbxAry);  // loded finish
  });
}
// module.exports.loadZbox = loadZbox;

/* Load service item */
// var itemAry = [];
// module.exports.itemAry = itemAry;
// var sndAry = [];
// module.exports.sndAry = sndAry;
// function loadServItem (callback) {
function loadServItem (dbx, itemAry, sndAry, callback) {
  itemAry = [];
  sndAry = [];
  dbx.collection('servItem').find({}).sort({printerKey: 1}).toArray(function(err, retAry) {
    console.log('servItem list...', retAry.length);
    for (var i in retAry)  {
      var svi = retAry[i];
      itemAry.push(svi);
      sndAry.push({printerKey: svi.printerKey, soundStyle: svi.soundStyle });
    }
    callback(0, itemAry, sndAry);  // loded finish
  });
}
module.exports.loadServItem = loadServItem;

/* Load service group */
// function loadServGroup (svgAry, callback) {
module.exports.loadServGroup = function (dbx, svgAry, callback) {
  svgAry = [];
  dbx.collection('servGroup').find({}).sort({_id: 1}).toArray(function(err, retAry) {
    console.log('servGroup list...', retAry.length);
    for (var i in retAry)  {
      var svg = retAry[i];
      svgAry.push(svg);
    }
    callback(0, svgAry);  // loded finish
  });
}
// module.exports.loadServGroup = loadServGroup;

/* Load workgroup */
// function loadWorkGroup (wrgAry, callback) {
module.exports.loadWorkGroup = function (dbx, wrgAry, callback) {
  wrgAry = [];
  dbx.collection('workGroup').find({}).sort({_id: 1}).toArray(function(err, retAry) {
    console.log('workGroup list...', retAry.length);
    for (var i in retAry)  {
      var wrg = retAry[i];
      wrg.Qtransfer = [];
      wrg.Qhold = [];
      wrgAry.push(wrg);
    }
    callback(0, wrgAry);  // loded finish
  });
}
// module.exports.loadWorkGroup = loadWorkGroup;

/* Load sound option */
// function loadRealtime (conf, rtlAry, callback) {
module.exports.loadRealtime = function (dbx, conf, rtlAry, callback) {
  rtlAry = [];
  dbx.collection('realtime').find({}).sort({_id: 1}).toArray(function(err, retAry) {
    console.log('realtime list...', retAry.length);
    for (var i in retAry)  {
      var item = retAry[i];
      rtlAry.push(item);
    }
    callback(0, rtlAry);  // loded finish
  });
}
// module.exports.loadRealtime = loadRealtime; 

/* Load config */
var optAry = [];
module.exports.optAry = optAry; 
module.exports.loadConfig = function (dbx, callback) {
  dbx.collection('configs').find({}).sort({_id: 1}).toArray(function(err, retAry) {
    var item = retAry[0];
    console.log('configs list...', item.cfgName);
    for (var i in item.soundOption)  {
      optAry[item.soundOption[i].channel] = { soundBuff: [], soundHandle: {}, soundSock: {}, 
      soundOption: item.soundOption[i] };
    }
    callback(0, item);  // loded finish
  });
}

/* Load remote status */
// function loadStatusRmt (rmtTextStatus, callback)  {
module.exports.loadStatusRmt = function (dbx, rmtTextStatus, callback)  {
  rmtTextStatus = [];
  dbx.collection('remoteStatus').find({}).sort({_id: 1}).toArray(function(err, retAry) {
    console.log('remoteStatus list...', retAry.length);
    for (var i in retAry)  {
      var item = retAry[i];
      rmtTextStatus.push(item); 
    }
    callback(0, rmtTextStatus);  // loded finish
  });
}  
// module.exports.loadStatusRmt = loadStatusRmt;

/* Load remote status */
// function loadBranchList (branchList, callback)  {
module.exports.loadBranchList = function (dbx, branchList, callback)  {
  branchList = [];
  dbx.collection('branchList').find({}).sort({_id: 1}).toArray(function(err, retAry) {
    console.log('Branch list...', retAry.length);
    for (var i in retAry)  {
      var item = retAry[i];
      branchList.push(item); 
    }
    callback(0, branchList);  // loded finish
  });
}  
// module.exports.loadBranchList = loadBranchList;

/* Load Q transfer */
// function loadQtoday (qtdTransfer, qtdHold, qtdBuff, callback)  {
module.exports.loadQtoday = function (dbx, qtdTransfer, qtdHold, qtdBuff, callback)  {
  qtdTransfer = [];
  qtdHold = [];
  qtdBuff = [];
  dbx.collection('Qtoday').find({}).sort({QpressTime: 1}).toArray(function(err, retAry) {
    if (err)  {
      callback(0, qtdTransfer, qtdHold, qtdBuff);  // loded finish
      return;
    }
    console.log('Qtoday list...', err);
    for (var i in retAry)  {
      var qtd = retAry[i];
      if (qtd.Qstatus == 'transfer')  qtdTransfer.push([qtd, '']); 
      if (qtd.Qstatus == 'hold')  qtdHold.push(qtd);
      if (qtd.Qstatus != 'completed' && qtd.Qstatus != 'cancel')  {
        qtdBuff.push({_id: qtd._id, Qnumber: qtd.Qnumber, Qstatus: qtd.Qstatus, QpressTime: qtd.QpressTime, 
        servItem: qtd.servItem, tMin: qtd.tMin, tMax: qtd.tMax, Qtype: qtd.Qtype, jobName: qtd.jobName});
      }
    }
    callback(0, qtdTransfer, qtdHold, qtdBuff);  // loded finish
  });
}
// module.exports.loadQtoday = loadQtoday;

/* Load remote status */
// function loadDisplayType (dispType, callback)  {
module.exports.loadDisplayType = function (dbx, dispType, callback)  {
  dispType = [];
  dbx.collection('displayType').find({}).sort({_id: 1}).toArray(function(err, retAry) {
    console.log('displayType list...', retAry.length);
    for (var i in retAry)  {
      var item = retAry[i];
      dispType.push(item); 
    }
    callback(0, dispType);  // loded finish
  });
}
// module.exports.loadDisplayType = loadDisplayType;

/* Load user list */
// function loadUserList (userList, userLogin, callback)  {
module.exports.loadUserList = function (dbx, userList, userLogin, callback)  {
  userList = [];
  userLogin = [];
  dbx.collection('userList').find({}).sort({_id: 1}).toArray(function(err, retAry) {
    console.log('userList list...', retAry.length);
    for (var i in retAry)  {
      var item = retAry[i];
      if (item.flag == '' || item.flag == 'logon')  item.flag = 'logoff';
      userList.push(item);
      userLogin.push(''); 
    }
    callback(0, userList, userLogin);  // loded finish
  });
}
// module.exports.loadUserList = loadUserList;

/* Load TRN user */
// function loadTrnUser (trnUser, trnLogin, callback)  {
module.exports.loadTrnUser = function (dbx, trnUser, trnLogin, callback)  {
  trnUser = [];
  trnLogin = [];
  dbx.collection('trnUser').find({}).sort({_id: 1}).toArray(function(err, retAry) {
    console.log('trnUser list...', retAry.length);
    for (var i in retAry)  {
      var item = retAry[i];
      item['flag'] = '';
      trnUser.push(item); 
      trnLogin.push(''); 
    }
    callback(0, trnUser, trnLogin);  // loded finish
  });
}
// module.exports.loadTrnUser = loadTrnUser;

/* Load reserve list */
// function loadResv (revObj, callback)  {
module.exports.loadResv = function (dbx, revObj, callback)  {
  resvObj = [];
  dbx.collection('reserve').find({}).sort({_id: 1}).toArray(function(err, retAry) {
    console.log('Reserve list...', retAry.length);
    for (var i in retAry)  {
      var item = retAry[i];
      revObj.push(item); 
    }
    callback(0, resvObj);  // loded finish
  });
}
// module.exports.loadResv = loadResv;

/* Load reserve list */
function loadTemplate (callback)  {
  var temp = [];
  var fs = require('fs');
  var files = fs.readdirSync('templateQ');
  var path = require('path');
  var async = require('async');  
  var q = async.queue(function (f, callback) {
    fs.readFile('templateQ/'+f, 'utf8', function(err, data){
      if (err)  console.log('Read error...');
      else  {
        var lines = data.split("\n");
        if (lines[0].indexOf('//template=') >= 0)  {
          var tp = lines[0].replace('//template=', '');
          //console.log(tp, 'templateQ/'+f);
          temp.push([tp, 'templateQ/'+f]);
          //console.log(data.toString());
        }        
      } 
      callback(0); 
    });
  });
  q.drain = function() {
    console.log('Template list...', temp.length);
    callback(0, temp);
  }
  q.push(files, function (err) {
  });
}
module.exports.loadTemplate = loadTemplate;

/* Load reserve list */
function listDir (folder)  {
  var fs = require('fs');
  var files = fs.readdirSync(folder);
  var path = require('path');
  //console.log(files);
  return(files);
}
module.exports.listDir = listDir;

// sudo apt-get install libkrb5-dev --> npm install mongoskin
//var db = mongo.db('mongodb://192.168.1.104:27017/mbedq', {native_parser:true});
//var db = mongo.db('mongodb://203.146.251.61:27017/mbedq', {native_parser:true}); 
// var mongo = require('mongoskin'); 
// var db = mongo.db('mongodb://localhost:27017/mbedq', {native_parser:true});
// module.exports.db = db;

/* get collection data */
function dbGet(dbx, coll, arg1, arg2, N, callback) {
//  console.log('Get:'+coll+arg1);
  dbx.collection(coll).find(arg1).sort(arg2).limit(N).toArray(function (err, item) {
  if( err || !item.length) {  // console.log('Record not found...');
    callback(1, []);
  } 
  else item.forEach( function(item) {  //console.log(item);
    callback(0, item);
    });
  });
}
module.exports.dbGet = dbGet;

function dbGetArray(dbx, coll, arg1, arg2, N, callback) {
  dbx.collection(coll).find(arg1).sort(arg2).limit(N).toArray(function (err, items) {
    if( err ) {  
      callback(1, []);
      return
    } 
    callback(0, items);
  });
}
module.exports.dbGetArray = dbGetArray;

/* Insert Q to day */
function dbInsert (dbx, coll, arg, callback) {
//  console.log('Insert:'+coll+''+arg);
  dbx.collection(coll).insert(arg, function(err, item){
    if (err)  {
      var exec = require('child_process').exec;
      setTimeout(function()  {    
      exec ('sudo service mongodb stop', function (err, stdout, stderr)  {
        console.log('Stop mongodb service ->', err, stderr);
        console.log(stdout);
        exec ('sudo rm -R /data/db/mongod.lock', function (err, stdout, stderr)  {
          console.log('Delete lock file ->', err, stderr);
          console.log(stdout);
          exec ('sudo ../mongodb/bin/mongod --dbpath /data/db --repair', function (err, stdout, stderr)  {
            console.log('Repair mondodb ->', err, stderr);
            console.log(stdout);
            exec ('sudo reboot', function (err, stdout, stderr)  {
              console.log('Reboot from web ->', err, stdout);
              console.log(stdout);
            });      
          });
        });
      });
      }, 1000*3);
    }
    else  callback(err, item.ops);
  });
} 
module.exports.dbInsert = dbInsert;

/* Update collection */
function dbFindUpdate(dbx, coll, arg1, arg2, callback) {
  dbx.collection(coll).findAndModify(arg1, {}, {$set: arg2}, {new: true}, function (err, item) {
  if(err)  {   // console.log('Can not update...');
//    callback(1, item);
    callback(1, item.value);
  } 
  else {   // console.log(item.value);
//    callback(0, item);
    callback(0, item.value);
  }
  });
} 
module.exports.dbFindUpdate = dbFindUpdate;

/* Update collection */
function dbArrayUpdate(dbx, coll, ary, callback) {
  var n = 0;
  ary.forEach(function (item) {
    dbx.collection(coll).findAndModify({_id: item._id}, {}, {$set: item}, {new: true}, function (err, item) {
      //console.log(n);
      if (++n >= ary.length)  callback(0, n); 
    });
  });
} 
module.exports.dbArrayUpdate = dbArrayUpdate; 

function dbArrayInsert(dbx, coll, ary, callback) {
  var n = 0;
  ary.forEach(function (item) {    
    dbx.collection(coll).insert(item, function (err, res) {
      //console.log(n);
      if (++n >= ary.length)  callback(0, n); 
    });
  });
} 
module.exports.dbArrayInsert = dbArrayInsert; 

/* Drop collection */
function dbDrop(dbx, coll, callback) {
//  console.log('Update:'+coll+arg2);
  dbx.collection(coll).drop(function (err) {
    callback(err);
  });
} 
module.exports.dbDrop = dbDrop;

/* Drop collection */
function rpDrop(dbr, coll, callback) {
//  console.log('Update:'+coll+arg2);
  dbr.collection(coll).drop(function (err) {
    callback(err);
  });
} 
module.exports.rpDrop = rpDrop;

/* copy to report */
// var rp = mongo.db('mongodb://localhost:27017/report', {native_parser:true});
// module.exports.async = async;
function copyReport (dbx, dbr, dt, branch, callback) {	
  var async = require('async');
  var nt = new Date();
  nt.setHours(0,0,0,0);
  dt.setHours(0,0,0,0);
  async.parallel([
  function(callback) {
    var ary = [];
    dbx.collection('userList').find({}).sort({_id: 1}).toArray(function(err, retAry) {
      if (retAry.length)  {
        for (var i in retAry)  {
          var usl = retAry[i];
          ary.push({userName: usl.userName, FullName: usl.FullName, segment: usl.segment});       
        }
        var obj = {_id: branch.branchID+'-'+dt, date: dt, branch: branch, details: ary};
        dbr.collection('sumUser').update({_id: branch.branchID+'-'+dt}, {"$set": obj}, { upsert: true }, 
        function (err, res)  {
          console.log('Copy user report ->', ary.length);
          callback (null, 1);
        });
      }  
      else  callback (null, 1);
    });
  }, 
  function(callback) {
    var ary = [];
    dbx.collection('remote').find({}).sort({_id: 1}).toArray(function(err, retAry) {
      if (retAry.length)  {
        for (var i in retAry)  {
          var rmt = retAry[i];          
          ary.push({remoteName: rmt.remoteName, remoteID: rmt.remoteID, counterID: rmt.counterID,
                    counterType: rmt.counterType, segment: rmt.segment});       
        }
        var obj = {_id: branch.branchID+'-'+dt, date: dt, branch: branch, details: ary};
        dbr.collection('sumCounter').update({_id: branch.branchID+'-'+dt}, {"$set": obj}, { upsert: true }, 
        function (err, upd)  {
          console.log('Copy counter report ->', ary.length);
          callback (null, 2);
        });
      }  
      else  callback (null, 2);
    });
  },
  function(callback) {
    var ary = [];
    dbx.collection('servItem').find({}).sort({_id: 1}).toArray(function(err, retAry) {
      if (retAry.length)  {
        for (var i in retAry)  {
          var svi = retAry[i];          
          ary.push({name: svi.name, segment: svi.segment, jobName: svi.jobName});       
        }
        var obj = {_id: branch.branchID+'-'+dt, date: dt, branch: branch, details: ary};
        dbr.collection('sumTransaction').update({_id: branch.branchID+'-'+dt}, {"$set": obj}, { upsert: true }, 
        function (err, upd)  {
          console.log('Copy transaction report ->', ary.length);
          callback (null, 3);
        });
      }  
      else  callback (null, 3);
    });
  },
  function(callback) {
    var ary = [];
    dbx.collection('realtime').find({}).sort({_id: 1}).toArray(function(err, retAry) {
      if (retAry.length)  {
        for (var i in retAry)  {
          var rtl = retAry[i];          
          ary.push(rtl);       
        }
        var obj = {_id: branch.branchID+'-'+dt, date: dt, branch: branch, details: ary};
        dbr.collection('realtime').update({_id: branch.branchID+'-'+dt}, {"$set": obj}, { upsert: true }, 
        function (err, upd)  {
          console.log('Copy realtime report ->', ary.length);
          callback (null, 4);
        });
      }  
      else  callback (null, 4);
    });
  }, 
  function(callback) {
    var find = {$or: [{ Qstatus: 'standby'}, { Qstatus: 'service'}, {Qstatus: 'hold'}, {Qstatus: 'transfer'}, 
                      { Qstatus: 'waiting'}, { Qstatus: 'calling'}]};
    // dbx.collection('Qtoday').find({Qstatus: 'standby'}).count(function(err, count) {
    dbx.collection('Qtoday').find(find).count(function(err, count) {
      console.log('Number of Q-today ->', count);
      var n = 0;
      if (count > 0)  {
        // dbx.collection('Qtoday').find({Qstatus: 'standby'}).sort({_id: 1}).forEach(function(qtd) {
        dbx.collection('Qtoday').find(find).forEach(function(qtd) {
          if (nt != dt)  {
            qtd.Qstatus = 'noservice'; 
            // qtd.Qstatus = 'CancelBySystem'; 
            qtd.QbeginTime = '';
            qtd.QendTime = '';
            qtd.counterType = '';
          }
          // console.log('Read Q-today ->', qtd.Qnumber);
          dbFindUpdate (dbx, 'Qtoday', {_id: qtd._id}, qtd, function (err, qtd) {
            // console.log('Update Q-today ->', qtd.Qnumber);
            if (++n == count)  {
              console.log('Copy Q-today report ->', n);
              callback (null, 5);
            }
          });
        });
      }
      else  callback(null, 5);
    });
  }],
  function(error, results) {
    console.log('Copy done...');
    callback (0);
  });
} 
module.exports.copyReport = copyReport;

/* Get report information */
function getReportInfo(dbr, conf, callback)  {
  var report = [];
  dbr.collection('Qtoday').count(function(err, count) {    
    report.push(count);
    dbr.collection('realtime').count(function(err, count) {    
      report.push(count);
      dbr.collection('sumCounter').count(function(err, count) {    
        report.push(count);
        dbr.collection('sumTransaction').count(function(err, count) {    
          report.push(count);
          dbr.collection('sumUser').count(function(err, count) {    
            report.push(count);
            callback(report);
          });
        });
      });
    });
  });
}
module.exports.getReportInfo = getReportInfo;

/* Reset Q */
function resetQ (dbx, rmtRst, callback) {	
  var async = require('async');
  async.parallel([
    function(callback) {
      var n = 0;
      dbx.collection('userList').count(function(err, count) {
        console.log('Clear userList ->', n, count);
        if (count > 0)  {
          dbx.collection('userList').find().sort({_id: 1}).forEach(function(usl) {
            for (var i in usl.segment)  {
              usl.segment[i].Qcomplete = 0;
              usl.segment[i].Qcancel = 0;
              usl.segment[i].QserviceTime = 0;
              usl.segment[i].QwaitTime = 0;
              usl.timeDetail = { h8: [], h9: [], h10: [], h11: [], h12: [], h13: [], h14: [], h15: [], 
                    h16: [], h17: [], h18: [], h19: [] };
            } 
            dbx.collection('userList').update({_id: usl._id}, {"$set": usl}, function (err, upd)  {
              if (++n >= count)  callback (null, 1);
            });
          });
        }
        else  callback (null, 1);
      });
    },
    function(callback) {
      var n = 0;
      dbx.collection('remote').count(function(err, count) {
        console.log('Clear counter ->', n, count);
        if (count > 0)  {
          dbx.collection('remote').find().sort({_id: 1}).forEach(function(rmt) {
            if (rmtRst == 'clearCounter')  {
              if (rmt.counterType == 'H')  {
                rmt.workGroup = rmt.ownerGroup = 'DefHI';
              }
              else  {
                rmt.workGroup = rmt.ownerGroup = 'DefLO';
              }
            }
            rmt.remoteStatus = 'standby';
            rmt.Qdup = ''; 
            for (var i in rmt.segment)  {
              rmt.segment[i].Qcomplete = 0;
              rmt.segment[i].Qcancel = 0;
              rmt.segment[i].QserviceTime = 0;
              rmt.segment[i].QwaitTime = 0;
            }
            dbx.collection('remote').update({_id: rmt._id}, {"$set": rmt}, function (err, upd)  {
              if (++n >= count)  callback (null, 2);
            });
          });        
        }
        else  callback (null, 2);
      });
    },
    function(callback) {
      var n = 0;
      dbx.collection('servItem').count(function(err, count) {
        console.log('Clear transaction ->', n, count);
        if (count > 0)  {
          dbx.collection('servItem').find().sort({_id: 1}).forEach(function(svi) {
            for (var i in svi.segment)  {
              svi.segment[i].Qcomplete = 0;
              svi.segment[i].Qcancel = 0;
              svi.segment[i].QserviceTime = 0;
              svi.segment[i].QwaitTime = 0;
              svi.segment[i].Qwait = 0;
              svi.segment[i].Qtotal = 0;
            }
            dbx.collection('servItem').update({_id: svi._id}, {"$set": svi}, function (err, upd)  {
              if (++n >= count)  callback (null, 3);
            });
          });
        }
        else  callback (null, 3);
      });
    },
    function(callback) {
      var n = 0;
      dbx.collection('rangeQ').count(function(err, count) {
        console.log('Clear rangeQ ->', n, count);
        if (count > 0)  {
          dbx.collection('rangeQ').find().sort({_id: 1}).forEach(function(rnq) {
            rnq.Qnow = rnq.Qmin;
            dbx.collection('rangeQ').update({_id: rnq._id}, {"$set": rnq}, function (err, upd)  {
              if (++n >= count)  callback (null, 4);
            });
          });
        }
        else callback (null, 4);
      });
    },
    function(callback) {
      var n = 0;
      dbx.collection('realtime').count(function(err, count) {
        console.log('Clear realtime ->', n, count);
        if (count > 0)  {
          dbx.collection('realtime').find().sort({_id: 1}).forEach(function(rtl) {
            rtl.h8 = 0; rtl.h9 = 0; rtl.h10 = 0; rtl.h11 = 0;  rtl.h12 = 0;  rtl.h13 = 0;  rtl.h14 = 0;
            rtl.h15 = 0;  rtl.h16 = 0;  rtl.h17 = 0;  rtl.h18 = 0;  rtl.h19 = 0;
            rtl['total'] = 0;
            rtl['under15'] = 0;
            rtl['over15'] = 0;
            rtl['noSMS'] = 0;
            rtl['sendSMS'] = 0;
            rtl['comeBack'] = 0;
            rtl['goAway'] = 0;
            rtl['hold'] = 0;
            dbx.collection('realtime').update({_id: rtl._id}, {"$set": rtl}, function (err, upd)  {
              if (++n >= count)  callback (null, 5);
            });
          });
        }
        else  callback (null, 5);
      });
    },
    function(callback) {
      dbx.collection('configs').find().sort({_id: 1}).forEach(function(cfg) {
      	cfg.vipStart = cfg.vipStart = 1;
        dbx.collection('configs').update({_id: cfg._id}, {"$set": cfg}, function (err, upd)  {
          console.log('Clear VIP Q ->', cfg.vipStart);
          callback (null, 6);
        });
      });
    }],
    // function(callback) {
    //   dbDrop ('Qtoday', function (err)  {
    //     console.log('Clear Qtoday -->');
    //     callback (null, 7);
    //   });
    // }], 
    function(error, results) {
      console.log('Clear done...');
      callback (0);
  });
}
module.exports.resetQ = resetQ;

/* Backup database */
function dbBackup (conf, callback)  {
  var exec = require('child_process').exec;
  exec ('../mongodb/bin/mongodump -d mbedq -o backupconfig/', function (err, stdout, stderr)  {
    console.log('Dump database flag ->', err, stderr);
    console.log(stdout);
    exec ('zip -r backupconfig/core.zip ../queue/q.js ../queue/lib.js ../queue/setting ../queue/templateQ ../queue/webkey', 
    function (err, stdout, stderr)  {
      console.log('ZIP-Q backup flag ->', err, stderr);
      console.log(stdout);
      callback(0);
    });
  });
}
module.exports.dbBackup = dbBackup;

/* Update script */
function scriptUpdate (dbx, filename, conf, callback)  {
  var fs = require('fs');
  fs.readFile('updateconfig/'+filename, 'utf8', function(err, data)  {
    if (err) {
      console.log('Read script error ->', err);
      callback(0);
      return;
    }
    else  {
      var lines = data.split("\n");
      if (lines[0].indexOf('//template=') >= 0)  {
        var tp = lines[0].replace('//template=', '');        
        var exec = require('child_process').exec;
        exec ('../mongodb/bin/mongo < updateconfig/'+filename, function (err, stdout, stderr)  {
          console.log('Template update flag ->', err, stderr);
          console.log(stdout);
          exec ('mv updateconfig/'+filename+' templateQ/', function (err, stdout, stderr)  {
            console.log('Move script flag ->', err, stderr);
            console.log(stdout);
            dbFindUpdate (dbx, 'configs', {_id: conf._id}, {template: tp}, function (err, cnf) {
              console.log('Update end ->');
              callback(0);
            });  
          });
        });
      }
    }
  });
}

/* Update unzip file */
function unzipUpdate (dbx, filename, val, obj, conf, itemAry, sndAry, callback)  {
  var exec = require('child_process').exec;
  var fs = require('fs');
  var sound = {sound: '', core: ''};
  var dest = '../';
  if (val == 'soundCore')  {
    var fname = new Date();
    fname = conf.cfgName+'_soundCore_'+fname.toISOString().split(':').join('')+'.zip';
    exec ('mv ./updateconfig/'+filename+' ./sound-update/'+fname, function (err, stdout, stderr)  {
      console.log('Sound core update flag ->', err, stderr);
      console.log(stdout);
      fs.readFile('sound-update/sound.json', 'utf8', function(err, data) {
        if (err)  var data = sound;
        else var data = JSON.parse(data);
        data.core = fname;
        var str = JSON.stringify(data, null, 4);
        fs.writeFile('sound-update/sound.json', str, 'utf8', function(err, data) {
          console.log('JSON Sound property flag ->', err, data);
          callback(0);  
        });
      });
    });
    return;
  }
  exec ('unzip -o updateconfig/'+filename+' -d '+dest, function (err, stdout, stderr)  {
    console.log('Unzip update flag ->', err, stderr);
    console.log(stdout);
    // Update sound 
    if (val == 'sound')  {
      var fname = new Date();
      fname = conf.cfgName+'_sound_'+fname.toISOString().split(':').join('')+'.zip';
      var opt = 'zip -r ./sound-update/'+fname+' ./sound';
      console.log("Sound update ->", opt);
      exec (opt, function (err, stdout, stderr)  {
        fs.readFile('sound-update/sound.json', 'utf8', function(err, data) {
          if (err)  var data = sound;
          else var data = JSON.parse(data);
          data.sound = fname;
          var str = JSON.stringify(data, null, 4);
          fs.writeFile('sound-update/sound.json', str, 'utf8', function(err, data) {
            console.log("Sound update finish ->", err, data);
            loadServItem(dbx, itemAry, sndAry, function (err, a, b) {
              itemAry = a;
              sndAry = b;
              console.log('Service item length ->', itemAry.length);
              for (var i in itemAry)  {
                if (itemAry[i].soundStyle[obj.lng] == null)  {
                  console.log('Language not found ->');
                  callback(0);
                  return;
                }
                for (var j in itemAry[i].soundStyle[obj.lng])  {
                  var st = itemAry[i].soundStyle[obj.lng][j];
                  var k = st.indexOf(obj.lng);
                  if (k > 0)  {
                    k += obj.lng.length+1;
                    var cut = st.slice(k);
                    var l = cut.indexOf('/');
                    cut = cut.slice(0, l);
                    //console.log(st);
                    st = st.replace(cut, obj.dir);
                    itemAry[i].soundStyle[obj.lng][j] = st;
                    console.log(st);
                  }
                }
              }
              var n = 0;
              for (var i in itemAry)  {
                (function() {
                var item = itemAry[i];
                dbFindUpdate (dbx, 'servItem', {_id: item._id}, item, function (err, item) {
                  if (++n >= itemAry.length)  {
                    console.log('Write-serviceItem-Done...');
                    exec ('rm updateconfig/'+filename, function (err, stdout, stderr)  {
                      console.log('Remove update zip flag ->', err, stderr);
                      console.log(stdout);
                      callback(0);  
                    });
                  }
                });
                })();
              }
            });
          });
        });
      });
      return;
    }
    // Update another case reboot 
    callback(1);
  });
} 

/* jsonWriteBase */
function jsonWrite (dbx, data, callback)  {
  var data = JSON.parse(data);
  var async = require('async');  
  var q = async.queue(function (item, callback) {      
    var collection = item.collection;
    var query = item.query;
    var action = item.action;
    var doc = item.data;
    console.log('JSON update flag ->',collection, query, action);
    // console.log('Document to update ->', doc);
    // for userList configs   
    if (collection == 'userList')  {
      if (doc.createDate != '') doc.createDate = new Date(doc.createDate);
      if (doc.startDate != '')  doc.startDate = new Date(doc.startDate);
      if (doc.expireDate != '')  doc.expireDate = new Date(doc.expireDate);
      if (doc.activeDate != '')  doc.activeDate = new Date(doc.activeDate);
      if (doc.lastLogon[0] != '')   doc.lastLogon[0] = new Date(doc.lastLogon[0]);
      if (doc.lastLogon[1] != '')   doc.lastLogon[1] = new Date(doc.lastLogon[1]);
      if (doc.disableStart != '')  doc.disableStart = new Date(doc.disableStart);
      if (doc.disableExpire != '')  doc.disableExpire = new Date(doc.disableExpire);

      var n = doc.userPass.length;
      var up = [ {userPass: '', dateCreate: new Date(), dateExpiry: new Date()},
              {userPass: '', dateCreate: new Date(), dateExpiry: new Date()},
              {userPass: '', dateCreate: new Date(), dateExpiry: new Date()},
              {userPass: '', dateCreate: new Date(), dateExpiry: new Date()},
              {userPass: '', dateCreate: new Date(), dateExpiry: new Date()},
              {userPass: '', dateCreate: new Date(), dateExpiry: new Date()} ];
      for (var i = 0; i < n; i++)  {
        up[i].userPass = doc.userPass[i].userPass;
        up[i].dateCreate = new Date(doc.userPass[i].dateCreate);
        up[i].dateExpiry = new Date(doc.userPass[i].dateExpiry);
      }
      doc.userPass = up;

/*
      if (typeof doc.userPass[0].dateCreate !== 'undefined')  
        doc.userPass[0].dateCreate = new Date(doc.userPass[0].dateCreate);
      if (typeof doc.userPass[0].dateExpiry !== 'undefined')  
        doc.userPass[0].dateExpiry = new Date(doc.userPass[0].dateExpiry);
      if (typeof doc.userPass[1].dateCreate !== 'undefined')  
        doc.userPass[1].dateCreate = new Date(doc.userPass[1].dateCreate);
      if (typeof doc.userPass[1].dateExpiry !== 'undefined')  
        doc.userPass[1].dateExpiry = new Date(doc.userPass[1].dateExpiry);
      if (typeof doc.userPass[2].dateCreate !== 'undefined')  
        doc.userPass[2].dateCreate = new Date(doc.userPass[2].dateCreate);
      if (typeof doc.userPass[2].dateExpiry !== 'undefined')  
        doc.userPass[2].dateExpiry = new Date(doc.userPass[2].dateExpiry);
      if (typeof doc.userPass[3].dateCreate !== 'undefined')  
        doc.userPass[3].dateCreate = new Date(doc.userPass[3].dateCreate);
      if (typeof doc.userPass[3].dateExpiry !== 'undefined')  
        doc.userPass[3].dateExpiry = new Date(doc.userPass[3].dateExpiry);
      if (typeof doc.userPass[4].dateCreate !== 'undefined')  
        doc.userPass[4].dateCreate = new Date(doc.userPass[4].dateCreate);
      if (typeof doc.userPass[4].dateExpiry !== 'undefined')  
        doc.userPass[4].dateExpiry = new Date(doc.userPass[4].dateExpiry);
      if (typeof doc.userPass[5].dateCreate !== 'undefined')  
        doc.userPass[5].dateCreate = new Date(doc.userPass[5].dateCreate);
      if (typeof doc.userPass[5].dateExpiry !== 'undefined')  
        doc.userPass[5].dateExpiry = new Date(doc.userPass[5].dateExpiry);
*/
      doc.timeDetail = { h8: [], h9: [], h10: [], h11: [], h12: [], h13: [], h14: [], h15: [], 
                         h16: [], h17: [], h18: [], h19: [] };
      doc.flag = action;
      delete doc.deployStatus;
    }
    dbx.collection(collection).update(query, {"$set": doc}, { upsert: true }, function (err, upd)  {
      callback(0);
    });
  });
  q.drain = function() {
    console.log('Update end / number of record to update ->', data.length);
    callback(0);
  }
  q.push(data, function (err) {
  });
}
module.exports.jsonWrite = jsonWrite;

/* Update JSON file */
function jsonUpdate (dbx, filename, callback)  {
  var fs = require('fs');
  // console.log(filename);
  fs.readFile('updateconfig/'+filename, 'utf8', function(err, data) {
    if (err)  {
      console.log('Read json file error ->', err);
      callback(0);
      return;
    }
    try {
      JSON.parse(data);
    } catch (e) {
      console.log('This is not a sjon format ->');
      callback(0);
      return;
    }

    jsonWrite (dbx, data, function (err)  {
      callback(0);
    });
/*
    var data = JSON.parse(data);
    var async = require('async');  
    var q = async.queue(function (item, callback) {      
      var collection = item.collection;
      var query = item.query;
      var action = item.action;
      var doc = item.data;
      console.log('JSON update flag ->',collection, query, action);
      // console.log('Document to update ->', doc);
      // for userList configs
      if (collection == 'userList')  {
        if (doc.createDate != '') doc.createDate = new Date(doc.createDate);
        if (doc.startDate != '')  doc.startDate = new Date(doc.startDate);
        if (doc.expireDate != '')  doc.expireDate = new Date(doc.expireDate);
        if (doc.activeDate != '')  doc.activeDate = new Date(doc.activeDate);
        if (doc.lastLogon[0] != '')   doc.lastLogon[0] = new Date(doc.lastLogon[0]);
        if (doc.lastLogon[1] != '')   doc.lastLogon[1] = new Date(doc.lastLogon[1]);
        if (doc.disableStart != '')  doc.disableStart = new Date(doc.disableStart);
        if (doc.disableExpire != '')  doc.disableExpire = new Date(doc.disableExpire);
        doc.userPass[0].dateCreate = new Date(doc.userPass[0].dateCreate);
        doc.userPass[0].dateExpiry = new Date(doc.userPass[0].dateExpiry);
        doc.userPass[1].dateCreate = new Date(doc.userPass[1].dateCreate);
        doc.userPass[1].dateExpiry = new Date(doc.userPass[1].dateExpiry);
        doc.userPass[2].dateCreate = new Date(doc.userPass[2].dateCreate);
        doc.userPass[2].dateExpiry = new Date(doc.userPass[2].dateExpiry);
        doc.userPass[3].dateCreate = new Date(doc.userPass[3].dateCreate);
        doc.userPass[3].dateExpiry = new Date(doc.userPass[3].dateExpiry);
        doc.userPass[4].dateCreate = new Date(doc.userPass[4].dateCreate);
        doc.userPass[4].dateExpiry = new Date(doc.userPass[4].dateExpiry);
        doc.userPass[5].dateCreate = new Date(doc.userPass[5].dateCreate);
        doc.userPass[5].dateExpiry = new Date(doc.userPass[5].dateExpiry);
        doc.timeDetail = { h8: [], h9: [], h10: [], h11: [], h12: [], h13: [], h14: [], h15: [], 
                  h16: [], h17: [], h18: [], h19: [] };
        doc.flag = action;
        delete doc.deployStatus;
      }
      dbx.collection(collection).update(query, {"$set": doc}, { upsert: true }, function (err, upd)  {
        callback(0);
      });
    });
    q.drain = function() {
      console.log('Update end / number of record to update ->', data.length);
      callback(0);
    }
    q.push(data, function (err) {
    });
*/

  });
}

/* Update JSON file 
function jsonUpdate (dbx, filename, callback)  {
  var fs = require('fs');
  // console.log(filename);
  fs.readFile('updateconfig/'+filename, 'utf8', function(err, data) {
    if (err)  {
      console.log('Read json file error ->', err);
      callback(0);
      return;
    }
    try {
      JSON.parse(data);
    } catch (e) {
      console.log('This is not a sjon format ->');
      callback(0);
      return;
    }
    var data = JSON.parse(data);
    var async = require('async');  
    var q = async.queue(function (item, callback) {      
      var collection = item.collection;
      var query = item.query;
      var action = item.action;
      var doc = item.data;
      console.log('JSON update flag ->',collection, query, action);
      // console.log('Document to update ->', doc);
      // for userList configs
      if (collection == 'userList')  {
        if (doc.createDate != '') doc.createDate = new Date(doc.createDate);
        if (doc.startDate != '')  doc.startDate = new Date(doc.startDate);
        if (doc.expireDate != '')  doc.expireDate = new Date(doc.expireDate);
        if (doc.activeDate != '')  doc.activeDate = new Date(doc.activeDate);
        if (doc.lastLogon[0] != '')   doc.lastLogon[0] = new Date(doc.lastLogon[0]);
        if (doc.lastLogon[1] != '')   doc.lastLogon[1] = new Date(doc.lastLogon[1]);
        if (doc.disableStart != '')  doc.disableStart = new Date(doc.disableStart);
        if (doc.disableExpire != '')  doc.disableExpire = new Date(doc.disableExpire);
        doc.userPass[0].dateCreate = new Date(doc.userPass[0].dateCreate);
        doc.userPass[0].dateExpiry = new Date(doc.userPass[0].dateExpiry);
        doc.userPass[1].dateCreate = new Date(doc.userPass[1].dateCreate);
        doc.userPass[1].dateExpiry = new Date(doc.userPass[1].dateExpiry);
        doc.userPass[2].dateCreate = new Date(doc.userPass[2].dateCreate);
        doc.userPass[2].dateExpiry = new Date(doc.userPass[2].dateExpiry);
        doc.userPass[3].dateCreate = new Date(doc.userPass[3].dateCreate);
        doc.userPass[3].dateExpiry = new Date(doc.userPass[3].dateExpiry);
        doc.userPass[4].dateCreate = new Date(doc.userPass[4].dateCreate);
        doc.userPass[4].dateExpiry = new Date(doc.userPass[4].dateExpiry);
        doc.userPass[5].dateCreate = new Date(doc.userPass[5].dateCreate);
        doc.userPass[5].dateExpiry = new Date(doc.userPass[5].dateExpiry);
        doc.timeDetail = { h8: [], h9: [], h10: [], h11: [], h12: [], h13: [], h14: [], h15: [], 
                  h16: [], h17: [], h18: [], h19: [] };
        doc.flag = action;
        delete doc.deployStatus;
      }
      dbx.collection(collection).update(query, {"$set": doc}, { upsert: true }, function (err, upd)  {
        callback(0);
      });
    });
    q.drain = function() {
      console.log('Update end / number of record to update ->', data.length);
      callback(0);
    }
    q.push(data, function (err) {
    });
  });
}
*/

/* Update system file to database */
function systemUpdate (dbx, flg, conf, itemAry, sndAry, callback)  {
  //var fileUpdate = conf.fileUpdate;
  var cbFlg = 0;
  if (!conf.fileUpdate.length)  {
    callback(0);
    return;
  }
  var async = require('async');  
  var q = async.queue(function (item, callback) {
    if (item.updated != flg)  {
      if (flg == 'now')  callback(0);
    } 
    console.log('Series update for ->', item.filename, item.deploytype);
    // Script update
    if (item.deploytype == 'script')  {
      if (item.updated != 'done')  {
        item.updated = 'done';
        dbFindUpdate (dbx, 'configs', {_id: conf._id}, {fileUpdate: conf.fileUpdate}, function (err, cnf) {
          dbDrop (dbx, 'Qtoday', function (err)  {            
            // resetQ (dbx, 'clear', function (err)  {    // clearCounter, noClear
            var flgClear = item.deployval.split('|');
            resetQ (dbx, flgClear[1], function (err)  {
              scriptUpdate(dbx, item.filename, conf, function(err)  {
                callback(0);
              });
            });  
          });
        });  
      }
      else callback(0);
    }
    // Json update
    if (item.deploytype == 'json')  {
      if (item.updated != 'done')  {
        item.updated = 'done';
        dbFindUpdate (dbx, 'configs', {_id: conf._id}, {fileUpdate: conf.fileUpdate}, function (err, cnf) {
          jsonUpdate(dbx, item.filename, function(err)  {
            callback(0);
          });
        });  
      }
      else callback(0);
    }
    // zip file update
    if (item.deploytype == 'zip')  {
      if (item.updated != 'done')  {
        item.updated = 'done';
        dbFindUpdate (dbx, 'configs', {_id: conf._id}, {fileUpdate: conf.fileUpdate}, function (err, cnf) {
          unzipUpdate(dbx, item.filename, item.deploykind, item.deployval, conf, itemAry, sndAry, function(err)  {
            if (err != 0)  cbFlg = err;
            callback(0); 
          });
        });  
      }
      else callback(0);
    }
    // Image type upadte
    if (item.deploytype == 'image')  {
      if (item.updated != 'done')  {
          item.updated = 'done';
          dbFindUpdate (dbx, 'configs', {_id: conf._id}, {fileUpdate: conf.fileUpdate}, function (err, cnf) {
          var exec = require('child_process').exec;
          exec ('mv ./updateconfig/'+item.filename+' ../kioskApp/public/img/', function (err, stdout, stderr)  {
            console.log('Image update flag ->', err, stderr);
            console.log(stdout);
            callback(0); 
          });
        });  
      }
      else callback(0);
    }
  });
  q.drain = function() {
    callback(cbFlg);
  }
  q.push(conf.fileUpdate, function (err) {
  });
}
module.exports.systemUpdate = systemUpdate;

/* Copy Q-today */
function copyQtoday (dbx, dbr, ct, dt, branch, callback) { 
  dt.setHours(0,0,0,0);
  dbx.collection('Qtoday').find({ $or: [{ Qstatus: 'completed' }, { Qstatus: 'cancel' }, 
  { Qstatus: 'noservice' }], flag: '' }).limit(ct).toArray(function (err, qtd) {
    if (!qtd.length)  {  // no Q
      callback(qtd);
      return;
    }
    var async = require('async');  
    var q = async.queue(function (item, callback) {
      item.flag = 'finish';
      dbFindUpdate (dbx, 'Qtoday', {_id: item._id}, item, function (err, ret) {
        // dbr.collection('Qtoday').update({_id: ret._id}, {"$set": ret}, { upsert: true }, function (err, q)  {
          dbx.collection ('Qtoday').remove ({_id: item._id}, function (err) {
            callback(0);
          });
        // });
      });  
    });
    q.drain = function() {
      callback(qtd);
    }
    q.push(qtd, function (err) {
      // console.log('finished processing all');
    });
  }); 
}
module.exports.copyQtoday = copyQtoday;

var extTypes = { 
	"3gp"   : "video/3gpp"
	, "a"     : "application/octet-stream"
	, "ai"    : "application/postscript"
	, "aif"   : "audio/x-aiff"
	, "aiff"  : "audio/x-aiff"
	, "asc"   : "application/pgp-signature"
	, "asf"   : "video/x-ms-asf"
	, "asm"   : "text/x-asm"
	, "asx"   : "video/x-ms-asf"
	, "atom"  : "application/atom+xml"
	, "au"    : "audio/basic"
	, "avi"   : "video/x-msvideo"
	, "bat"   : "application/x-msdownload"
	, "bin"   : "application/octet-stream"
	, "bmp"   : "image/bmp"
	, "bz2"   : "application/x-bzip2"
	, "c"     : "text/x-c"
	, "cab"   : "application/vnd.ms-cab-compressed"
	, "cc"    : "text/x-c"
	, "chm"   : "application/vnd.ms-htmlhelp"
	, "class"   : "application/octet-stream"
	, "com"   : "application/x-msdownload"
	, "conf"  : "text/plain"
	, "cpp"   : "text/x-c"
	, "crt"   : "application/x-x509-ca-cert"
	, "css"   : "text/css"
	, "csv"   : "text/csv"
	, "cxx"   : "text/x-c"
	, "deb"   : "application/x-debian-package"
	, "der"   : "application/x-x509-ca-cert"
	, "diff"  : "text/x-diff"
	, "djv"   : "image/vnd.djvu"
	, "djvu"  : "image/vnd.djvu"
	, "dll"   : "application/x-msdownload"
	, "dmg"   : "application/octet-stream"
	, "doc"   : "application/msword"
	, "dot"   : "application/msword"
	, "dtd"   : "application/xml-dtd"
	, "dvi"   : "application/x-dvi"
	, "ear"   : "application/java-archive"
	, "eml"   : "message/rfc822"
	, "eps"   : "application/postscript"
	, "exe"   : "application/x-msdownload"
	, "f"     : "text/x-fortran"
	, "f77"   : "text/x-fortran"
	, "f90"   : "text/x-fortran"
	, "flv"   : "video/x-flv"
	, "for"   : "text/x-fortran"
	, "gem"   : "application/octet-stream"
	, "gemspec" : "text/x-script.ruby"
	, "gif"   : "image/gif"
	, "gz"    : "application/x-gzip"
	, "h"     : "text/x-c"
	, "hh"    : "text/x-c"
	, "htm"   : "text/html"
	, "html"  : "text/html"
	, "ico"   : "image/vnd.microsoft.icon"
	, "ics"   : "text/calendar"
	, "ifb"   : "text/calendar"
	, "iso"   : "application/octet-stream"
	, "jar"   : "application/java-archive"
	, "java"  : "text/x-java-source"
	, "jnlp"  : "application/x-java-jnlp-file"
	, "jpeg"  : "image/jpeg"
	, "jpg"   : "image/jpeg"
	, "js"    : "application/javascript"
	, "json"  : "application/json"
	, "log"   : "text/plain"
	, "m3u"   : "audio/x-mpegurl"
	, "m4v"   : "video/mp4"
	, "man"   : "text/troff"
	, "mathml"  : "application/mathml+xml"
	, "mbox"  : "application/mbox"
	, "mdoc"  : "text/troff"
	, "me"    : "text/troff"
	, "mid"   : "audio/midi"
	, "midi"  : "audio/midi"
	, "mime"  : "message/rfc822"
	, "mml"   : "application/mathml+xml"
	, "mng"   : "video/x-mng"
	, "mov"   : "video/quicktime"
	, "mp3"   : "audio/mpeg"
	, "mp4"   : "video/mp4"
	, "mp4v"  : "video/mp4"
	, "mpeg"  : "video/mpeg"
	, "mpg"   : "video/mpeg"
	, "ms"    : "text/troff"
	, "msi"   : "application/x-msdownload"
	, "odp"   : "application/vnd.oasis.opendocument.presentation"
	, "ods"   : "application/vnd.oasis.opendocument.spreadsheet"
	, "odt"   : "application/vnd.oasis.opendocument.text"
	, "ogg"   : "application/ogg"
	, "p"     : "text/x-pascal"
	, "pas"   : "text/x-pascal"
	, "pbm"   : "image/x-portable-bitmap"
	, "pdf"   : "application/pdf"
	, "pem"   : "application/x-x509-ca-cert"
	, "pgm"   : "image/x-portable-graymap"
	, "pgp"   : "application/pgp-encrypted"
	, "pkg"   : "application/octet-stream"
	, "pl"    : "text/x-script.perl"
	, "pm"    : "text/x-script.perl-module"
	, "png"   : "image/png"
	, "pnm"   : "image/x-portable-anymap"
	, "ppm"   : "image/x-portable-pixmap"
	, "pps"   : "application/vnd.ms-powerpoint"
	, "ppt"   : "application/vnd.ms-powerpoint"
	, "ps"    : "application/postscript"
	, "psd"   : "image/vnd.adobe.photoshop"
	, "py"    : "text/x-script.python"
	, "qt"    : "video/quicktime"
	, "ra"    : "audio/x-pn-realaudio"
	, "rake"  : "text/x-script.ruby"
	, "ram"   : "audio/x-pn-realaudio"
	, "rar"   : "application/x-rar-compressed"
	, "rb"    : "text/x-script.ruby"
	, "rdf"   : "application/rdf+xml"
	, "roff"  : "text/troff"
	, "rpm"   : "application/x-redhat-package-manager"
	, "rss"   : "application/rss+xml"
	, "rtf"   : "application/rtf"
	, "ru"    : "text/x-script.ruby"
	, "s"     : "text/x-asm"
	, "sgm"   : "text/sgml"
	, "sgml"  : "text/sgml"
	, "sh"    : "application/x-sh"
	, "sig"   : "application/pgp-signature"
	, "snd"   : "audio/basic"
	, "so"    : "application/octet-stream"
	, "svg"   : "image/svg+xml"
	, "svgz"  : "image/svg+xml"
	, "swf"   : "application/x-shockwave-flash"
	, "t"     : "text/troff"
	, "tar"   : "application/x-tar"
	, "tbz"   : "application/x-bzip-compressed-tar"
	, "tcl"   : "application/x-tcl"
	, "tex"   : "application/x-tex"
	, "texi"  : "application/x-texinfo"
	, "texinfo" : "application/x-texinfo"
	, "text"  : "text/plain"
	, "tif"   : "image/tiff"
	, "tiff"  : "image/tiff"
	, "torrent" : "application/x-bittorrent"
	, "tr"    : "text/troff"
	, "txt"   : "text/plain"
	, "vcf"   : "text/x-vcard"
	, "vcs"   : "text/x-vcalendar"
	, "vrml"  : "model/vrml"
	, "war"   : "application/java-archive"
	, "wav"   : "audio/x-wav"
	, "wma"   : "audio/x-ms-wma"
	, "wmv"   : "video/x-ms-wmv"
	, "wmx"   : "video/x-ms-wmx"
	, "wrl"   : "model/vrml"
	, "wsdl"  : "application/wsdl+xml"
	, "xbm"   : "image/x-xbitmap"
	, "xhtml"   : "application/xhtml+xml"
	, "xls"   : "application/vnd.ms-excel"
	, "xml"   : "application/xml"
	, "xpm"   : "image/x-xpixmap"
	, "xsl"   : "application/xml"
	, "xslt"  : "application/xslt+xml"
	, "yaml"  : "text/yaml"
	, "yml"   : "text/yaml"
	, "zip"   : "application/zip"
}

function getExt (path) {
  var i = path.lastIndexOf('.');
  return (i < 0) ? '' : path.substr(i+1);
}
module.exports.getExt = getExt;

function getContentType (ext) {
//  return extTypes[ext.toLowerCase()]; 'application/octet-stream';
  return extTypes[ext]; 
}
module.exports.getContentType = getContentType;

