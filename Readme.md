# NodeJS Modules

## 1. HHTP

To use the HTTP server and client one must `require('http')`. http has a method on it called `createServer` which takes a call back function. We can send response in call back function with `res.end('hello world')`

Save the createServer to a variable

```javascript
const http = require("http");

const server = http.createServer((req, res) => {
  res.end("hello world");
});

server.listen(3000, () => {
  console.log("Server is running on port 3000 now");
});
```

**To test this open terminal and run `node index.js`**

**open another terminal and run `curl localhost:3000`**that should give you the response hello world.

## URL (Parsing Requests Paths)

Next thing we need to do is to figure out what resources people are asking when they send the request to the API.

In order to do that we need to parse the url they are asking for.

Node's `url` module provides utilities for URL resolution and parsing

- we can get url from `req` object (req.url)
  - url.parse will take two args , url and a Boolean (weather it should parse the query string or not)
- Parsed url has a method on it called `pathname` that is untrimmed path that user requests
- We can trim path with regex

```javascript
const http = require("http");
const url = require("url");

const server = http.createServer((req, res) => {
  // Get The url from req and parse it
  const parsedUrl = url.parse(req.url, true);
  // get the path
  const path = parsedUrl.pathname;
  var trimmedPath = path.replace(/^\/+|\/+$/g, "");

  res.end("hello world");
  //Test it
  console.log("Request is recieved on " + trimmedPath);
});

server.listen(3000, () => {
  console.log("Server is running on port 3000 now");
});
```

## Parsing HTTP Methods

Now its time to figure out which http method user is requesting.

we can get from `req.method`

```javascript
// Get The HTTP Method
  const method = req.method.toLowerCase();
  console.log(
    "Request is recieved on " + trimmedPath + " With Method: " + method
  );
});
```

## Parsing Query String

**Remember that we used the Boolean true when we parsed url **

Now we can get query string object from that parsed URL

```javascript
  const method = req.method.toLowerCase();
    // Get Query String
  const queryStringObject = parsedUrl.query;

console.log(
    "Request is recieved on " +
      trimmedPath +
      " With Method: " +
      method +
      " query : ",
    queryStringObject
  );
});
```

## Parsing The Headers

Now its time to parse any headers if user has sent

the req object has headers with it so

```javascript
// Get The Headers
const headers = req.headers;
console.log("Headers ", headers);
```

To be able to send headers with request you must use postman instead of curl

## Parsing Payload String Decoder

The `string_decoder` module provides an API for decoding `Buffer` objects into strings in a manner that preserves encoded multi-byte UTF-8 and UTF-16 characters. It can be accessed using:

- First step is to create new string decoder and tell it what kind of charset/ encoding it can expect
- NodeJS data comes in stream meaning little bit at a time. Play load comes in stream.
- We need to collect that data in little pieces and when stream will tell us it is end we will merge that data into one payload.
- So Create a empty buffer and add data to it as it comes

```javascript
const { StringDecoder } = require("string_decoder");

const decoder = new StringDecoder("utf8");
let buffer = "";

req.on("data", data => {
  buffer += decoder.write(data);
});
req.on("end", () => {
  buffer += decoder.end();

  res.end("hello world");

  console.log("body ", buffer);
});
```

**This is how Streams are handled in NodeJS **

# Router

Define the Router and handlers.

```javascript
const handler = {};

handler.sample = function(data, callback) {
  callback(406, { name: "sampleHandler" });
};
handler.notFound = function(data, callback) {
  callback(404);
};

// Router

const router = {
  sample: handler.sample
};
```

in **Server** function adjust the`req.on` end stream and figure out which route should be sent to user

```javascript
req.on("end", () => {
  buffer += decoder.end();

  // Check the router for a matching path for a handler. If one is not found, use the notFound handler instead.
  var chosenHandler =
    typeof router[trimmedPath] !== "undefined"
      ? router[trimmedPath]
      : handler.notFound;

  // Construct the data object to send to the handler
  var data = {
    trimmedPath: trimmedPath,
    queryStringObject: queryStringObject,
    method: method,
    headers: headers,
    payload: buffer
  };

  // Route the request to the handler specified in the router
  chosenHandler(data, function(statusCode, payload) {
    // Use the status code returned from the handler, or set the default status code to 200
    statusCode = typeof statusCode == "number" ? statusCode : 200;

    // Use the payload returned from the handler, or set the default payload to an empty object
    payload = typeof payload == "object" ? payload : {};

    // Convert the payload to a string
    var payloadString = JSON.stringify(payload);

    // Return the response
    res.setHeader("Content-type", "application/json");
    res.writeHead(statusCode);
    res.end(payloadString);
    console.log("Returning this response: ", statusCode, payloadString);
  });
});
```

# .config

## Add https

### Add SSL Certificate

install open ssl

run command

`openssl req -newkey rsa:2048 -new -nodes -x509 -days 3650 -keyout key.pem -out cert.pem`

it will create two files in folder

Now Create a config file on root directory

```javascript
// Container for all environments
var environments = {};

// Staging (default) environment
environments.staging = {
  httpPort: 3000,
  httpsPort: 3001,
  envName: "staging"
};

// Production environment
environments.production = {
  httpPort: 5000,
  httpsPort: 5001,
  envName: "production"
};

// Determine which environment was passed as a command-line argument
var currentEnvironment =
  typeof process.env.NODE_ENV == "string"
    ? process.env.NODE_ENV.toLowerCase()
    : "";

// Check that the current environment is one of the environments above, if not default to staging
var environmentToExport =
  typeof environments[currentEnvironment] == "object"
    ? environments[currentEnvironment]
    : environments.staging;

// Export the module
module.exports = environmentToExport;
```

Now refactor our create server function so that it will run on both http and https

- Create a unified function for create server and move all the login init
- create two function one for http server and other for https server and listen on those
- https server is little bit complicated so we need to work on it
- server listen will take addition argument for option (ssl keys)

```javascript
// Instantiate the HTTP server
var httpServer = http.createServer(function(req, res) {
  unifiedServer(req, res);
});

// Start the HTTP server
httpServer.listen(config.httpPort, function() {
  console.log("The HTTP server is running on port " + config.httpPort);
});

// Instantiate the HTTPS server
var httpsServerOptions = {
  key: fs.readFileSync("./https/key.pem"),
  cert: fs.readFileSync("./https/cert.pem")
};
var httpsServer = https.createServer(httpsServerOptions, function(req, res) {
  unifiedServer(re  q, res);
});

// Start the HTTPS server
httpsServer.listen(config.httpsPort, function() {
  console.log("The HTTPS server is running on port " + config.httpsPort);
});
```

_Remember that unifiedServer contains all the code that was in server function_
