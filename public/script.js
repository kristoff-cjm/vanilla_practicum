"use strict";
// TODO: Wire up the app's behavior here.
// NOTE: The TODOs are listed in index.html

async function onload() {
  await loadClasses();
}

async function loadClasses() {
  const request = new Request('/api/v1/courses', {
    method: 'GET',
  });

  const response = await fetch(request);
  const data = await response.json();
  const courseSelect = document.getElementById('course');

  for (let i = 0; i < data.length; i++) {
    const course = data[i];
    const option = document.createElement('option');
    option.value = course.id;
    option.innerHTML = course.display;
    courseSelect.appendChild(option);
  }
}

async function submitNewLog() {
  const courseSelect = document.getElementById('course');
  const classId = courseSelect.options[courseSelect.selectedIndex].value;
  const studentId = document.getElementById('uvuId').value;
  const logText = document.getElementById('addLogTextarea').value;
  const date = new Date();
  const dateString = date.toLocaleString();

  await createLog(classId, studentId, logText, dateString);
}

async function createLog(classId, studentId, logText, date) {
  const request = new Request('/api/v1/logs', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      courseId: classId,
      uvuId: studentId,
      text: logText,
      date: date,
    }),
  });

  const response = await fetch(request);
  if (response.status == 201) {
    const courseSel = document.getElementById('course');
    const courseId = courseSel.options[courseSel.selectedIndex].value;
    const uvuId = document.getElementById('uvuId').value;
    await getStudentLogs(courseId, uvuId);
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
    {
      method: 'GET',
    }
  );
  const response = await fetch(request);
  if (response.status == 200 || response.status == 304) {
    //update
    const data = await response.json();
    document.getElementById('uvuIdDisplay').innerHTML =
      'Student Logs for ' + uvuId;
    const parent = document.getElementById('logs');
    parent.innerHTML = '';
    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      const li = document.createElement('li');
      const div = document.createElement('div');
      const pre = document.createElement('pre');
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

function toggleLog() {
  const pre = this.querySelector('pre');
  pre.classList.toggle('d-none');
}

function enableAddLogBtn() {
  const logTextLength = document.getElementById('addLogTextarea').value.length;
  const courseSelected = document.getElementById('course').selectedIndex > 0;
  const userIdEntered = document.getElementById('uvuId').value.length == 8;
  const addLogBtn = document.getElementById('addLogBtn');
  if (courseSelected && userIdEntered && logTextLength > 0) {
    addLogBtn.removeAttribute('disabled');
  } else {
    addLogBtn.setAttribute('disabled', true);
  }
}
