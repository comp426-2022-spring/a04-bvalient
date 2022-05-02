const { exit } = require('process')
const express = require('express')
const app = express()
const morgan = require('morgan')
const fs = require('fs')

const args = require('minimist')(process.argv.slice(2), {
    boolean: ['debug', 'log'],
    default: {
        debug: false,
        log: false,
    }
}) 

args['port', 'log', 'debug', 'help']

const help = `server.js [options]
        --port	Set the port number for the server to listen on. Must be an integer between 1 and 65535.
        --debug	If set to \`true\`, creates endpoints /app/log/access/ which returns
                    a JSON access log from the database and /app/error which throws 
                    an error with the message \"Error test successful.\" Defaults to 
                    \`false\`.
        --log		If set to false, no log files are written. Defaults to true.
                    Logs are always written to database.
        --help	Return this message and exit.`;

if(args.help||args.h){
    console.log(help);
    process.exit(0);
}

console.log(args)

const database = require('./database')

app.use(express.urlencoded({extended: true}))
app.use(express.json())

//server
const port = args.port || 5555

const server = app.listen(port, () => {
    console.log('App listening on port %PORT%'.replace('%PORT%', port))
});

app.get('/app/', (req, res) => {
        res.statusCode = 200;
        res.statusMessage = "OK";
        res.writeHead( res.statusCode, { 'Content-Type' : 'text/plain' });
        res.end(res.statusCode + ' ' + res.statusMessage);
});

//middle
app.use( (req, res, next) => {
    let logdata = {
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
    const stmt = database.prepare(`INSERT INTO accesslog (remoteaddr, remoteuser, time, method, url, protocol, httpversion, status, referer, useragent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    stmt.run(logdata.remoteaddr, logdata.remoteuser, logdata.time, logdata.method, logdata.url, logdata.protocol, logdata.httpversion, logdata.status, logdata.referer, logdata.useragent)
    next();
})

if (args.debug) {
    app.get('/app/log/access', (req, res) => {
        const select = database.prepare('SELECT * FROM accesslog').all();
        res.status(200).json(select);
    })

    app.get('/app/error', (req, res) => {
        throw new Error('Error test successful.')
    })
}

if (args.log) {
    const WRITESTREAM = fs.createWriteStream('FILE', { flags: 'a' });
    app.use(morgan('FORMAT', { stream: WRITESTREAM }));
}


app.use(function(req, res) {
  res.status(404).send('404 NOT FOUND')
});

//helped from classmates