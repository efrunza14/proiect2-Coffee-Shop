
const cookieParser=require('cookie-parser');
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const bodyParser = require('body-parser')

const app = express();
app.use(cookieParser());

const port = 6789;
const fs= require('fs');

//app.get('/index' , (req,res) => res.render('index'));

// directorul 'views' va conține fișierele .ejs (html + js executat la server)
app.set('view engine', 'ejs');
// suport pentru layout-uri - implicit fișierul care reprezintă template-ul site-ului este views/layout.ejs
app.use(expressLayouts);
// directorul 'public' va conține toate resursele accesibile direct de către client (e.g., fișiere css, javascript, imagini)
app.use(express.static('public'))
// corpul mesajului poate fi interpretat ca json; datele de la formular se găsesc în format json în req.body
app.use(bodyParser.json());
// utilizarea unui algoritm de deep parsing care suportă obiecte în obiecte
app.use(bodyParser.urlencoded({ extended: true }));
// la accesarea din browser adresei http://localhost:6789/ se va returna textul 'HelloWorld'
// proprietățile obiectului Request - req - https://expressjs.com/en/api.html#req
// proprietățile obiectului Response - res - https://expressjs.com/en/api.html#res
app.get('/', (req, res) => res.send('Hello World'));
// la accesarea din browser adresei http://localhost:6789/chestionar se va apela funcția specificată




//---------------------------------INDEX--------------------------------------------
app.get('/index', (req,res)=>{
    const sqlite3 = require('sqlite3').verbose();//baza de date
    const { utilizator } =req.cookies;
    // open database connection
    let db = new sqlite3.Database('cumparaturi.db', (err) => {
        if (err) {
          return console.error(err.message);
        }
        console.log('Connected to the SQLite database.');
    
        // retrieve all objects from the 'produse' table
        db.all('SELECT * FROM produse', (err, rows) => {
          if (err) {
            return console.error(err.message);
          }
    
          // render the 'index.ejs' template with the retrieved objects
          res.render('index',{aux:`${utilizator}`, objects: rows });
    
          // close the database connection
          db.close((err) => {
            if (err) {
              return console.error(err.message);
            }
            console.log('Closed the database connection.');
          });
        });
      });
});

//parsare json
let rawIntrebari=fs.readFileSync('intrebari.json');
const listaIntrebari=JSON.parse(rawIntrebari)["intrebari"];

//------------------------GET CHESTIONAR + POST REZULTAT CHESTIONAR---------------------

app.get('/chestionar', (req, res) => {
 // în fișierul views/chestionar.ejs este accesibilă variabila 'intrebari' care conține vectorul de întrebări
 res.render('chestionar', {intrebari: listaIntrebari});
});

app.post('/rezultat-chestionar', (req, res) => {
    const fs = require("fs");
    var jsonData = fs.readFileSync("intrebari.json", "utf-8");
    obj = JSON.parse(jsonData);
	let nrRaspCorecte=0;
	for (let i = 0; i < obj.intrebari.length; i++) {
        const intrebare = obj.intrebari[i];

        if(intrebare.variante[req.body[`raspuns-${i}`]] === intrebare.variante[intrebare.corect]){
            nrRaspCorecte++;
        }
    }
    console.log(nrRaspCorecte);
	res.render('rezultat-chestionar',{number:nrRaspCorecte})
});



//-----------------------GET AUTENTIFICARE + POST VERIFICARE AUTENTIFICARE----------------------------------------------


app.get('/autentificare', (req, res) => {
    res.clearCookie('mesajEroare')
    const { mesajEroare } =req.cookies;
    res.render('autentificare', {aux:`${mesajEroare}`});
    });

app.post('/verificare-autentificare', (req, res) => {

   const fs = require("fs");
   var jsonData = fs.readFileSync("utilizatori.json", "utf-8");
   obj = JSON.parse(jsonData);
   const user = obj.users[0];
   let aux = 0;
   if(req.body[`nume`] === user.utilizator && req.body[`parola`] === user.parola){
       aux=1
   }

   console.log(req.body);  
   console.log(aux);

   if(aux==0){
       res.cookie('mesajEroare', 'Error');
       res.redirect('autentificare');
   }
   else{
       res.cookie('utilizator', user.utilizator);
       res.redirect('index');
   }

   //res.render('verificare-autentificare', {aux: aux });//bun
   
   });
