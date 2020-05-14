var http = require('http');

const jq = require('node-jq');
const port = process.env.PORT || 3000;

//create a server object:
http.createServer((req, res) => {
    jq.run('.foo', '{ "foo": "bar" }', { input: 'string' }).then((value)=> {
        res.write(value); //write a response to the client
        res.end(); //end the response
    }).catch((error) => {
        res.write(error.message); //write a response to the client
        res.end(); //end the response
    })
}).listen(port); //the server object listens on port 8080
