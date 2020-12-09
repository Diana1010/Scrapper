/*jshint esversion: 6 */
const axios = require('axios');
const cheerio = require("cheerio");
const sqlite3 = require('sqlite3').verbose();
const bookUrls = require('./url-books.json');

var db = new sqlite3.Database('./book-db.db');
db.run('DROP TABLE IF EXISTS Books');
db.run('CREATE TABLE IF NOT EXISTS Books (genre TEXT, name TEXT, count NUMBER)');
console.log("Start");

let promisesBooks = bookUrls.map(url => axios.get(url));

var rating = (result) => {
  const $ = cheerio.load(result.data);
  let url =  result.config.url.split('/');
  let statement = db.prepare(`INSERT INTO Books (genre, name, count) VALUES ('${url[url.length - 1]
    .replace(/.*knigi_/gi, '')}', ?, ?)`);

  $('span.rating').each((i,r) => statement.run(`rating`, parseFloat(r.firstChild.data)));

  statement.finalize();
};

Promise.all(promisesBooks).then(res => {
  for (let i = 0; i < res.length; i++) {
    rating(res[i]);
  }

  setTimeout(() => {
    var results = {};

    db.each(`SELECT genre, name, avg(count) as avgCount  FROM Books GROUP BY genre, name ORDER BY name, avgCount DESC`,
    
            (_, row) => {

              if(!results[row.name]) results[row.name] = [];

              results[row.name].push({genre: row.genre, avgCount: row.avgCount});
            },
            _ => {

              let maxLen = Math.max(...results.rating.map(r => r.genre.length));
              let maxBar = Math.max(...results.rating.map(r => r.avgCount));
         
              console.log("Средний рейтинг по жанру :\n")
              results.rating.forEach(pos => {
                let bar = `${'#'.repeat( Math.floor(pos.avgCount*10))}`.padEnd(maxBar*10 + 5);
                let str = `${pos.genre.padEnd(maxLen + 5)}:  ${bar} ${(pos.avgCount*10).toFixed(2)}`;
                console.log(str);
              });

             
            });
  }, 500);
});
