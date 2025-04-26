"use strict";

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

async function loadClasses() {
  const request = new Request('/api/v1/courses', { method: 'GET' });
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

function courseSelected(sel) {
  const selectedOption = sel.options[sel.selectedIndex];
  const uvuIdDiv = document.getElementById('uvuIdDiv');
  if (selectedOption.value == '') {
    uvuIdDiv.classList.add('d-none');
  } else {
    uvuIdDiv.classList.remove('d-none');
  }
}

async function handleIdInput(input) {
  if (input.value.length == 8) {
    const courseSel = document.getElementById('course');
    const courseId = courseSel.options[courseSel.selectedIndex].value;

    await getStudentLogs(courseId, input.value);
  } else if (input.value.length > 8) {
    const str = input.value + '';
    const newStr = str.substring(0, 8);
    input.value = parseInt(newStr);
  }
}

async function getStudentLogs(courseId, uvuId) {
  const request = new Request(
    `/api/v1/logs?courseId=${courseId}&uvuId=${uvuId}`,
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
