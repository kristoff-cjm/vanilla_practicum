"use strict";

function toggleTheme() {
  const html = document.querySelector('html');
  const theme = html.dataset.bsTheme;
  if (theme == 'light') {
    html.dataset.bsTheme = 'dark';
  } else if (theme == 'dark') {
    html.dataset.bsTheme = 'light';
  } else {
    html.dataset.bsTheme = 'dark';
  }
}

async function authFetch(request) {
  try {
    const response = await fetch(request);

    if (response.status === 401) {
      throw new Error("Unauthorized");
    }

    if (response.ok) {
      return response;
    }

    throw new Error("Unauthorized or invalid content type");

  } catch (err) {
    console.warn("authFetch failed:", err.message);
    try {
      const loginResponse = await fetch("/login");
      const loginHtml = await loginResponse.text();
      document.documentElement.innerHTML = loginHtml;
    } catch (e) {
      console.error("Failed to load login page:", e);
      alert("Authentication failed and login page could not be loaded.");
    }
    throw new Error("Authentication required");
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
