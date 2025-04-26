const createError = require("http-errors")
const express = require('express')
const path = require("path")
const { v4: uuidv4 } = require('uuid')
const app = express()
const UVUPort = 3000
const UofUPort = 4000

const cookieParser = require("cookie-parser");
app.use(cookieParser());

app.use(express.static("public"))
app.use(express.json())

//DATABASE Components
const mongoose = require("mongoose")
const mongoURI = process.env.MONGOURI;

mongoose.connect(mongoURI)

const logSchema = new mongoose.Schema({
  courseId: String,
  uvuId: String,
  tenantId: String,
  text: String,
  id: String,
  date: Date
})

const courseSchema = new mongoose.Schema({
  id: String,
  tenantId: String,
  display: String
})

const userSchema = new mongoose.Schema({
  id: String,
  tenantId: String,
  username: String,
  role: String,
  password: String
})

const Log = new mongoose.model("Log", logSchema)
const Course = new mongoose.model("Course", courseSchema)
const User = new mongoose.model("User", userSchema)
//

/*
app.use((req, res, next) => {
  const isAuthenticated = req.cookies?.authToken; // Adjust based on your auth system
  if (!isAuthenticated && req.path !== '/login') {
      return res.redirect('/login');
  }
  next();
});
*/

//Routes

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});


app.get('/student', requireAuth('student'), (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'student.html'));
});

app.get('/teacher', requireAuth('teacher'), (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'teacher.html'));
});

app.get('/admin', requireAuth('admin'), (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});


app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Missing required fields: username, password' });
  }

  const totalUsers = await User.countDocuments();
  if (totalUsers === 0) {
    await seedUserDB();
  }

  const user = await User.findOne({ username });

  if (!user) {
    console.log("User not found");
    return res.status(401).json({ success: false, message: "Invalid username or password" });
  }

  if (user.password !== password) {
    console.log("Incorrect password");
    return res.status(401).json({ success: false, message: "Invalid username or password" });
  }

  // Login success
  res.cookie("authToken", username, {
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 14, // 14 days
  });

  console.log(`User ${username} logged in as ${user.role}`);

  return res.status(200).json({ success: true, role: user.role });
});




app.get('/',requireAuth, (req, res) => {
  //already sends index.html by default
})

app.get('/api/v1/tenantInfo', requireAuth, async(req,res)=>{
  const tenant = getTenant(req.connection.localPort)
  res.status(201).json({tenant:tenant})
})

//post logs
app.post('/api/v1/logs', requireAuth, async (req, res) => {
  const tenant = getTenant(req.connection.localPort)
  try {
      const data = req.body
      if (!data.courseId || !data.uvuId || !data.text || !data.date) {
          return res.status(400).json({ error: 'Missing required fields: courseId, uvuId, text, date' });
      }
      const newLog = new Log(data);
      newLog.id = uuidv4();
      newLog.tenantId = tenant.id;
      await newLog.save()

      res.status(201).json({ message: 'Log added successfully', log: newLog })
  } catch (error) {
      console.error("failed to save log: "+error)
      res.status(500).json({ error: 'Failed to save log'+error });
  }
});

//get logs
app.get('/api/v1/logs', requireAuth, async (req, res) => {
  const tenant = getTenant(req.connection.localPort)
  const { courseId, uvuId } = req.query; // Extract query params
  const logs = await Log.find({courseId:courseId,uvuId:uvuId,tenantId:tenant.id})
  res.json(logs);
})

app.post("/api/v1/course", requireAuth, async (req,res) =>{
  try {
    const tenant = getTenant(req.connection.localPort)
    const data = req.body
    if (!data.id || !data.display) {
        return res.status(400).json({ error: 'Missing required fields: courseId, displayName' });
    }
    const newCourse = new Course(data);
    newCourse.tenantId = tenant.id;
    await newCourse.save()

    res.status(201).json({ message: 'Course added successfully', course: newCourse })
  } catch (error) {
      console.error("failed to save course: "+error)
      res.status(500).json({ error: 'Failed to save course'+error });
  }
})

//get courses
app.get("/api/v1/courses", requireAuth, async (req, res)=>{
  const tenant = getTenant(req.connection.localPort)
  const courses = await Course.find({tenantId:tenant.id}) //get all courses for tenant
  if(courses.length == 0){
    //If there are none, seed them with the defaults...
    const defaultCourses = [
      {
        id: "cs3380",
        tenantId: tenant.id,
        display: "CS 3380"
      },
      {
        id: "cs4660",
        tenantId: tenant.id,
        display: "CS 4660"
      },
      {
        id: "cs4690",
        tenantId: tenant.id,
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

function getTenant(port){
  if(port === UVUPort){
    return {
      id: "1",
      shortName: "UVU",
      displayName: "Utah Valley University"
    };
  }else if(port === UofUPort){
    return {
      id: "2",
      shortName: "UofU",
      displayName: "University of Utah"
    };
  }else{
    return null;
  }
}

async function seedUserDB(){
  console.log("seeding database");
  const defaultUsers = [
    {
      id: "1",
      username: "root_uvu",
      password: "willy",
      tenantId: "1",
      role: "admin"
    },
    {
      id: "2",
      username: "root_uofu",
      password: "swoopy",
      tenantId: "2",
      role: "admin"
    }
  ];
  defaultUsers.forEach(async (user)=>{
    const newUser = new User(user)
    await newUser.save()
  })
}

function requireAuth(requiredRole = null) {
  return async function (req, res, next) {
    console.log("checking auth...");

    // Authenticate
    if (!req.cookies.authToken) {
      console.log("no authToken...");
      return res.status(401).json({ error: 'No authToken' });
    }

    const user = await User.findOne({ username: req.cookies.authToken });

    if (!user) {
      console.log("no such user...");
      return res.status(401).json({ error: 'Invalid authToken' });
    }

    // Authorize
    if (requiredRole && user.role !== requiredRole) {
      console.log(`User role ${user.role} not authorized for ${requiredRole}`);
      return res.status(403).json({ error: 'Forbidden' });
    }

    req.user = user;

    console.log("continuing with request...");
    next();
  };
}

app.listen(UofUPort, () => {
  console.log(`Listening on port ${UofUPort}`)
})

app.listen(UVUPort, () => {
  console.log(`Listening on port ${UVUPort}`)
})