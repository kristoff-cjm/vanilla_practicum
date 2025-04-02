const createError = require("http-errors")
const express = require('express')
const path = require("path")
const { v4: uuidv4 } = require('uuid')
const app = express()
const port = 3000

//DATABASE Components
const mongoose = require("mongoose")
const mongoURI = process.env.MONGOURI;

mongoose.connect(mongoURI)

const logSchema = new mongoose.Schema({
  courseId: String,
  uvuId: String,
  text: String,
  id: String,
  date: Date
})

const courseSchema = new mongoose.Schema({
  id: String,
  display: String
})

const Log = new mongoose.model("Log", logSchema)
const Course = new mongoose.model("Course", courseSchema)
//

app.use(express.static("public"))
app.use(express.json())

app.get('/', (req, res) => {
  //already sends index.html by default
})

//post logs
app.post('/api/v1/logs', async (req, res) => {
  try {
      const data = req.body
      if (!data.courseId || !data.uvuId || !data.text || !data.date) {
          return res.status(400).json({ error: 'Missing required fields: courseId, uvuId, text, date' });
      }
      const newLog = new Log(data);
      newLog.id = uuidv4();
      await newLog.save()

      res.status(201).json({ message: 'Log added successfully', log: newLog })
  } catch (error) {
      console.error("failed to save log: "+error)
      res.status(500).json({ error: 'Failed to save log'+error });
  }
});

//get logs
app.get('/api/v1/logs', async (req, res) => {
  const { courseId, uvuId } = req.query; // Extract query params
  const logs = await Log.find({courseId:courseId,uvuId:uvuId})
  res.json(logs);
})

app.post("/api/v1/course", async (req,res) =>{
  try {
    const data = req.body
    if (!data.id || !data.display) {
        return res.status(400).json({ error: 'Missing required fields: courseId, displayName' });
    }
    const newCourse = new Course(data);
    await newCourse.save()

    res.status(201).json({ message: 'Course added successfully', course: newCourse })
  } catch (error) {
      console.error("failed to save course: "+error)
      res.status(500).json({ error: 'Failed to save course'+error });
  }
})

//get courses
app.get("/api/v1/courses", async (req, res)=>{
  const courses = await Course.find({}) //get all courses
  if(courses.length == 0){
    //If there are none, seed them with the defaults...
    const defaultCourses = [
      {
        id: "cs3380",
        display: "CS 3380"
      },
      {
        id: "cs4660",
        display: "CS 4660"
      },
      {
        id: "cs4690",
        display: "CS 4690"
      }
    ];
    defaultCourses.forEach(async (course)=>{
      const newCourse = new Course(course)
      await newCourse.save()
    })
    res.json(defaultCourses)
    return;
  }
  res.json(courses)
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