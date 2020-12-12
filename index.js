/*jshint esversion: 6 */
const axios = require('axios');
const cheerio = require("cheerio");
const sqlite3 = require('sqlite3').verbose();
const bookUrls = require('./url-books.json');

var db = new sqlite3.Database('./book-db.db');
db.run('DROP TABLE IF EXISTS Books');
db.run('CREATE TABLE IF NOT EXISTS Books (genre TEXT, name TEXT, count NUMBER)');
console.log("Start...");

let promisesBooks = bookUrls.map(url => axios.get(url));

var rating = (result) => {
  const $ = cheerio.load(result.data);
  let url =  result.config.url.split('/');
  var name = url[url.length - 1].replace(/.*knigi_/gi, '');
  let statement = db.prepare(`INSERT INTO Books (genre, name, count) VALUES ('${name}', ?, ?)`);

  $('span.rating').each((i,r) => statement.run(`rating`, parseFloat(r.firstChild.data)));
  var ratingSpan = $('span.rating');

  var comments = 0;
  $('span.count-rating').each((i, r) => comments += parseInt(r.firstChild.data.slice(1, -1).replace('<', '')));

  return {
    commentCount: comments/ratingSpan.length/5,
    name: name
  };
};

Promise.all(promisesBooks).then(res => {
    let arrayBooks = [];
    let maxComment = 0;
    for (let i = 0; i < res.length; i++) {
        arrayBooks.push(rating(res[i]));
  
      if (arrayBooks[i].commentCount > maxComment)
      maxComment = arrayBooks[i].commentCount;
  
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
         
              console.log("Средний рейтинг по жанру :\n");
              results.rating.forEach(pos => {
                let bar = `${'#'.repeat( Math.floor(pos.avgCount))}`.padEnd(maxBar);
                let str = `${pos.genre.padEnd(maxLen + 5)}:  ${bar} ${(pos.avgCount).toFixed(2)}`;
                console.log(str);
              });

              console.log("\nСреднее количество комментариев по жанру:\n");
              arrayBooks.forEach(pos => {
                let bar = `${'#'.repeat(Math.floor(pos.commentCount))}`.padEnd(maxComment);
                let str = `${pos.name.padEnd(maxLen + 5)} ${bar} ${(pos.commentCount*4).toFixed(0)}`;
                console.log(str);
              }); 
            });
  }, 1000);
});
