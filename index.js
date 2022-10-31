const path = require("path");
const express = require("express");

const redis = require("redis");
const mcache = require("memory-cache");
const flatCache = require("flat-cache");
const Memcached = require("memcached");
const sqlite3 = require("sqlite3").verbose();
const client = redis.createClient();

const PORT = process.env.PORT || 3128;

const app = express();

// configure cache middleware
let memCache = new mcache.Cache();
let cacheMiddleware = (duration) => {
  return (req, res, next) => {
    let key = "__express__" + req.originalUrl || req.url;
    let cacheContent = memCache.get(key);
    if (cacheContent) {
      res.send(cacheContent);
      return;
    } else {
      res.sendResponse = res.send;
      res.send = (body) => {
        memCache.put(key, body, duration * 1000);
        res.sendResponse(body);
      };
      next();
    }
  };
};

let redisMiddleware = (req, res, next) => {
  let key = "__expIress__" + req.originalUrl || req.url;
  client.get(key, function (err, reply) {
    if (reply) {
      res.send(reply);
    } else {
      res.sendResponse = res.send;
      res.send = (body) => {
        client.set(key, JSON.stringify(body));
        res.sendResponse(body);
      };
      next();
    }
  });
};

// create flat cache routes
let flatCacheMiddleware = (req, res, next) => {
  let key = "__express__" + req.originalUrl || req.url;
  let cacheContent = cache.getKey(key);
  if (cacheContent) {
    res.send(cacheContent);
  } else {
    res.sendResponse = res.send;
    res.send = (body) => {
      cache.setKey(key, body);
      cache.save();
      res.sendResponse(body);
    };
    next();
  }
};

let memcached = new Memcached("127.0.0.1:11211");

let memcachedMiddleware = (duration) => {
  return (req, res, next) => {
    let key = "__express__" + req.originalUrl || req.url;
    memcached.get(key, function (err, data) {
      if (data) {
        res.send(data);
        return;
      } else {
        res.sendResponse = res.send;
        res.send = (body) => {
          memcached.set(key, body, duration * 60, function (err) {
            //
          });
          res.sendResponse(body);
        };
        next();
      }
    });
  };
};

//load new cache
let cache = flatCache.load("productsCache");
// optionally, you can go ahead and pass the directory you want your
// cache to be loaded from by using this
// let cache = flatCache.load('productsCache', path.resolve('./path/to/folder')

const listAll = (req, res) => {
  {
    let db = new sqlite3.Database("./NodeInventory.db");
    let sql = `SELECT * FROM products`;

    db.all(sql, [], (err, rows) => {
      if (err) {
        throw err;
      }
      db.close();
      res.send(rows);
    });
  }
};

// app routes
// app.get("/products", memcachedMiddleware(20), function (req, res) {});
// app.get("/products", redisMiddleware, function (req, res) {});
// app.get("/products", cacheMiddleware(30), function (req, res) {});
app.get("/products", flatCacheMiddleware, listAll);

// Simple request
// app.get("/products", function (req, res) {
//   setTimeout(() => {
//     let db = new sqlite3.Database("./NodeInventory.db");
//     let sql = `SELECT * FROM products`;

//     db.all(sql, [], (err, rows) => {
//       if (err) {
//         throw err;
//       }
//       db.close();
//       res.send(rows);
//     });
//     // this was wrapped in a setTimeout function to intentionally simulate a slow
//     // request
//   }, 3000);
// });

app.listen(PORT, function () {
  console.log(`App running on port ${PORT}`);
});
