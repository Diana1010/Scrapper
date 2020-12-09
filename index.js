/*jshint esversion: 6 */
const axios = require('axios');
const cheerio = require("cheerio");
const sqlite3 = require('sqlite3').verbose();
const bookUrls = require('./url-books.json');

var db = new sqlite3.Database('./book-db.db');
db.run('DROP TABLE IF EXISTS Books')
db.run('CREATE TABLE IF NOT EXISTS Books (genre TEXT, name TEXT, count NUMBER)')
console.log("Start");