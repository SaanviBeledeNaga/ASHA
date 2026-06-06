// Inject animation styles dynamically to highlight filled elements on any website
const style = document.createElement("style");
style.textContent = `
  .autofill-highlight-pulse {
    animation: asha-autofill-flash 1.8s ease-in-out !important;
  }
  @keyframes asha-autofill-flash {
    0% {
      border-color: #06B6D4 !important;
      box-shadow: 0 0 15px rgba(6, 182, 212, 0.8) !important;
      background-color: rgba(6, 182, 212, 0.15) !important;
    }
    50% {
      border-color: #7C3AED !important;
      box-shadow: 0 0 15px rgba(124, 58, 237, 0.8) !important;
      background-color: rgba(124, 58, 237, 0.15) !important;
    }
    100% {
      border-color: inherit;
      box-shadow: inherit;
      background-color: inherit;
    }
  }
`;
document.head.appendChild(style);

// Helper function to get text inside matching labels, checking ARIA and container tags for Google Forms compatibility
function getAssociatedLabelText(element) {
  // 1. Check standard <label> elements
  if (element.id) {
    const label = document.querySelector(`label[for="${element.id}"]`);
    if (label) return label.innerText;
  }
  const parentLabel = element.closest("label");
  if (parentLabel) return parentLabel.innerText;
  
  // 2. Check aria-label directly on input
  const ariaLabel = element.getAttribute("aria-label");
  if (ariaLabel) return ariaLabel;

  const ariaLabelledBy = element.getAttribute("aria-labelledby");
  if (ariaLabelledBy) {
    const labelledByEl = document.getElementById(ariaLabelledBy);
    if (labelledByEl) return labelledByEl.innerText;
  }

  // 3. Custom forms/Google Forms traversal: look at ancestor titles
  let parent = element.parentElement;
  for (let i = 0; i < 5 && parent; i++) {
    const titleElements = parent.querySelectorAll('.M7eMe, [role="heading"], div, span');
    for (const title of titleElements) {
      if (title !== element && title.innerText && title.innerText.trim().length < 80) {
        const text = title.innerText.trim();
        if (text && !text.includes(element.value)) {
          return text;
        }
      }
    }
    parent = parent.parentElement;
  }

  // 4. Sibling traversal fallback
  let prev = element.previousElementSibling;
  while (prev) {
    if (prev.tagName === "LABEL" || prev.innerText) return prev.innerText;
    prev = prev.previousElementSibling;
  }
  return "";
}

// Find input, select, or textarea by keywords in its attributes or label text
function findField(keywords) {
  const elements = document.querySelectorAll('input[type="text"], input:not([type]), select, textarea, [role="textbox"]');
  for (const el of elements) {
    const id = (el.id || "").toLowerCase();
    const name = (el.name || "").toLowerCase();
    const placeholder = (el.getAttribute("placeholder") || "").toLowerCase();
    const ariaLabel = (el.getAttribute("aria-label") || "").toLowerCase();
    const labelText = getAssociatedLabelText(el).toLowerCase();
    
    for (const keyword of keywords) {
      if (
        id.includes(keyword) || 
        name.includes(keyword) || 
        placeholder.includes(keyword) ||
        ariaLabel.includes(keyword) ||
        labelText.includes(keyword)
      ) {
        return el;
      }
    }
  }
  return null;
}

// Listen for messages from popup.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "autofill" && request.profile) {
    const profile = request.profile;

    // Define search keyword lists for each data field
    const matchRules = [
      {
        field: "name",
        keywords: ["name", "full_name", "fullname", "first_name", "beneficiary", "worker", "user"],
        value: profile.name
      },
      {
        field: "dob",
        keywords: ["dob", "birth", "birthdate", "date_of_birth", "birth_date", "date"],
        value: profile.dob
      },
      {
        field: "aadhaar",
        keywords: ["aadhaar", "aadhar", "uid", "unique", "national_id", "identity", "card_number", "id_number"],
        value: profile.aadhaar
      },
      {
        field: "address",
        keywords: ["address", "addr", "residence", "village", "city", "location", "full_address"],
        value: profile.address
      }
    ];

    let filledCount = 0;

    // Process general text inputs & selects
    matchRules.forEach(rule => {
      const fieldEl = findField(rule.keywords);
      if (fieldEl) {
        if (fieldEl.tagName === "SELECT") {
          const normVal = rule.value.toUpperCase();
          for (let i = 0; i < fieldEl.options.length; i++) {
            const optVal = fieldEl.options[i].value.toUpperCase();
            const optText = fieldEl.options[i].text.toUpperCase();
            if (optVal.includes(normVal) || normVal.includes(optVal) || optText.includes(normVal) || normVal.includes(optText)) {
              fieldEl.selectedIndex = i;
              break;
            }
          }
        } else {
          fieldEl.value = rule.value;
        }

        // Trigger change & input events so frameworks like React/Angular track input changes
        fieldEl.dispatchEvent(new Event("input", { bubbles: true }));
        fieldEl.dispatchEvent(new Event("change", { bubbles: true }));
        
        // Visual feedback animation
        fieldEl.classList.add("autofill-highlight-pulse");
        setTimeout(() => {
          fieldEl.classList.remove("autofill-highlight-pulse");
        }, 2000);

        filledCount++;
      }
    });

    // Special handling for Gender field (which could be radio buttons or select dropdown)
    const genderField = findField(["gender", "sex", "gender_type"]);
    if (genderField && genderField.tagName === "SELECT") {
      const normVal = profile.gender.toUpperCase();
      for (let i = 0; i < genderField.options.length; i++) {
        const optVal = genderField.options[i].value.toUpperCase();
        const optText = genderField.options[i].text.toUpperCase();
        if (optVal.includes(normVal) || normVal.includes(optVal) || optText.includes(normVal) || normVal.includes(optText)) {
          genderField.selectedIndex = i;
          genderField.dispatchEvent(new Event("change", { bubbles: true }));
          genderField.dispatchEvent(new Event("input", { bubbles: true }));
          genderField.classList.add("autofill-highlight-pulse");
          setTimeout(() => {
            genderField.classList.remove("autofill-highlight-pulse");
          }, 2000);
          filledCount++;
          break;
        }
      }
    } else {
      // Look for radio buttons matching gender text values (native or custom elements)
      const radios = document.querySelectorAll('input[type="radio"], [role="radio"]');
      const normVal = profile.gender.toUpperCase();
      radios.forEach(radio => {
        const val = (radio.value || radio.getAttribute("value") || radio.getAttribute("data-value") || "").toUpperCase();
        const labelText = (radio.getAttribute("aria-label") || getAssociatedLabelText(radio) || "").toUpperCase();
        if (val.includes(normVal) || normVal.includes(val) || labelText.includes(normVal)) {
          if (radio.tagName === "INPUT") {
            radio.checked = true;
            radio.dispatchEvent(new Event("change", { bubbles: true }));
            radio.dispatchEvent(new Event("input", { bubbles: true }));
          } else {
            // Click custom div elements directly (like Google Forms' role="radio" container)
            radio.click();
          }

          // Visual feedback animation
          radio.classList.add("autofill-highlight-pulse");
          setTimeout(() => {
            radio.classList.remove("autofill-highlight-pulse");
          }, 2000);

          filledCount++;
        }
      });
    }

    sendResponse({ success: true, count: filledCount });
  }
});
