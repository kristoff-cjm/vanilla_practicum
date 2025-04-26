"use strict";

async function loadAdmin() {
    //await getTenantInfo();
    await loadCourses();
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

async function submitNewCourse() {
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
        const courseSelect = document.getElementById('course');
        const courseUl = document.getElementById('coursesList');

        const option = document.createElement('option');
        option.value = courseId;
        option.innerHTML = courseName;
        courseSelect.appendChild(option);
        const li = document.createElement("li");
        li.textContent = courseName;
        courseUl.appendChild(li);
    }
}

async function loadCourses() {
    const request = new Request('/api/v1/courses', {
        method: 'GET',
    });

    const response = await authFetch(request);
    const data = await response.json();
    const courseSelect = document.getElementById('course');
    const courseUl = document.getElementById('coursesList');

    for (let i = 0; i < data.length; i++) {
        const course = data[i];
        const option = document.createElement('option');
        option.value = course.id;
        option.innerHTML = course.display;
        courseSelect.appendChild(option);
        const li = document.createElement("li");
        li.textContent = course.display;
        courseUl.appendChild(li);
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
        document.getElementById('uvuIdDisplay').innerHTML =
            'UserId not found in this course.';
    }
}
