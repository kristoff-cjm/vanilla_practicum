"use strict";

async function loadAdmin() {
    //await getTenantInfo();
    await loadCourses();
    await loadLogs();
    await loadUsers();
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
    if (response.status == 201) {
        displayInput.value = "";
        idInput.value = "";
        await loadCourses();
    }
}

async function createLog() {
    const courseSelect = document.getElementById('logCourseSelect');
    const classId = courseSelect.options[courseSelect.selectedIndex].value;
    const logText = document.getElementById('logText').value;
    const date = new Date();

    const request = new Request('/api/v1/logs', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            courseId: classId,
            studentId: "admin",
            text: logText,
            date: date,
        }),
    });

    const response = await authFetch(request);
    if (response.ok) {
        await loadLogs();
    }
}

async function loadCourses() {
    const request = new Request('/api/v1/courses', {
        method: 'GET',
    });
    console.log("getting courses");

    const response = await authFetch(request);
    console.log(response);
    const data = await response.json();
    console.log(data);
    const courseUl = document.getElementById('adminCourses');
    courseUl.innerHTML = "";

    for (let i = 0; i < data.length; i++) {
        const course = data[i];
    
        // Create <li> for the course list
        const li = document.createElement("li");
        li.classList.add("list-group-item");
        li.textContent = course.display;
        courseUl.appendChild(li);
    
        // Create <option> for the select
        const option = document.createElement("option");
        option.value = course.id;
        option.textContent = course.display;
        const logCourseSelect = document.getElementById('logCourseSelect');
        logCourseSelect.appendChild(option);
    }
}

async function createUser() {
    const username = document.getElementById('newUserId').value.trim();
    const password = document.getElementById('newUserPassword').value;
    const studentId = document.getElementById('newUserStudentId').value;
    const roleSelect = document.getElementById('newUserRole');
    const role = roleSelect.options[roleSelect.selectedIndex].value;

    if(role != "student"){
        studentId = "";
    }else if(studentId.length !== 8){
        alert("StudentID must be 8 digits");
        return;
    }
  
    if (!username || !password || !role || role === "Select Role") {
      alert("Fill out all fields and select a role.");
      return;
    }
  
    const request = new Request('/api/v1/user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        password,
        role,
        studentId
      }),
    });
  
    const response = await authFetch(request);
  
    if (response.ok) {
      alert("User created successfully");
      document.getElementById('newUserId').value = '';
      document.getElementById('newUserPassword').value = '';
      document.getElementById('newUserStudentId').value = '';
      roleSelect.selectedIndex = 0;
      await loadUsers();
    } else {
      const errorData = await response.json();
      alert("Error creating user: " + (errorData.error || "Unknown error"));
    }
  }
  

async function loadUsers() {
    const request = new Request('/api/v1/users', {
      method: 'GET',
    });
    const response = await authFetch(request);
    const data = await response.json();
    const userTbody = document.getElementById("usersList");
    userTbody.innerHTML = '';
  
    for (let i = 0; i < data.length; i++) {
      const user = data[i];
  
      const tr = document.createElement("tr");
  
      const tdStudentId = document.createElement("td");
      tdStudentId.textContent = user.studentId || "-";
  
      const tdUsername = document.createElement("td");
      tdUsername.textContent = user.username;
  
      const tdRole = document.createElement("td");
      tdRole.textContent = user.role;
  
      tr.appendChild(tdStudentId);
      tr.appendChild(tdUsername);
      tr.appendChild(tdRole);
  
      userTbody.appendChild(tr);
    }
  }

async function loadLogs() {
    const request = new Request(
        `/api/v1/adminLogs`,
        {
            method: 'GET',
        }
    );
    const response = await authFetch(request);
    if (response.ok) {
        //update
        const data = await response.json();
        const parent = document.getElementById('adminLogs');
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
