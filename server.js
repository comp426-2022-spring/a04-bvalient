const express = require('express')
const { get } = require('http')
const app = express()

const args = require('minimist')(process.argv.slice(2))
args["port"]

const port = args.port || process.env.port || 5000

const server = app.listen(port, () =>{
    console.log('App is running on port %PORT%'.replace('%PORT%', port))
});

function coinFlip() {
    if(Math.random() > .5){
      return "tails"
    } else {
      return "heads"
    }
  }

  function coinFlips(flips) {
    let returnable = [];
    for(let i = 0; i < flips; i++){
      returnable.push(coinFlip());
    } 
    return returnable;
  }

  function countFlips(array) {
    let heads = 0;
    let tails = 0;
    for(let i = 0; i < array.length; i++){
      if (array[i] == "heads"){
        heads += 1;
      } else {
        tails += 1
      }
    }
    return {'heads': heads, 'tails': tails}
  }

  function flipACoin(call) {
    let theFlip = coinFlip();
    if(theFlip == call){
      return {call: call, flip: theFlip, result: 'win'}
    } else {
      return {call: call, flip: theFlip, result: 'lose'}
    }
  }


app.get('/app/', (req, res)=>{
    res.statusCode = 200;
    res.statusMessage = "OK"
    res.writeHead(res.statusCode, {'Content-Type' : 'text/plain'});
    res.end(res.statusCode+ ' ' +res.statusMessage)
});

app.get('/app/flip/', (req, res)=>{
    res.status(200).json({'flip' : coinFlip()})
});

app.get('/app/flips/:number', (req, res) => {
    const flips = coinFlips(req.params.number)
    res.status(200).json({'raw' : flips, 'summary' : countFlips(flips)})
});

app.get('/app/flip/call/heads', (req, res) =>{
    res.status(200).send(flipACoin('heads'))
});

app.get('/app/flip/call/tails', (req, res) =>{
    res.status(200).send(flipACoin('tails'))
});

app.use(function(req, res){
    res.status(404).send("404 NOT fOUND")
    res.type("text/plain")
});