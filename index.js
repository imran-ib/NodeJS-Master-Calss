const http = require("http");
const url = require("url");
const { StringDecoder } = require("string_decoder");

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

    res.end("hello world");

    console.log("body ", buffer);
  });
});

server.listen(3000, () => {
  console.log("Server is running on port 3000 now");
});
