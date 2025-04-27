"use strict";

async function loadTeacher(){
  await loadCourses();
  await loadStudents();
  await loadLogs();
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
  const request = new Request('/api/v1/teacher_courses', { method: 'GET' });
  const response = await authFetch(request);
  const data = await response.json();
  
  const courseAccordion = document.getElementById('teacherCourses');
  const courseSelect = document.getElementById('membershipCourseSelect');
  courseAccordion.innerHTML = "";
  courseSelect.innerHTML = "";

  for (let i = 0; i < data.length; i++) {
    const course = data[i];
    const courseId = `course-${i}`;

    const accordionItem = document.createElement('div');
    accordionItem.className = 'accordion-item';
    accordionItem.innerHTML = `
      <h2 class="accordion-header" id="heading-${courseId}">
        <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-${courseId}" aria-expanded="false" aria-controls="collapse-${courseId}">
          ${course.display}
        </button>
      </h2>
      <div id="collapse-${courseId}" class="accordion-collapse collapse" aria-labelledby="heading-${courseId}" data-bs-parent="#teacherCourses">
        <div class="accordion-body">
          <ul id="students-${course.id}" class="list-group">
            <!-- students loaded here -->
          </ul>
        </div>
      </div>
    `;

    courseAccordion.appendChild(accordionItem);

    await loadCourseStudents(course.id);

    //Add to the dropdown
    const option = document.createElement("option");
    option.value = course.id;
    option.textContent = course.display;
    courseSelect.appendChild(option);

  }
}

async function loadCourseStudents(courseId) {
  const request = new Request(`/api/v1/courses/${courseId}/students`, { method: 'GET' });
  const response = await authFetch(request);
  const students = await response.json();
  console.log(students);

  const studentList = document.getElementById(`students-${courseId}`);
  studentList.innerHTML = "";

  students.forEach(student => {
    const li = document.createElement("li");
    li.classList.add("list-group-item");
    li.textContent = `${student.studentId} - ${student.username}`;
    studentList.appendChild(li);
  });
}




async function loadStudents() {
  const request = new Request('/api/v1/students', { method: 'GET' });
  const response = await authFetch(request);
  const data = await response.json();

  const tableBody = document.getElementById("teacherStudents");
  const studentSelect = document.getElementById("membershipStudentSelect");

  tableBody.innerHTML = '';
  studentSelect.innerHTML = '<option selected disabled>Select Student</option>';

  for (let i = 0; i < data.length; i++) {
    const student = data[i];

    // Add to students table
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${student.studentId}</td>
      <td>${student.username}</td>
      <td>${student.role}</td>
    `;
    tableBody.appendChild(tr);

    // Add to student select
    const option = document.createElement("option");
    option.value = student.studentId;
    option.textContent = `${student.studentId} (${student.username})`;
    studentSelect.appendChild(option);
  }
}


async function createCourse() {
  const displayInput = document.getElementById("newCourseDisplay");
  const idInput = document.getElementById("newCourseId");
  const courseName = displayInput.value;
  const courseId = idInput.value;
  if (courseName == "" || courseId == "") {
      alert("Need a non-empty display and id for your course");
      return;
  }
  const request = new Request('/api/v1/course', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: courseId, display: courseName }),
  });

  const response = await authFetch(request);
  if (response.ok) {
      displayInput.value = "";
      idInput.value = "";
      await loadCourses();
  }
}

async function loadLogs() {
  const request = new Request(
      `/api/v1/teacherLogs`,
      {
          method: 'GET',
      }
  );
  const response = await authFetch(request);
  if (response.ok) {
      //update
      const data = await response.json();
      const parent = document.getElementById('teacherLogs');
      parent.innerHTML = '';
      for (let i = 0; i < data.length; i++) {
          const item = data[i];
          const tr = document.createElement("tr");

          const courseIdTd = document.createElement("td");
          courseIdTd.textContent = item.courseId || '';

          const studentIdTd = document.createElement("td");
          studentIdTd.textContent = item.studentId || '';

          const dateTd = document.createElement("td");
          dateTd.textContent = item.date ? new Date(item.date).toLocaleString() : '';

          const logTd = document.createElement("td");
          logTd.textContent = item.text || '';

          tr.appendChild(courseIdTd);
          tr.appendChild(studentIdTd);
          tr.appendChild(dateTd);
          tr.appendChild(logTd);

          parent.appendChild(tr);
      }
  } else {
      document.getElementById('uvuIdDisplay').innerHTML =
          'UserId not found in this course.';
  }
}

async function addStudentToSelectedCourse() {
  const courseSelect = document.getElementById("membershipCourseSelect");
  const studentSelect = document.getElementById("membershipStudentSelect");
  
  const courseId = courseSelect.value;
  const studentId = studentSelect.value;

  if (!courseId || !studentId) {
    alert("Please select both a course and a student.");
    return;
  }

  const response = await addStudentToCourse(courseId, studentId);
  if (response.ok) {
    alert("Student added successfully.");
  } else {
    alert("Failed to add student.");
  }
}

async function removeStudentFromSelectedCourse() {
  const courseSelect = document.getElementById("membershipCourseSelect");
  const studentSelect = document.getElementById("membershipStudentSelect");

  const courseId = courseSelect.value;
  const studentId = studentSelect.value;

  if (!courseId || !studentId) {
    alert("Please select both a course and a student.");
    return;
  }

  const response = await removeStudentFromCourse(courseId, studentId);
  if (response.ok) {
    alert("Student removed successfully.");
  } else {
    alert("Failed to remove student.");
  }
}


async function addStudentToCourse(courseId, studentId) {
  const request = new Request(`/api/v1/course/${courseId}/addStudent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ studentId }),
  });


  return await authFetch(request);
}

async function removeStudentFromCourse(courseId, studentId) {
  const request = new Request(`/api/v1/course/${courseId}/removeStudent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ studentId }),
  });

  return await authFetch(request);
}

