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
  studentId: String,
  tenantId: String,
  text: String,
  id: String,
  date: Date
})

const courseSchema = new mongoose.Schema({
  id: String,
  tenantId: String,
  display: String,
  userId: String,
  students: [String]
})

const userSchema = new mongoose.Schema({
  studentId: String,
  tenantId: String,
  username: String,
  role: String,
  password: String
})

const Log = new mongoose.model("Log", logSchema)
const Course = new mongoose.model("Course", courseSchema)
const User = new mongoose.model("User", userSchema)

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
  console.log("attempting login");
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

app.get('/api/v1/tenantInfo', requireAuth(), async(req,res)=>{
  console.log("getting tenant info")
  const tenant = getTenant(req.connection.localPort)
  res.status(201).json({tenant:tenant})
})

//post logs
app.post('/api/v1/logs', requireAuth(), async (req, res) => {
  console.log("adding log") //admin, student
  const tenant = getTenant(req.connection.localPort);
  try {
      const data = req.body

      if (!data.studentId) {
        if(!req.user.studentId){
          return res.status(400).json({ error: 'Missing studentId' });
        }
        data.studentId = req.user.studentId;
      }

      if (!data.courseId || !data.studentId || !data.text || !data.date) {
          return res.status(400).json({ error: 'Missing required fields: courseId, studentId, text, date' });
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
app.get('/api/v1/logs', requireAuth("student"), async (req, res) => {
  console.log("getting logs") //student
  const tenant = getTenant(req.connection.localPort)
  const { courseId } = req.query;
  const logs = await Log.find({courseId:courseId,studentId:req.user.studentId,tenantId:tenant.id})
  res.json(logs);
})

app.get('/api/v1/adminLogs', requireAuth("admin"), async (req, res) => {
  console.log("getting logs as admin") //admin
  const tenant = getTenant(req.connection.localPort)
  const logs = await Log.find({tenantId:tenant.id})
  res.json(logs);
})

app.get('/api/v1/teacherLogs', requireAuth("teacher"), async (req, res) => {
  console.log("getting logs as teacher") //teacher
  const tenant = getTenant(req.connection.localPort)
  const logs = await Log.find({tenantId:tenant.id, userId:req.user._id})
  res.json(logs);
})

app.post("/api/v1/course", requireAuth(), async (req,res) =>{
  console.log("posting course"); //admin,teacher
  try {
    const tenant = getTenant(req.connection.localPort)
    const data = req.body
    if (!data.id || !data.display) {
        return res.status(400).json({ error: 'Missing required fields: courseId, displayName' });
    }
    const newCourse = new Course(data);
    newCourse.tenantId = tenant.id;
    newCourse.userId = req.user._id;
    await newCourse.save()

    res.status(201).json({ message: 'Course added successfully', course: newCourse })
  } catch (error) {
      console.error("failed to save course: "+error)
      res.status(500).json({ error: 'Failed to save course'+error });
  }
})

//get courses
app.get("/api/v1/courses", requireAuth(), async (req, res)=>{
  console.log("getting courses")//admin,
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

app.get("/api/v1/studentCourses", requireAuth("student"), async (req, res) => {
  console.log("getting student's courses") //student
  const tenant = getTenant(req.connection.localPort);
  const user = req.user;
  
  if (!user) {
    return res.status(401).json({ error: "User not found" });
  }

  const courses = await Course.find({ tenantId: tenant.id }, "display id students");
  const studentCourses = courses.map((course) => {
    return {
      id: course.id,
      display: course.display,
      isEnrolled: course.students.includes(req.user.studentId)
    };
  });
  
  if (!courses || courses.length === 0) {
    return res.status(404).json({ message: "No courses found." });
  }

  res.json(studentCourses);
});


app.get("/api/v1/teacher_courses", requireAuth("teacher"), async (req, res)=>{
  console.log("getting teacher's courses") //teacher
  const tenant = getTenant(req.connection.localPort);
  const courses = await Course.find({tenantId:tenant.id,userId:req.user._id})
  res.json(courses);
})

app.get("/api/v1/users", requireAuth("admin"), async (req, res)=>{
  console.log("getting users") //admin
  const tenant = getTenant(req.connection.localPort);
  const users = await User.find({tenantId:tenant.id});
  const userData = users.map(({ studentId, username, role }) => ({
    studentId,
    username,
    role
  }));
  res.json(userData);
})

app.get("/api/v1/students", requireAuth('teacher'), async (req, res) => {
  try {
    console.log("getting students") //teacher
    const tenant = getTenant(req.connection.localPort);
    const students = await User.find({ tenantId: tenant.id, role: 'student' }, 'studentId username role');
    res.json(students);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load students' });
  }
});


app.post("/api/v1/user", requireAuth('admin'), async (req, res) => {
  console.log("Creating new user..."); //admin
  
  const { studentId, username, role, password } = req.body;
  
  if (!username || !role || !password) {
    return res.status(400).json({ error: "Username, role, and password are required" });
  }

  try {
    const tenant = getTenant(req.connection.localPort);

    const newUser = new User({
      tenantId: tenant.id,
      studentId: studentId || "",
      username,
      role,
      password,
    });

    await newUser.save();
    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Failed to create user" });
  }
});

app.post("/api/v1/course/:courseId/addStudent", requireAuth('teacher','student'), async (req, res) => {
  console.log("adding student to course") //teacher, student
  let { studentId } = req.body;
  const { courseId } = req.params;
  const tenant = getTenant(req.connection.localPort);

  if (!studentId) {
    if(!req.user.studentId){
      return res.status(400).json({ error: 'Missing studentId' });
    }
    studentId = req.user.studentId;
  }

  const course = await Course.findOne({ id: courseId, tenantId: tenant.id });
  if (!course) {
    return res.status(404).json({ error: 'Course not found' });
  }

  if (!course.students.includes(studentId)) {
    course.students.push(studentId);
    await course.save();
  }

  res.json(course);
});

app.post("/api/v1/course/:courseId/removeStudent", requireAuth('teacher','student'), async (req, res) => {
  console.log("removing student from course") //student
  let { studentId } = req.body;
  const { courseId } = req.params;
  const tenant = getTenant(req.connection.localPort);

  if (!studentId) {
    if(!req.user.studentId){
      return res.status(400).json({ error: 'Missing studentId' });
    }
    studentId = req.user.studentId;
  }

  const course = await Course.findOne({ id: courseId, tenantId: tenant.id });
  if (!course) {
    return res.status(404).json({ error: 'Course not found' });
  }

  course.students = course.students.filter(id => id !== studentId);
  await course.save();

  res.json(course);
});

app.get("/api/v1/courses/:courseId/students", requireAuth("teacher"), async (req, res) => {
  console.log("getting students in course") //teacher
  const courseId = req.params.courseId;
  const tenant = getTenant(req.connection.localPort);

  try {
    const course = await Course.findOne({ id: courseId, tenantId: tenant.id });
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }
    const studentIds = course.students || [];
    if (studentIds.length === 0) {
      return res.json([]);
    }
    const students = await User.find({ studentId: { $in: studentIds }, tenantId: tenant.id, role: "student" })
      .select('studentId username role');


    res.json(students);
  } catch (err) {
    console.error("Error fetching students for course", err);
    res.status(500).json({ error: "Internal server error" });
  }
});


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

function requireAuth(...allowedRoles) {
  return async function (req, res, next) {
    const wantsJson = req.headers.accept && req.headers.accept.includes('application/json');

    // Authenticate
    if (!req.cookies.authToken) {
      console.log("no authToken...");
      if (wantsJson) {
        return res.status(401).json({ error: 'No authToken' });
      } else {
        return res.redirect('/login.html');
      }
    }

    const user = await User.findOne({ username: req.cookies.authToken });

    if (!user) {
      console.log("no such user...");
      if (wantsJson) {
        return res.status(401).json({ error: 'Invalid authToken' });
      } else {
        return res.redirect('/login.html');
      }
    }

    //Check Tenant
    const tenant = getTenant(req.connection.localPort);
    if(user.tenantId != tenant.id){
      console.log("Incorrect tenant...");
      if (wantsJson) {
        return res.status(401).json({ error: 'Invalid tenantId, login on the correct url.' });
      } else {
        return res.redirect('/login.html');
      }
    }

    // Authorize
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      console.log(`User role ${user.role} not authorized for ${req.originalUrl}`);
      if (wantsJson) {
        return res.status(403).json({ error: 'Forbidden' });
      } else {
        return res.redirect('/login.html');
      }
    }

    req.user = user;

    next();
  };
}

app.listen(UofUPort, () => {
  console.log(`Listening on port ${UofUPort}`)
})

app.listen(UVUPort, () => {
  console.log(`Listening on port ${UVUPort}`)
})