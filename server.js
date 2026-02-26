// server.js
import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// ワールドとプレイヤー管理
const blocks = new Map();
const players = new Map();

app.use(express.static("public")); // public配下のindex.htmlを配信

io.on("connection", socket => {
  console.log("Player connected:", socket.id);

  // 新規プレイヤーに既存ワールド送信
  socket.emit("initWorld", Array.from(blocks.entries()));

  // 新規プレイヤー通知
  socket.broadcast.emit("playerJoined", {id: socket.id});

  // プレイヤー移動同期
  socket.on("move", data => {
    players.set(socket.id, data);
    socket.broadcast.emit("playerMove", {id: socket.id, data});
  });

  // ブロック設置／破壊同期
  socket.on("blockChange", ({x,y,z,type}) => {
    const key = `${x},${y},${z}`;
    if(type) blocks.set(key, type);
    else blocks.delete(key);
    io.emit("blockChange", {x,y,z,type});
  });

  // 切断処理
  socket.on("disconnect", () => {
    players.delete(socket.id);
    io.emit("playerLeft", {id: socket.id});
    console.log("Player disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
