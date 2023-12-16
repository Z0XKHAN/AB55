const http = require('http');
const url = require('url');
const fs = require('fs');
const mysql2 = require('mysql2');

const db = mysql2.createConnection({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'ZAID0',
  database: 'pa_ss',
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    process.exit(1); // Exit the process if unable to connect
  }
  console.log('Connected to MySQL');
});

const createTableQuery = `
  CREATE TABLE IF NOT EXISTS password_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    password VARCHAR(255) NOT NULL,
    steps INT NOT NULL
  )
`;

db.query(createTableQuery, (err) => {
  if (err) {
    console.error('Error creating table:', err);
    process.exit(1); // Exit the process if unable to create the table
  }
  console.log('Table created or already exists');
});

const strongPasswordChecker = (password) => {
  let steps = 0;
  
  // Check the length requirement
  if (password.length < 6) {
    steps += 6 - password.length;
  } else if (password.length > 20) {
    const deletions = password.length - 20;
    steps += deletions;
    password = password.slice(0, password.length - deletions); // Trim the password to meet the length requirement
  }

  // Check for the presence of at least one lowercase letter, one uppercase letter, and one digit
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasDigit = /\d/.test(password);

  // Update steps based on missing character types
  if (!hasLowercase) steps++;
  if (!hasUppercase) steps++;
  if (!hasDigit) steps++;

  // Check for three repeating characters and update steps accordingly
  for (let i = 0; i < password.length - 2; i++) {
    if (password[i] === password[i + 1] && password[i] === password[i + 2]) {
      const insertions = Math.ceil((password.length - i - 2) / 2);
      steps += insertions;
      password = password.slice(0, i + 2) + 'x'.repeat(insertions) + password.slice(i + 2);
      i += insertions - 1;
    }
  }

  // Check for repeating characters and update steps accordingly
  let replaceSteps = 0;
  for (let i = 0; i < password.length - 1; i++) {
    if (password[i] === password[i + 1]) {
      replaceSteps++;
      i++;
    }
  }

  steps += Math.max(replaceSteps, 0);

  return steps;
};

http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');

  const q = url.parse(req.url, true);
  const filename = `.${q.pathname}`;

  if (filename === './strong-password.html') {
    fs.readFile(filename, (err, data) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        return res.end('404 Not Found');
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.write(data);
      return res.end();
    });
  } else if (filename === './password-check') {
    const password = q.query.password;

    const result = strongPasswordChecker(password);

    const insertQuery = 'INSERT INTO password_results (password, steps) VALUES (?, ?)';
    const insertValues = [password, result];

    console.log('Executing INSERT query:', insertQuery, insertValues);
    db.query(insertQuery, insertValues, (err, results) => {
      if (err) {
        console.error('Error inserting into database:', err);
       // res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end('Internal Server Error');
        return;
      }

      console.log('Record inserted into database');
      console.log('Inserted ID:', results.insertId);

 //     res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      //res.end('Minimum steps required: ${result}');
      const jsonResponse = {
        steps: result,
      };
      res.end(JSON.stringify({ steps: result }));
    });
  }
}).listen(8080);

console.log('Server running at http://localhost:8080/');
