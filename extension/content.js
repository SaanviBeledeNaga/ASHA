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

// Diagnostic Logger
function logDebug(msg, data) {
  const logStr = `[Content] ${msg}` + (data ? ` : ${typeof data === 'object' ? JSON.stringify(data) : data}` : '');
  console.log(logStr);
  if (!window.ashaAutofillLogs) {
    window.ashaAutofillLogs = [];
  }
  window.ashaAutofillLogs.push(logStr);
}

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

// Scan page for fillable fields and assign a unique tracking ID
let fieldCounter = 0;
function scanPageFields() {
  const elements = document.querySelectorAll(
    'input[type="text"], input[type="date"], input[type="number"], input[type="email"], input[type="tel"], input[type="radio"], input:not([type]), select, textarea, [role="textbox"], [role="radio"]'
  );
  
  const scanned = [];
  elements.forEach((el) => {
    // 1. Skip elements that are explicitly hidden in the computed style
    try {
      const style = window.getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden" || el.type === "hidden") {
        return;
      }
    } catch (e) {}
    
    // 2. Skip native radio inputs nested inside custom role="radio" wrapper containers
    if (el.tagName === "INPUT" && el.type === "radio" && el.closest('[role="radio"]')) {
      return;
    }
    
    // Assign unique field ID if not present
    let id = el.getAttribute("data-asha-field-id");
    if (!id) {
      id = `asha-field-${fieldCounter++}`;
      el.setAttribute("data-asha-field-id", id);
    }
    
    const labelText = getAssociatedLabelText(el);
    const placeholder = el.getAttribute("placeholder") || "";
    const nameAttr = el.getAttribute("name") || "";
    const typeAttr = el.getAttribute("type") || (el.getAttribute("role") === "radio" ? "radio" : el.tagName.toLowerCase());
    const ariaLabel = el.getAttribute("aria-label") || "";

    scanned.push({
      asha_id: id,
      id: el.id || "",
      name: nameAttr,
      type: typeAttr,
      placeholder: placeholder,
      aria_label: ariaLabel,
      label_text: labelText
    });
  });
  
  return scanned;
}

// Listen for messages from popup.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getLogs") {
    sendResponse({ success: true, logs: window.ashaAutofillLogs || [] });
    return;
  }
  
  // Reset logs for new transaction
  window.ashaAutofillLogs = [];
  logDebug(`Received message action: ${request.action}`);
  
  if (request.action === "scanFields") {
    const fields = scanPageFields();
    logDebug(`Scan complete. Scanned elements count: ${fields.length}`);
    sendResponse({ success: true, fields: fields });
  } else if (request.action === "fillFields" && request.mappings && request.profile) {
    const { mappings, profile } = request;
    let filledCount = 0;
    
    logDebug("Starting fill iteration...");
    
    mappings.forEach(map => {
      if (!map.mapped_field || map.confidence < 0.4) {
        logDebug(`Skipped map: field [${map.mapped_field}] confidence too low (${map.confidence})`);
        return;
      }
      
      const el = document.querySelector(`[data-asha-field-id="${map.asha_id}"]`);
      if (!el) {
        logDebug(`Element not found in DOM for id: ${map.asha_id}`);
        return;
      }
      
      const value = profile[map.mapped_field];
      if (!value) {
        logDebug(`No value in active profile for mapped key: ${map.mapped_field}`);
        return;
      }
      
      logDebug(`Attempting to fill element [${map.asha_id}] mapped to [${map.mapped_field}] with value: ${value}`);
      
      // Perform element-specific fill
      try {
        el.focus();
        
        const type = (el.getAttribute("type") || el.getAttribute("role") || el.tagName).toLowerCase();
        
        if (type === "radio" || el.type === "radio") {
          // Handle radio button selection
          const val = el.value || el.getAttribute("value") || el.getAttribute("data-value") || "";
          const labelText = el.getAttribute("aria-label") || getAssociatedLabelText(el) || "";
          const normVal = value.trim();
          
          // Exact word boundary matching to prevent "MALE" matching "FEMALE"
          const regex = new RegExp(`\\b${normVal}\\b`, 'i');
          
          if (regex.test(val) || regex.test(labelText)) {
            logDebug(`Matching radio option found. Clicking radio element.`);
            if (el.tagName === "INPUT") {
              el.checked = true;
              el.dispatchEvent(new Event("change", { bubbles: true }));
              el.dispatchEvent(new Event("input", { bubbles: true }));
            } else {
              el.click();
            }
            filledCount++;
          } else {
            logDebug(`Radio option "${val}" / "${labelText}" did not match target "${normVal}"`);
          }
        } else if (el.tagName === "SELECT") {
          // Handle select element
          const normVal = value.toUpperCase();
          let matched = false;
          for (let i = 0; i < el.options.length; i++) {
            const optVal = el.options[i].value.toUpperCase();
            const optText = el.options[i].text.toUpperCase();
            if (optVal.includes(normVal) || normVal.includes(optVal) || optText.includes(normVal) || normVal.includes(optText)) {
              el.selectedIndex = i;
              el.dispatchEvent(new Event("change", { bubbles: true }));
              el.dispatchEvent(new Event("input", { bubbles: true }));
              filledCount++;
              matched = true;
              logDebug(`Selected option at index ${i}`);
              break;
            }
          }
          if (!matched) {
            logDebug(`No matching SELECT option found for: ${normVal}`);
          }
        } else if (el.type === "date" || type === "date") {
          // Handle date input (format to ISO YYYY-MM-DD)
          const isoDate = formatToISODate(value);
          el.value = isoDate;
          el.dispatchEvent(new Event("input", { bubbles: true }));
          el.dispatchEvent(new Event("change", { bubbles: true }));
          filledCount++;
          logDebug(`Set date input to: ${isoDate}`);
        } else {
          // Handle general text inputs, textareas, and contenteditable elements
          if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
            el.value = value;
            logDebug(`Set standard input/textarea value to: ${value}`);
          } else if (el.isContentEditable || el.getAttribute("contenteditable") === "true") {
            el.innerText = value;
            el.innerHTML = value;
            logDebug(`Set contenteditable innerText to: ${value}`);
          } else {
            // Fallback for divs with role="textbox"
            el.value = value;
            el.innerText = value;
            logDebug(`Set fallback element value/innerText to: ${value}`);
          }
          el.dispatchEvent(new Event("input", { bubbles: true }));
          el.dispatchEvent(new Event("change", { bubbles: true }));
          filledCount++;
        }
        
        el.blur();
        
        // Flash highlight animation
        el.classList.add("autofill-highlight-pulse");
        setTimeout(() => {
          el.classList.remove("autofill-highlight-pulse");
        }, 2000);
      } catch (err) {
        logDebug(`Exception occurred while filling element: ${err.message}`);
      }
    });
    
    logDebug(`Fill complete. Successfully populated ${filledCount} elements.`);
    sendResponse({ success: true, count: filledCount });
  }
});
