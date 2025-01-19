const express = require("express");
const path = require('path');
const app = express();
const cors = require("cors");

const gtts = require("node-gtts")("en");

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors());

app.options("/", function (req, res){
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.setHeader("Access-Control-Request-Method", "POST")
    res.setHeader("Access-Control-Request-Headers", "Content-Type, Authorization")
    res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
    res.sendStatus(200);
})

app.post("/", async function (req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.setHeader("Access-Control-Request-Method", "POST")
    res.setHeader("Access-Control-Request-Headers", "Content-Type, Authorization")
    res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
    
    if(req.body.type === "message"){
        let message = req.body.content;
        let filepath = path.join(__dirname, 'audio.wav');

        gtts.save(filepath, message, function() {
            res.sendStatus(200);
        })
    }

    if(req.body.type === "faceTracking"){
        let message = req.body.content;
        lastMessage = message;
        res.sendStatus(200);
    }
});

app.listen("3000", () => {
    console.log("Express server started!");
});

// Arduino Communication
const SerialPort = require('serialport');
const port = new SerialPort.SerialPort({ path: 'COM4', baudRate: 9600 });
port.on("open", () => {
  console.log('serial port open');
});

let lastMessage = null;
let lastMessageSent = null;

setInterval(() => {
    if(lastMessage !== null && lastMessage !== lastMessageSent){
        port.write(`${lastMessage}\n`)
        lastMessageSent = lastMessage;
    }
}, 1000)