"use strict";

async function loadStudent(){
  await loadCourses();
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

async function loadCourses() {
  // Get the courses the student is already enrolled in
  const studentCoursesRequest = new Request('/api/v1/studentCourses', { method: 'GET' });
  const studentCoursesResponse = await authFetch(studentCoursesRequest);
  const studentCourses = await studentCoursesResponse.json();

  const courseSelect = document.getElementById("logCourseSelect");
  courseSelect.innerHTML = "<option selected disabled>Choose a course</option>";

  const courseList = document.getElementById('courseList');
  courseList.innerHTML = ''; // Clear any existing courses

  // Loop through all available courses
  for (let i = 0; i < studentCourses.length; i++) {
    const course = studentCourses[i];

    // Check if the student is already enrolled in this course
    const isEnrolled = course.isEnrolled;

    // Create the course list item
    const li = document.createElement('li');
    li.classList.add('align-items-center','d-flex','justify-content-between','list-group-item');
    li.textContent = course.display;

    // Create the button for the course (Enroll or Drop)
    const button = document.createElement('button');
    button.classList.add('btn', isEnrolled ? 'btn-danger' : 'btn-success');
    button.textContent = isEnrolled ? 'Drop' : 'Enroll';

    // Event listener for the button click
    button.addEventListener('click', async () => {
      if (isEnrolled) {
        await removeStudentFromCourse(course.id);
        button.textContent = 'Enroll';
        button.classList.remove('btn-danger');
        button.classList.add('btn-success');
      } else {
        await addStudentToCourse(course.id);
        button.textContent = 'Drop';
        button.classList.remove('btn-success');
        button.classList.add('btn-danger');
      }
    });

    // Append the button to the list item
    li.appendChild(button);
    courseList.appendChild(li);

    //Also update the course dropdown
    if(course.isEnrolled){
      const option = document.createElement('option');
      option.value = course.id;
      option.innerHTML = course.display;
      courseSelect.appendChild(option);
    }

  }
}

async function addStudentToCourse(courseId) {
  const request = new Request(`/api/v1/course/${courseId}/addStudent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  await authFetch(request);
  await loadCourses();
}

async function removeStudentFromCourse(courseId) {
  const request = new Request(`/api/v1/course/${courseId}/removeStudent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  await authFetch(request);
  await loadCourses();
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

async function submitStudentLog() {
  const courseSelect = document.getElementById('logCourseSelect');
  const classId = courseSelect.options[courseSelect.selectedIndex].value;
  const logText = document.getElementById('newLogText').value;
  const date = new Date();
  const request = new Request('/api/v1/logs', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      courseId: classId,
      text: logText,
      date: date,
    }),
  });

  const response = await authFetch(request);
  if (response.ok) {
    const courseSel = document.getElementById('logCourseSelect');
    const courseId = courseSel.options[courseSel.selectedIndex].value;
    await loadLogsForCourse(courseId);
  }
}

