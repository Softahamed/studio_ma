// 🟢 Run logic after DOM is ready
window.addEventListener("DOMContentLoaded", () => {
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("cameraDate").min = today;
  document.getElementById("onlineDate").min = today;

  document.getElementById("cameraDate").addEventListener("change", (e) => {
    loadCameraTimeSlots(e.target.value);
  });

  document.getElementById("onlineDate").addEventListener("change", () => {
    const dur = parseInt(document.getElementById("onlineDuration").value);
    if (dur) loadOnlineStartTimes(document.getElementById("onlineDate").value, dur);
  });

  document.getElementById("onlineDuration").addEventListener("change", () => {
    const dur = parseInt(document.getElementById("onlineDuration").value);
    const date = document.getElementById("onlineDate").value;
    if (date) loadOnlineStartTimes(date, dur);
  });
});

// 🕒 Load available time options
function generateHourOptions(startHour, endHour) {
  const hours = [];
  for (let h = startHour; h < endHour; h++) {
    hours.push(`${h.toString().padStart(2, "0")}:00`);
  }
  return hours;
}

// 📷 Camera Studio: Load dynamic time slots
function loadCameraTimeSlots(date) {
  const booked = [];
  for (let key in localStorage) {
    if (key.startsWith("booking_")) {
      const b = JSON.parse(localStorage.getItem(key));
      if (b.studio === "Camera Studio" && b.date === date) {
        const [startH, endH] = b.time.split(" - ").map(t => parseInt(t));
        for (let h = startH; h < endH; h++) {
          booked.push(h);
        }
      }
    }
  }

  const startSel = document.getElementById("cameraStart");
  const endSel = document.getElementById("cameraEnd");
  startSel.innerHTML = "";
  endSel.innerHTML = "";

  const startOptions = generateHourOptions(8, 20);
  startOptions.forEach(t => {
    const h = parseInt(t.split(":")[0]);
    if (!booked.includes(h)) {
      startSel.add(new Option(t, t));
    }
  });

  // 📍 Update end times based on selected start
  startSel.addEventListener("change", () => {
    const selectedStart = parseInt(startSel.value.split(":")[0]);
    endSel.innerHTML = "";

    for (let h = selectedStart + 1; h <= 20; h++) {
      let conflict = false;
      for (let i = selectedStart; i < h; i++) {
        if (booked.includes(i)) {
          conflict = true;
          break;
        }
      }
      if (!conflict) {
        const t = `${h.toString().padStart(2, "0")}:00`;
        endSel.add(new Option(t, t));
      }
    }
  });

  // Trigger initial end time update
  if (startSel.options.length > 0) {
    startSel.dispatchEvent(new Event("change"));
  }
}

// 💻 Online Class Studio: Load fixed duration slots
function loadOnlineStartTimes(date, duration) {
  const blocked = [];
  for (let key in localStorage) {
    if (key.startsWith("booking_")) {
      const b = JSON.parse(localStorage.getItem(key));
      if (b.studio === "Online Class Studio" && b.date === date) {
        const [startH, endH] = b.time.split(" - ").map(t => parseInt(t));
        for (let h = startH; h < endH; h++) {
          blocked.push(h);
        }
      }
    }
  }

  const startSel = document.getElementById("onlineStart");
  startSel.innerHTML = "";

  for (let h = 8; h <= 20 - duration; h++) {
    let conflict = false;
    for (let i = h; i < h + duration; i++) {
      if (blocked.includes(i)) {
        conflict = true;
        break;
      }
    }
    if (!conflict) {
      const t = `${h.toString().padStart(2, "0")}:00`;
      startSel.add(new Option(t, t));
    }
  }
}

// 🚀 Unified booking function
function bookStudio(e, studioType) {
  e.preventDefault();
  const user = localStorage.getItem("rememberUser") || "Guest";
  let date, start, end;

  if (studioType === "Camera Studio") {
    date = document.getElementById("cameraDate").value;
    start = document.getElementById("cameraStart").value;
    end = document.getElementById("cameraEnd").value;

    if (!start || !end || parseInt(end) <= parseInt(start)) {
      alert("❌ Invalid start or end time.");
      return;
    }
  } else {
    date = document.getElementById("onlineDate").value;
    const duration = parseInt(document.getElementById("onlineDuration").value);
    start = document.getElementById("onlineStart").value;
    if (!duration || !start) {
      alert("❌ Select valid duration and time.");
      return;
    }
    end = `${(parseInt(start) + duration).toString().padStart(2, "0")}:00`;
  }

  const notes = e.target.querySelector("textarea").value;
  if (hasConflict(studioType, date, start, end)) {
    alert("⚠️ Conflict! Time slot already booked.");
    return;
  }

  const booking = {
    user,
    studio: studioType,
    date,
    time: `${start} - ${end}`,
    notes,
    id: "BOOK" + Math.floor(Math.random() * 100000)
  };

  localStorage.setItem(`booking_${booking.id}`, JSON.stringify(booking));
  localStorage.setItem("latestBookingID", booking.id);

  alert(`✅ ${studioType} booked!\n${date}, ${start} - ${end}`);
  window.location.href = "booking.html";
}

// 🧠 Conflict checker
function hasConflict(studioType, date, start, end) {
  const reqStart = parseInt(start.split(":")[0]);
  const reqEnd = parseInt(end.split(":")[0]);

  for (let key in localStorage) {
    if (key.startsWith("booking_")) {
      const b = JSON.parse(localStorage.getItem(key));
      if (b.studio === studioType && b.date === date) {
        const [bStart, bEnd] = b.time.split(" - ").map(t => parseInt(t));
        if (reqStart < bEnd && reqEnd > bStart) return true;
      }
    }
  }
  return false;
}