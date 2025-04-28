"use strict";

async function getTenantInfo(){
  try {
    const request = new Request('/api/v1/tenantInfo', { method: 'GET' });
    const response = await authFetch(request);
    const data = await response.json();
    var tenant = data.tenant;
  } catch (e) {
    return null;
  }
  
  if(tenant.id == "1"){
    //uvu
    tenant.favicon = "https://www.uvu.edu/favicon.ico";
    tenant.image = "/images/uvu_monogram.png";
  }else if(tenant.id == "2"){
    //uofu
    tenant.favicon = "https://brand.utah.edu/wp-content/themes/umctheme3/favicon-32x32.png";
    tenant.image = "/images/uofu_monogram.png";
  }
  
  const image = document.createElement("img");
  image.src = tenant.image;
  image.height = 100;
  const themeDiv = document.getElementById("tenantTheme");
  themeDiv.appendChild(image);
  document.getElementById("favicon").href = tenant.favicon;
}

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

    if(response.status === 404){
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
