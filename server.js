import express from 'express';
import db from './database.js'
import morgan from 'morgan';
import fs from 'fs'
import minimist from 'minimist';

const args = minimist(process.argv.slice(2));

args['port', 'help', 'debug', 'log'];

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


let app = express()

// server
const port = args.port || process.env.port || 5000

// Make Express use its own built-in body parser for both urlencoded and JSON body data.
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// starts server
const server = app.listen(port, () => {
    console.log('App listening on port %PORT%'.replace('%PORT%',port))
});


if (args.log == true) {
    const WRITESTREAM = fs.createWriteStream('access.log', { flags: 'a' });
    // set up middleware
    app.use(morgan('combined', { stream: WRITESTREAM }));
}

//middleware
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
    const info = stmt.run(logData.remoteaddr, logData.remoteuser, logData.time, logData.method, logData.url, logData.protocol, logData.httpversion, logData.status, logData.referer, logData.useragent);
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

app.get('/app/', (req, res) => {
        res.statusCode = 200;
        res.statusMessage = 'OK';
        res.writeHead( res.statusCode, { 'Content-Type' : 'text/plain' });
        res.end(res.statusCode+ ' ' +res.statusMessage)
    });

app.use(function(req, res){
    res.status(404).send('404 NOT FOUND')
});