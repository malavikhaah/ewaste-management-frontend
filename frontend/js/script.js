console.log("Script Loaded");

/* ================================
   REGISTER FORM  → CALL BACKEND
================================ */

const registerForm = document.getElementById("registerForm");

if (registerForm) {

  registerForm.addEventListener("submit", function (e) {

    e.preventDefault();

    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const phone = document.getElementById("phone").value;
    const password = document.getElementById("password").value;
    const confirmPassword =
      document.getElementById("confirmPassword").value;

    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    fetch("http://localhost:8080/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: name,
        email: email,
        phone: phone,
        password: password
      })
    })
    .then(res => res.json())
    .then(data => {
      alert("Registration successful! OTP sent to email.");
      localStorage.setItem("email", email); // store for OTP verify
      window.location.href = "otp.html";
    })
    .catch(err => {
      console.error(err);
      alert("Error registering user.");
    });

  });

}


/* ================================
   OTP VERIFICATION → BACKEND
================================ */

const otpForm = document.getElementById("otpForm");

if (otpForm) {

  otpForm.addEventListener("submit", function (e) {

    e.preventDefault();

    const otp = document.getElementById("otp").value;
    const email = localStorage.getItem("email");

    if (!otp) {
      alert("Please enter OTP");
      return;
    }

    fetch("http://localhost:8080/api/auth/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: email,
        otp: otp
      })
    })
    .then(res => res.json())
    .then(data => {
      alert("OTP Verified Successfully!");
      window.location.href = "login.html";
    })
    .catch(err => {
      console.error(err);
      alert("Invalid OTP");
    });

  });

}


/* ================================
   LOGIN FORM → BACKEND JWT
================================ */

const loginForm = document.getElementById("loginForm");

if (loginForm) {

  loginForm.addEventListener("submit", function (e) {

    e.preventDefault();

    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    if (!email || !password) {
      alert("Please fill all fields");
      return;
    }

    fetch("http://localhost:8080/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: email,
        password: password
      })
    })
    .then(res => res.json())
    .then(data => {

      // Store JWT token
      localStorage.setItem("token", data.token);

      alert("Login Successful!");
      window.location.href = "dashboard.html";
    })
    .catch(err => {
      console.error(err);
      alert("Invalid credentials");
    });

  });

}


/* ================================
   DASHBOARD AUTH CHECK
================================ */

if (window.location.pathname.includes("dashboard.html")) {

  const token = localStorage.getItem("token");

  if (!token) {
    alert("Please login first");
    window.location.href = "login.html";
  }

}


/* ================================
   LOAD PROFILE DATA → BACKEND
================================ */

if (window.location.pathname.includes("profile.html")) {

  const token = localStorage.getItem("token");

  fetch("http://localhost:8080/api/profile", {
    method: "GET",
    headers: {
      "Authorization": "Bearer " + token
    }
  })
  .then(res => res.json())
  .then(data => {

    document.getElementById("profileName").value = data.name;
    document.getElementById("profileEmail").value = data.email;
    document.getElementById("profilePhone").value = data.phone;

  })
  .catch(err => {
    console.error(err);
  });

}


/* ================================
   UPDATE PROFILE → BACKEND
================================ */

const profileForm = document.getElementById("profileForm");

if (profileForm) {

  profileForm.addEventListener("submit", function (e) {

    e.preventDefault();

    const token = localStorage.getItem("token");

    const name = document.getElementById("profileName").value;
    const phone = document.getElementById("profilePhone").value;

    fetch("http://localhost:8080/api/profile/update", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify({
        name: name,
        phone: phone
      })
    })
    .then(res => res.json())
    .then(data => {
      alert("Profile Updated Successfully!");
    })
    .catch(err => {
      console.error(err);
      alert("Error updating profile");
    });

  });

}
