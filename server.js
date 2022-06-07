const express = require("express");
const cors = require('cors');
const app = express();
require("dotenv").config();
require("./config/database").connect();

app.use(cors());
app.use(express.json());

const streamingHandler = require("./streamingHandler");

const UserEvent = require("./models/userLiveEvent");
const Stream = require("./models/stream");

app.post("/", async (req, res) => {
    let title = req.body.title;
    let user_id = JSON.parse(req.headers["user"]).user_id;
    let userEvent = await UserEvent.findOne({ user_id: user_id });
    console.log(userEvent)
    if (!userEvent) {
        console.log("stuff")

        await UserEvent.create({
            name: user_id,
            user_id: user_id
        })
        
        userEvent = {
            name: user_id,
            user_id: user_id
        }
    }
    let assetName = await streamingHandler.createLiveEvent(user_id);
    let ingestUrl = await streamingHandler.startLiveEvent(userEvent.name);
    let endpoint = await streamingHandler.createStreamingEndpoint(assetName, "output");
    await Stream.create({
        title: title,
        user_id: user_id,
        endpoint: endpoint,
        //game_id: "game",
        is_live: true
    })
    res.status(200).send({
        ingestUrl: ingestUrl,
        endpoint: endpoint
    });
})

app.delete("/", async (req, res) => {
    let user_id = JSON.parse(req.headers["user"]).user_id;
    await streamingHandler.stopStream(user_id/*, "liveOutput-random-id"*/);
    await Stream.findOneAndUpdate({user_id:user_id},{is_live:false});
    res.send("check the console!!");
});

app.get("/", async (req, res) => {
    let streams = await Stream.find();
    res.status(200).send(streams);
})

port = process.env.PORT || 4006;

app.listen(port, () => {
    console.log("server listening on port " + port);
})