app.listen(port, () => console.log(`Serverul rulează la adresa http://localhost:`));




//-----------------------------------------GET and POST BAZA DE DATE---------------------------------
app.get('/creare-bd', (req, res) => {
    const sqlite3 = require('sqlite3').verbose();
  
    // open database connection
    let db = new sqlite3.Database('cumparaturi.db', (err) => {
      if (err) {
        return console.error(err.message);
      }
      console.log('Connected to the SQLite database.');
  
      // create the 'produse' table
      db.run(`
        CREATE TABLE IF NOT EXISTS produse (
          id INTEGER PRIMARY KEY,
          nume TEXT,
          pret REAL
        )
      `, (err) => {
        if (err) {
          return console.error(err.message);
        }
        console.log('Table "produse" created.');
  
        // close the database connection
        db.close((err) => {
          if (err) {
            return console.error(err.message);
          }
          console.log('Closed the database connection.');
        });
      });
    });
  
    const { utilizator } = req.cookies;
    res.redirect('/index');
  });
      
  app.get('/inserare-bd', (req, res) => {
  
    const sqlite3 = require('sqlite3').verbose();
  
    // open database connection
    let db = new sqlite3.Database('cumparaturi.db', (err) => {
      if (err) {
        return console.error(err.message);
      }
      console.log('Connected to the SQLite database.');
  
      // create an array of objects to insert
      const objectsToInsert = [
        { nume: 'Cafea Arabica', pret: 30 },
        { nume: 'Cafea Robusta', pret: 35 },
        { nume: 'Cafea Boabe', pret: 50 },
        { nume: 'Ceai Macinata', pret: 25 },
        { nume: 'Ceai Verde', pret: 15 },
        { nume: 'Ceai Negru', pret: 20 }
      ];
  
      // insert objects into the 'produse' table
      objectsToInsert.forEach((obj) => {
        db.run(
          'INSERT INTO produse (nume, pret) VALUES (?, ?)',
          [obj.nume, obj.pret],
          function (err) {
            if (err) {
              return console.error(err.message);
            }
            console.log(`Inserted object with ID ${this.lastID}`);
          }
        );
      });
  
      // close the database connection
      db.close((err) => {
        if (err) {
          return console.error(err.message);
        }
        console.log('Closed the database connection.');
      });
    });
  
    const { utilizator } = req.cookies;
    res.redirect('/index');
  });
  
  
  // Declare a global array to store the saved IDs
  let savedObjectIDs = [];
  
  app.post('/adauga-cos', (req, res) => {
    const { id } = req.body;
  
    // Add the ID to the global array
    savedObjectIDs.push(id);
    console.log(savedObjectIDs);
    // Redirect back to the index page
    res.redirect('/index');
  });

//--------------------------------VIZUALIZARE COS-------------------------------------
app.get('/vizualizare-cos', (req, res) => {
    const sqlite3 = require('sqlite3').verbose();
  
    // open database connection
    let db = new sqlite3.Database('cumparaturi.db', (err) => {
      if (err) {
        return console.error(err.message);
      }
      console.log('Connected to the SQLite database.');
  
      // retrieve the saved objects from the 'produse' table based on the IDs in the global array
      const query = `SELECT * FROM produse WHERE id IN (${savedObjectIDs.join(',')})`;
      db.all(query, (err, rows) => {
        if (err) {
          return console.error(err.message);
        }
  
        // render the 'view.ejs' template with the retrieved objects
        res.render('vizualizare-cos', { objects: rows });
  
        // close the database connection
        db.close((err) => {
          if (err) {
            return console.error(err.message);
          }
          console.log('Closed the database connection.');
        });
      });
    });
  });