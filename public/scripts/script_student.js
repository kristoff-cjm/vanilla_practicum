"use strict";

async function loadStudent(){
  await loadMyCourses();
  await loadAllCourses();
}

async function getTenantInfo() {
  const appTitle = document.getElementById("appTitle");
  try {
    const request = new Request('/api/v1/tenantInfo', { method: 'GET' });
    const response = await authFetch(request);
    const data = await response.json();
    console.log("tenant data:");
    console.log(data);
    appTitle.textContent = data.tenant.displayName;
  } catch (e) {
    appTitle.textContent = "Tenant Not Available";
  }
}

async function loadMyCourses(){
  const request = new Request('/api/v1/studentCourses', { method: 'GET' });
  const response = await authFetch(request);
  const data = await response.json();
  const courseSelect = document.getElementById('logCourseSelect');
  const courseList = document.getElementById('courseList');

  for (let i = 0; i < data.length; i++) {
    const course = data[i];

    const option = document.createElement('option');
    option.value = course.id;
    option.innerHTML = course.display;
    courseSelect.appendChild(option);

    const li = document.createElement("li");
    li.textContent = course.display;
    courseList.appendChild(li);
  }
}

async function loadAllCourses() {
  // Get the courses the student is already enrolled in
  const studentCoursesRequest = new Request('/api/v1/studentCourses', { method: 'GET' });
  const studentCoursesResponse = await authFetch(studentCoursesRequest);
  const studentCourses = await studentCoursesResponse.json();

  // Get all available courses
  const allCoursesRequest = new Request('/api/v1/courses', { method: 'GET' });
  const allCoursesResponse = await authFetch(allCoursesRequest);
  const allCoursesData = await allCoursesResponse.json();

  const courseList = document.getElementById('courseList');
  courseList.innerHTML = ''; // Clear any existing courses

  // Loop through all available courses
  for (let i = 0; i < allCoursesData.length; i++) {
    const course = allCoursesData[i];

    // Check if the student is already enrolled in this course
    const isEnrolled = studentCourses.some(enrolledCourse => enrolledCourse.id === course.id);

    // Create the course list item
    const li = document.createElement('li');
    li.classList.add('list-group-item');
    li.textContent = course.display;

    // Create the button for the course (Enroll or Drop)
    const button = document.createElement('button');
    button.classList.add('btn', isEnrolled ? 'btn-danger' : 'btn-success');
    button.textContent = isEnrolled ? 'Drop' : 'Enroll';

    // Event listener for the button click
    button.addEventListener('click', async () => {
      if (isEnrolled) {
        // Drop the course
        await dropCourse(course.id);
        button.textContent = 'Enroll';
        button.classList.remove('btn-danger');
        button.classList.add('btn-success');
      } else {
        // Enroll in the course
        await enrollCourse(course.id);
        button.textContent = 'Drop';
        button.classList.remove('btn-success');
        button.classList.add('btn-danger');
      }
    });

    // Append the button to the list item
    li.appendChild(button);
    courseList.appendChild(li);
  }
}

async function addStudentToCourse(courseId) {
  const request = new Request(`/api/v1/course/${courseId}/addStudent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });


  return await authFetch(request);
}

async function removeStudentFromCourse(courseId) {
  const request = new Request(`/api/v1/course/${courseId}/removeStudent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return await authFetch(request);
}

async function loadLogsForCourse(courseId) {
  const request = new Request(
    `/api/v1/logs?courseId=${courseId}`,
    { method: 'GET' }
  );
  const response = await authFetch(request);
  if (response.status == 200 || response.status == 304) {
    const data = await response.json();
    document.getElementById('uvuIdDisplay').innerHTML = 'Student Logs for ' + uvuId;
    const parent = document.getElementById('logs');
    parent.innerHTML = '';
    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      const li = document.createElement('li');
      const div = document.createElement('div');
      const pre = document.createElement('pre');
      li.classList.add("list-group-item");
      li.addEventListener('click', toggleLog);
      div.innerHTML = item.date;
      pre.innerHTML = item.text;
      li.appendChild(div);
      li.appendChild(pre);
      parent.appendChild(li);
    }
  } else {
    document.getElementById('uvuIdDisplay').innerHTML = 'UserId not found in this course.';
  }
}

async function loadLogsForCourse(courseId) {
  const request = new Request(
    `/api/v1/logs?courseId=${courseId}`,
    { method: 'GET' }
  );
  const response = await authFetch(request);
  
  if (response.ok) {
    const data = await response.json();

    // Clear previous logs and set the course name
    const logsList = document.getElementById('studentLogs');
    logsList.innerHTML = '';

    if (data.length === 0) {
      logsList.innerHTML = '<li class="list-group-item">No logs available for this course.</li>';
    }

    // Display all logs
    data.forEach(item => {
      const li = document.createElement('li');
      li.classList.add('list-group-item');

      const div = document.createElement('div');
      const pre = document.createElement('pre');

      div.innerHTML = `Date: ${new Date(item.date).toLocaleString()}`;
      pre.innerHTML = item.text;

      li.appendChild(div);
      li.appendChild(pre);
      logsList.appendChild(li);
    });
  } else {
    document.getElementById('studentLogs').innerHTML = '<li class="list-group-item">Error fetching logs.</li>';
  }
}

