const DEFAULTS = {
  places: [],
  defaultIndex: 0,
  suffix: "UK",
  mode: "transit",
  when: "next",
  day: 1,
  time: "07:00",
  home: "" // legacy
};
const $ = (id) => document.getElementById(id);
const placesEl = $("places");

function addPlaceRow(place = { name: "", address: "" }, isDefault = false) {
  const row = document.createElement("div");
  row.className = "place";
  row.innerHTML = `
    <input type="radio" name="default" title="Default">
    <input class="name" placeholder="Name">
    <input class="addr" placeholder="Address or postcode">
    <button type="button" title="Remove">✕</button>`;
  row.querySelector(".name").value = place.name;
  row.querySelector(".addr").value = place.address;
  row.querySelector('input[type=radio]').checked = isDefault;
  row.querySelector("button").addEventListener("click", () => {
    const wasDefault = row.querySelector('input[type=radio]').checked;
    row.remove();
    if (wasDefault) {
      const first = placesEl.querySelector('input[type=radio]');
      if (first) first.checked = true;
    }
  });
  placesEl.appendChild(row);
  if (!placesEl.querySelector('input[type=radio]:checked')) {
    row.querySelector('input[type=radio]').checked = true;
  }
}

function syncEnabled() {
  const next = document.querySelector('input[name="when"]:checked')?.value === "next";
  $("day").disabled = !next;
  $("time").disabled = !next;
}

chrome.storage.local.get(DEFAULTS, (v) => {
  let places = v.places;
  if (!places.length && v.home) places = [{ name: "Home", address: v.home }];
  if (!places.length) places = [{ name: "Home", address: "" }];
  places.forEach((p, i) => addPlaceRow(p, i === v.defaultIndex));

  ["suffix", "mode", "day", "time"].forEach((f) => ($(f).value = String(v[f])));
  document.querySelector(`input[name="when"][value="${v.when}"]`).checked = true;
  syncEnabled();
});

$("addPlace").addEventListener("click", () => {
  addPlaceRow();
  placesEl.lastElementChild.querySelector(".name").focus();
});

document.querySelectorAll('input[name="when"]').forEach((r) =>
  r.addEventListener("change", syncEnabled)
);

$("save").addEventListener("click", () => {
  const rows = [...placesEl.querySelectorAll(".place")];
  const places = [];
  let defaultIndex = 0;
  rows.forEach((row) => {
    const name = row.querySelector(".name").value.trim();
    const address = row.querySelector(".addr").value.trim();
    if (!address) return; // skip empty rows
    if (row.querySelector('input[type=radio]').checked) defaultIndex = places.length;
    places.push({ name: name || address, address });
  });

  const data = {
    places,
    defaultIndex,
    suffix: $("suffix").value.trim(),
    mode: $("mode").value,
    when: document.querySelector('input[name="when"]:checked').value,
    day: Number($("day").value),
    time: $("time").value || "07:00"
  };
  chrome.storage.local.set(data, () => {
    chrome.storage.local.remove("home");
    $("status").textContent = places.length ? "Saved" : "Saved (add an address to use it)";
    setTimeout(() => ($("status").textContent = ""), 1500);
  });
});
