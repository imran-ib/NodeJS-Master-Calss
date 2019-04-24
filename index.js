const http = require("http");
const url = require("url");
const { StringDecoder } = require("string_decoder");
const config = require("./config");

const server = http.createServer((req, res) => {
  // Get The url from req and parse it
  const parsedUrl = url.parse(req.url, true);
  // get the path
  const path = parsedUrl.pathname;
  const trimmedPath = path.replace(/^\/+|\/+$/g, "");

  // Get Query String
  const queryStringObject = parsedUrl.query;

  // Get The HTTP Method
  const method = req.method.toLowerCase();
  // Get The Headers
  const headers = req.headers;
  // Get the payload if any
  const decoder = new StringDecoder("utf8");
  let buffer = "";
  req.on("data", data => {
    buffer += decoder.write(data);
  });
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
});

server.listen(config.port, () => {
  console.log(`Server is running on port ${config.port} now`);
});

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
