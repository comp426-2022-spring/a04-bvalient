const { exit } = require('process')
const morgan = require('morgan')
const fs = require('fs')
const express = require('express')
const app = express()

const args = require('minimist')(process.argv.slice(2))

console.log(args)
args['port', 'help', 'debug', 'log'];

const help = (`
    server.js [options]

    --port	Set the port number for the server to listen on. Must be an integer
            between 1 and 65535.

    --debug	If set to true, creates endlpoints /app/log/access/ which returns
            a JSON access log from the database and /app/error which throws 
            an error with the message "Error test successful." Defaults to 
            false.
    
    --log	If set to false, no log files are written. Defaults to true.
            Logs are always written to database.

    --help	Return this message and exit.
    `)

    if (args.help || args.h) {
        console.log(help)
        process.exit(0)
    }

const port = args.port || 5000

const server = app.listen(port, () =>{
    console.log('App is running on port %PORT%'.replace('%PORT%', port))
});



app.get('/app/', (req, res)=>{
    res.statusCode = 200;
    res.statusMessage = "OK"
    res.writeHead(res.statusCode, {'Content-Type' : 'text/plain'});
    res.end(res.statusCode+ ' ' +res.statusMessage)
});

app.use((req, res, next) => {
    let logData = {
        remoteaddr: req.ip,
        remoteuser: req.user,
        time: Date.now(),
        method: req.method,
        url: req.url,
        protocol: req.protocol,
        httpversion: req.httpVersion,
        status: res.statusCode,
        referer: req.headers['referer'],
        useragent: req.headers['user-agent']
    }
    const stmt = db.prepare('INSERT INTO accesslog (remoteaddr, remoteuser, time, method, url, protocol, httpversion, status, referer, useragent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    stmt.run(logData.remoteaddr, logData.remoteuser, logData.time, logData.method, logData.url, logData.protocol, logData.httpversion, logData.status, logData.referer, logData.useragent);
    next();
}) 

if (args.debug) {
    app.get("/app/log/access", (req, res) => {
        try{
            const logData = db.prepare('SELECT * FROM accesslog').all();
            res.status(200).json(logData);
        } catch(e){
            console.error(e);
        }
    })

    app.get("/app/error", (req, res) => {
        throw new Error('Error Test Successful');
    });
}


app.use(function(req, res){
    res.status(404).send("404 NOT fOUND")
    res.type("text/plain")
});