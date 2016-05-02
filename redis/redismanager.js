var redis = require('redis');
var nr = require('node-resque');
var url = require('url');

var jobs = require('./redisjobs.js');
var queue;

var methods = {}

methods.initialize = function() {
	var rtg = url.parse('redis://redistogo:531559269bc101e6d65b2738e8ff5045@lab.redistogo.com:10291/');
	var redisClient = redis.createClient(rtg.port, rtg.hostname);
	redisClient.auth(rtg.auth.split(":")[1]);
	var resqueConnectionDetails = {redis: redisClient};

	var scheduler = new nr.scheduler({connection: resqueConnectionDetails});
	scheduler.connect(function() {
		scheduler.start();
	});

	var multiWorker = new nr.multiWorker({
	  connection: resqueConnectionDetails,
	  minTaskProcessors:   1,
	  maxTaskProcessors:   100,
	  checkTimeout:        1000,
	  maxEventLoopDelay:   10,  
	  toDisconnectProcessors: true,
	}, jobs);

	multiWorker.start();


	/////////////////////////
	// REGISTER FOR EVENTS //
	/////////////////////////

	// normal worker emitters
	multiWorker.on('start',             function(workerId){                      console.log("worker["+workerId+"] started"); })
	multiWorker.on('end',               function(workerId){                      console.log("worker["+workerId+"] ended"); })
	multiWorker.on('cleaning_worker',   function(workerId, worker, pid){         console.log("cleaning old worker " + worker); })
	multiWorker.on('poll',              function(workerId, queue){               console.log("worker["+workerId+"] polling " + queue); })
	multiWorker.on('job',               function(workerId, queue, job){          console.log("worker["+workerId+"] working job " + queue + " " + JSON.stringify(job)); })
	multiWorker.on('reEnqueue',         function(workerId, queue, job, plugin){  console.log("worker["+workerId+"] reEnqueue job (" + plugin + ") " + queue + " " + JSON.stringify(job)); })
	multiWorker.on('success',           function(workerId, queue, job, result){  console.log("worker["+workerId+"] job success " + queue + " " + JSON.stringify(job) + " >> " + result); })
	multiWorker.on('failure',           function(workerId, queue, job, failure){ console.log("worker["+workerId+"] job failure " + queue + " " + JSON.stringify(job) + " >> " + failure); })
	multiWorker.on('error',             function(workerId, queue, job, error){   console.log("worker["+workerId+"] error " + queue + " " + JSON.stringify(job) + " >> " + error); })
	multiWorker.on('pause',             function(workerId){                      console.log("worker["+workerId+"] paused"); })

	// multiWorker emitters
	multiWorker.on('internalError',     function(error){                         console.log(error); })
	multiWorker.on('multiWorkerAction', function(verb, delay){                   console.log("*** checked for worker status: " + verb + " (event loop delay: " + delay + "ms)"); });

	scheduler.on('start',             function(){ console.log("scheduler started"); });
	scheduler.on('end',               function(){ console.log("scheduler ended"); });
	scheduler.on('poll',              function(){ console.log("scheduler polling"); });
	scheduler.on('master',            function(state){ console.log("scheduler became master"); });
	scheduler.on('error',             function(error){ console.log("scheduler error >> " + error); });
	scheduler.on('working_timestamp', function(timestamp){ console.log("scheduler working timestamp " + timestamp); });
	scheduler.on('transferred_job',   function(timestamp, job){ console.log("scheduler enquing job " + timestamp + " >> " + JSON.stringify(job)); });

}

module.exports = methods;