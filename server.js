const createError = require("http-errors")
const express = require('express')
const fs = require("fs")
//const DB = require("./db")
const path = require("path")
const { v4: uuidv4 } = require('uuid');
const app = express()
const port = 3000

//console.log(DB)
//console.log(typeof(DB))
//const database = new DB();
const dbPath = path.join(__dirname, 'db.json');

const getDB = () => {
  const data = fs.readFileSync(dbPath);
  return JSON.parse(data);
};

const saveDB = (data) => {
  fs.writeFile(dbPath, JSON.stringify(data, null, 2), (err) => {
    if (err) {
      console.error("error writing to file: "+err);
    } else {
        console.log("File written successfully\n");
    }
});
};

app.use(express.static("public"))
app.use(express.json())

app.get('/', (req, res) => {
  //already sends index.html by default
})

//post logs
app.post('/api/v1/logs', async (req, res) => {
  try {
      const db = getDB();
      const newLog = req.body;

      if (!newLog.courseId || !newLog.uvuId || !newLog.text || !newLog.date) {
          return res.status(400).json({ error: 'Missing required fields: courseId, uvuId, text, date' });
      }

      newLog.id = uuidv4();
      db.logs = db.logs || [];
      db.logs.push(newLog); // Add new log entry
      saveDB(db)

      res.status(201).json({ message: 'Log added successfully', log: newLog })
  } catch (error) {
      console.error("failed to save log: "+error)
      res.status(500).json({ error: 'Failed to save log'+error });
  }
});

//get logs
app.get('/api/v1/logs', async (req, res) => {
  const { courseId, uvuId } = req.query; // Extract query params

  const data = getDB()
  const logs = data.logs
  const filteredLogs = logs.filter(log => log.courseId === courseId && log.uvuId === uvuId);

  res.json(filteredLogs);
})

//get courses
app.get("/api/v1/courses", async (req, res)=>{
  const db = getDB()
  res.json(db.courses)
})

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

app.use((err, req, res, next) => {
  console.error("Error:", err.message); // Log error details

  res.status(err.status || 500);

  // If the request expects JSON, return a JSON error response
  if (req.headers.accept && req.headers.accept.includes("application/json")) {
    res.json({ error: err.message || "Internal Server Error" });
  } else {
    // Otherwise, serve the error.html page
    res.sendFile(path.join(__dirname, "public", "error.html"));
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`)
})