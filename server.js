const express = require('express')
const app = express()


const args = require('minimist')(process.argv.slice(2)){

}
args["port"]

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



app.use(function(req, res){
    res.status(404).send("404 NOT fOUND")
    res.type("text/plain")
});