const calendar = document.getElementById('moodCalendar');
const moodModal = document.getElementById('moodModal');
const moodOptions = document.getElementById('moodOptions');
const monthSelect = document.getElementById('monthSelect');
const yearSelect = document.getElementById('yearSelect');
const moodSummary = document.getElementById('moodSummary');

let selectedDate = null;
let moodData = JSON.parse(localStorage.getItem('moodData')) || {};

const monthNames = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];

function populateDropdowns() {
  const now = new Date();
  const thisYear = now.getFullYear();

  for (let i = thisYear - 5; i <= thisYear + 5; i++) {
    const option = document.createElement("option");
    option.value = i;
    option.text = i;
    if (i === thisYear) option.selected = true;
    yearSelect.appendChild(option);
  }

  monthNames.forEach((month, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.text = month;
    if (index === now.getMonth()) option.selected = true;
    monthSelect.appendChild(option);
  });
}

function renderCalendar(year, month) {
  calendar.innerHTML = '';
  for (let day = 1; day <= 31; day++) {
    const dateStr = `${year}-${month + 1}-${day}`;
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.dataset.date = dateStr;

    const dateLabel = document.createElement('div');
    dateLabel.className = 'date';
    dateLabel.innerText = day;
    cell.appendChild(dateLabel);

    if (moodData[dateStr]) {
      const moodEl = document.createElement('div');
      moodEl.className = 'mood';
      moodEl.innerText = moodData[dateStr];
      cell.appendChild(moodEl);
    }

    cell.onclick = () => {
      selectedDate = dateStr;
      moodModal.style.display = 'block';
    };

    calendar.appendChild(cell);
  }

  updateSummary(year, month);
}

function updateSummary(year, month) {
  const summary = {};
  for (let day = 1; day <= 31; day++) {
    const key = `${year}-${month + 1}-${day}`;
    if (moodData[key]) {
      const mood = moodData[key];
      summary[mood] = (summary[mood] || 0) + 1;
    }
  }

  moodSummary.innerHTML = '';
  const emojis = Object.keys(summary);
  if (emojis.length === 0) {
    moodSummary.innerHTML = "<p>Belum ada mood tercatat.</p>";
    document.getElementById('graniteText').innerText = "Tambahkan data mood agar saran bisa dibuat.";
    return;
  }

  emojis.forEach(mood => {
    const div = document.createElement("div");
    div.className = "mood-count";
    div.innerHTML = `${mood} × ${summary[mood]}`;
    moodSummary.appendChild(div);
  });

  getGraniteAdvice(summary);
}

async function getGraniteAdvice(summary) {
  const prompt = `Berdasarkan data mood bulanan berikut: ${JSON.stringify(summary)}, berikan saran singkat dan empatik seolah kamu adalah asisten AI yang bijak.`;

  const response = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      "Authorization": "Bearer r8_J7qXXXXXXXXXXXXXXXXXXXXXXXXXXX", // GANTI token
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      version: "37acb9ec1b572e8f41e177c6f2c7dd6f8ef6a222ffb95cf8b348249d7d18c6a5",
      input: { prompt }
    })
  });

  const prediction = await response.json();
  if (prediction?.urls?.get) {
    let output = null;
    while (!output) {
      const poll = await fetch(prediction.urls.get, {
        headers: { "Authorization": "Bearer r8_J7qXXXXXXXXXXXXXXXXXXXXXXXXXXX" }
      }).then(r => r.json());

      if (poll.status === "succeeded") {
        output = poll.output;
        break;
      } else if (poll.status === "failed") {
        document.getElementById('graniteText').innerText = "❌ Model gagal merespons.";
        return;
      }

      await new Promise(r => setTimeout(r, 1000));
    }
    document.getElementById('graniteText').innerText = output;
  } else {
    document.getElementById('graniteText').innerText = "❌ Tidak bisa menghubungi Granite.";
  }
}

moodOptions.addEventListener('click', (e) => {
  if (e.target.dataset.mood && selectedDate) {
    moodData[selectedDate] = e.target.dataset.mood;
    localStorage.setItem('moodData', JSON.stringify(moodData));
    closeMoodModal();
    renderCalendar(parseInt(yearSelect.value), parseInt(monthSelect.value));
  }
});

function closeMoodModal() {
  moodModal.style.display = 'none';
  selectedDate = null;
}

window.onclick = (event) => {
  if (event.target == moodModal) closeMoodModal();
};

monthSelect.onchange = yearSelect.onchange = () => {
  renderCalendar(parseInt(yearSelect.value), parseInt(monthSelect.value));
};

populateDropdowns();
renderCalendar(new Date().getFullYear(), new Date().getMonth());
