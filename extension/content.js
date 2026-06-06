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

// Helper to format date string to ISO format YYYY-MM-DD required by HTML5 date inputs
function formatToISODate(dateStr) {
  if (!dateStr) return "";
  
  // Try parsing DD/MM/YYYY
  const parts = dateStr.split("/");
  if (parts.length === 3) {
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2];
    return `${year}-${month}-${day}`;
  }
  
  // Try parsing YYYY-MM-DD
  const isoParts = dateStr.split("-");
  if (isoParts.length === 3 && isoParts[0].length === 4) {
    return dateStr;
  }
  
  return dateStr;
}

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

  // Check aria-labelledby: can contain multiple space-separated IDs (common in Google Forms)
  const ariaLabelledBy = element.getAttribute("aria-labelledby");
  if (ariaLabelledBy) {
    const ids = ariaLabelledBy.trim().split(/\s+/);
    const labelTexts = ids.map(id => {
      const el = document.getElementById(id);
      return el ? el.innerText.trim() : "";
    }).filter(t => t);
    if (labelTexts.length > 0) {
      return labelTexts.join(" ");
    }
  }

  // 3. Custom forms/Google Forms traversal: look at ancestor titles
  let parent = element.parentElement;
  for (let i = 0; i < 5 && parent; i++) {
    // Check specific question title classes/roles used in Google Forms or standard frameworks
    const titleEl = parent.querySelector('.M7eMe, [role="heading"], .freebirdFormviewerComponentsQuestionBaseTitle');
    if (titleEl && titleEl.innerText && titleEl.innerText.trim().length < 150) {
      return titleEl.innerText.trim();
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
  // Select all possible input fields, including modern types like date/number/email/tel
  const elements = document.querySelectorAll(
    'input[type="text"], input[type="date"], input[type="number"], input[type="email"], input[type="tel"], input:not([type]), select, textarea, [role="textbox"]'
  );
  
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
        console.log(`Matched keyword "${keyword}" to element:`, el, `Label found: "${labelText}"`);
        return el;
      }
    }
  }
  return null;
}

// Listen for messages from popup.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("ASHA Copilot content script received message:", request);
  
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
        console.log(`Filling field [${rule.field}] with value: ${rule.value}`);
        
        // Focus to trigger SPA activation state
        fieldEl.focus();
        
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
        } else if (fieldEl.tagName === "INPUT" && fieldEl.type === "date") {
          fieldEl.value = formatToISODate(rule.value);
        } else {
          fieldEl.value = rule.value;
        }

        // Trigger change & input events so frameworks like React/Angular/Wiz track input changes
        fieldEl.dispatchEvent(new Event("input", { bubbles: true }));
        fieldEl.dispatchEvent(new Event("change", { bubbles: true }));
        
        // Blur to complete the focus-fill-blur cycle
        fieldEl.blur();
        
        // Visual feedback animation
        fieldEl.classList.add("autofill-highlight-pulse");
        setTimeout(() => {
          fieldEl.classList.remove("autofill-highlight-pulse");
        }, 2000);

        filledCount++;
      } else {
        console.warn(`Could not find field matching rule [${rule.field}] with keywords:`, rule.keywords);
      }
    });

    // Special handling for Gender field (which could be radio buttons or select dropdown)
    const genderField = findField(["gender", "sex", "gender_type"]);
    if (genderField && genderField.tagName === "SELECT") {
      console.log("Filling Gender via SELECT dropdown");
      genderField.focus();
      const normVal = profile.gender.toUpperCase();
      for (let i = 0; i < genderField.options.length; i++) {
        const optVal = genderField.options[i].value.toUpperCase();
        const optText = genderField.options[i].text.toUpperCase();
        if (optVal.includes(normVal) || normVal.includes(optVal) || optText.includes(normVal) || normVal.includes(optText)) {
          genderField.selectedIndex = i;
          genderField.dispatchEvent(new Event("change", { bubbles: true }));
          genderField.dispatchEvent(new Event("input", { bubbles: true }));
          genderField.blur();
          
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
      console.log("Looking for Gender via radio buttons");
      const radios = document.querySelectorAll('input[type="radio"], [role="radio"]');
      const normVal = profile.gender.toUpperCase();
      let genderFilled = false;
      
      radios.forEach(radio => {
        const val = (radio.value || radio.getAttribute("value") || radio.getAttribute("data-value") || "").toUpperCase();
        const labelText = (radio.getAttribute("aria-label") || getAssociatedLabelText(radio) || "").toUpperCase();
        
        if (val.includes(normVal) || normVal.includes(val) || labelText.includes(normVal)) {
          console.log("Matching gender radio option found:", radio, `Value: ${val}, Label: ${labelText}`);
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

          if (!genderFilled) {
            filledCount++;
            genderFilled = true;
          }
        }
      });
    }

    console.log(`Autofill completed. Filled ${filledCount} fields.`);
    sendResponse({ success: true, count: filledCount });
  }
});
