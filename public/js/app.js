const STORAGE_KEY = "bookingFormData";
const PHONE_PATTERN = /^(05|5)[0-9]{8}$/;

const form = document.getElementById("bookingForm");
const success = document.getElementById("success");
const ticket = document.getElementById("ticket");
const submitBtn = document.getElementById("submitBtn");
const lastUpdated = document.getElementById("lastUpdated");
const peopleInput = document.getElementById("number_of_people");

const fields = {
  customer_name: document.getElementById("customer_name"),
  phone_number: document.getElementById("phone_number"),
  number_of_people: peopleInput,
  boys_or_families: () => form.querySelector('input[name="boys_or_families"]:checked'),
  internal_or_external: () => form.querySelector('input[name="internal_or_external"]:checked'),
  flexCheckDefault: document.getElementById("flexCheckDefault"),
};

function setUpdated() {
  lastUpdated.textContent = `آخر تحديث | Last updated: ${new Date().toLocaleTimeString()}`;
}

function saveFormData() {
  const party = fields.boys_or_families();
  const place = fields.internal_or_external();
  const data = {
    customer_name: fields.customer_name.value,
    phone_number: fields.phone_number.value,
    number_of_people: fields.number_of_people.value,
    boys_or_families: party ? party.value : "",
    internal_or_external: place ? place.value : "",
    flexCheckDefault: fields.flexCheckDefault.checked,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function restoreFormData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    const data = JSON.parse(raw);
    if (data.customer_name) fields.customer_name.value = data.customer_name;
    if (data.phone_number) fields.phone_number.value = data.phone_number;
    if (data.number_of_people) fields.number_of_people.value = data.number_of_people;
    if (data.boys_or_families) {
      const radio = form.querySelector(`input[name="boys_or_families"][value="${data.boys_or_families}"]`);
      if (radio) radio.checked = true;
    }
    if (data.internal_or_external) {
      const radio = form.querySelector(`input[name="internal_or_external"][value="${data.internal_or_external}"]`);
      if (radio) radio.checked = true;
    }
    if (data.flexCheckDefault) fields.flexCheckDefault.checked = true;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function setError(name, message) {
  const node = document.querySelector(`[data-error-for="${name}"]`);
  if (node) node.textContent = message || "";
  const wrap =
    name === "boys_or_families" || name === "internal_or_external"
      ? document.querySelector(`input[name="${name}"]`)?.closest("fieldset")
      : name === "flexCheckDefault"
        ? fields.flexCheckDefault.closest("label")
        : fields[name]?.closest(".field");
  wrap?.classList.toggle("is-invalid", Boolean(message));
}

function validate() {
  let ok = true;
  const name = fields.customer_name.value.trim();
  const phone = fields.phone_number.value.trim();
  const people = Number(fields.number_of_people.value);
  const party = fields.boys_or_families();
  const place = fields.internal_or_external();

  setError("customer_name", name ? "" : "هذا الحقل مطلوب | This field is required");
  if (!name) ok = false;

  if (!phone) {
    setError("phone_number", "هذا الحقل مطلوب | This field is required");
    ok = false;
  } else if (!PHONE_PATTERN.test(phone)) {
    setError("phone_number", "مثال: 0512345678");
    ok = false;
  } else {
    setError("phone_number", "");
  }

  if (!people || people < 1 || people > 5) {
    setError("number_of_people", "من 1 إلى 5 أشخاص | 1 to 5 guests");
    ok = false;
  } else {
    setError("number_of_people", "");
  }

  setError("boys_or_families", party ? "" : "اختر عوائل أو شباب | Choose Families or Guys");
  if (!party) ok = false;

  setError("internal_or_external", place ? "" : "اختر الموقع | Choose a location");
  if (!place) ok = false;

  setError(
    "flexCheckDefault",
    fields.flexCheckDefault.checked ? "" : "الموافقة مطلوبة | Agreement is required"
  );
  if (!fields.flexCheckDefault.checked) ok = false;

  return ok;
}

function bookingId() {
  const n = Math.floor(1000 + Math.random() * 9000);
  return `LAS-${n}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderTicket(data) {
  ticket.innerHTML = `
    <dl>
      <div><dt>رقم الحجز | Booking</dt><dd>${escapeHtml(data.id)}</dd></div>
      <div><dt>الإسم | Name</dt><dd>${escapeHtml(data.customer_name)}</dd></div>
      <div><dt>الجوال | Phone</dt><dd>${escapeHtml(data.phone_number)}</dd></div>
      <div><dt>عدد الأشخاص | People</dt><dd>${escapeHtml(data.number_of_people)}</dd></div>
      <div><dt>عوائل أو شباب</dt><dd>${escapeHtml(data.boys_or_families)}</dd></div>
      <div><dt>الموقع | Location</dt><dd>${escapeHtml(data.internal_or_external)}</dd></div>
    </dl>
  `;
}

function shiftPeople(delta) {
  const current = Number(peopleInput.value) || 0;
  const next = Math.min(5, Math.max(1, current + delta || 1));
  peopleInput.value = String(next);
  saveFormData();
}

document.getElementById("people-minus").addEventListener("click", () => shiftPeople(-1));
document.getElementById("people-plus").addEventListener("click", () => shiftPeople(1));

form.addEventListener("input", onFormEdit);
form.addEventListener("change", onFormEdit);

function onFormEdit() {
  saveFormData();
  document.querySelectorAll(".error").forEach((el) => (el.textContent = ""));
  document.querySelectorAll(".is-invalid").forEach((el) => el.classList.remove("is-invalid"));
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!validate()) {
    form.querySelector(".is-invalid, [required]:invalid")?.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }

  submitBtn.classList.add("is-loading");
  submitBtn.querySelector("span").textContent = "جاري الحجز...";

  const data = {
    id: bookingId(),
    customer_name: fields.customer_name.value.trim(),
    phone_number: fields.phone_number.value.trim(),
    number_of_people: fields.number_of_people.value,
    boys_or_families: fields.boys_or_families().value,
    internal_or_external: fields.internal_or_external().value,
    createdAt: new Date().toISOString(),
  };

  const bookings = JSON.parse(localStorage.getItem("lasBookings") || "[]");
  bookings.unshift(data);
  localStorage.setItem("lasBookings", JSON.stringify(bookings));
  localStorage.removeItem(STORAGE_KEY);

  await new Promise((resolve) => setTimeout(resolve, 650));
  renderTicket(data);
  form.hidden = true;
  document.querySelector(".stage-head").hidden = true;
  success.hidden = false;
  submitBtn.classList.remove("is-loading");
  submitBtn.querySelector("span").textContent = "احجز الآن | Book Now";
  window.scrollTo({ top: 0, behavior: "smooth" });
});

document.getElementById("newBooking").addEventListener("click", () => {
  form.reset();
  peopleInput.value = "";
  success.hidden = true;
  form.hidden = false;
  document.querySelector(".stage-head").hidden = false;
  document.querySelectorAll(".is-invalid").forEach((el) => el.classList.remove("is-invalid"));
  document.querySelectorAll(".error").forEach((el) => (el.textContent = ""));
});

restoreFormData();
setUpdated();
setInterval(setUpdated, 1000);
