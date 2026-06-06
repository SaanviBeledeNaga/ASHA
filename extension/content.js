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

/**
 * Finds the Google Forms question title for an element by walking up the DOM
 * looking for the question container and extracting the heading/title text.
 * Google Forms nests elements deeply, so we need to traverse far up.
 */
function findGoogleFormsQuestionTitle(element) {
  let parent = element.parentElement;

  // Traverse up to 15 ancestors to find the question container
  for (let i = 0; i < 15 && parent; i++) {
    // Google Forms question title selectors (multiple classes for compatibility)
    const titleEl = parent.querySelector(
      '.M7eMe, ' +                                                  // Current Google Forms question title class
      '[role="heading"], ' +                                        // Accessible heading role
      '.freebirdFormviewerComponentsQuestionBaseTitle, ' +          // Older/classic Google Forms title
      '.freebirdFormviewerViewItemsItemItemTitle, ' +               // Another legacy title class
      '.Qr7Oae'                                                    // Another Google Forms question header
    );

    if (titleEl) {
      const text = titleEl.innerText.trim();
      // Make sure we got a real title, not a generic "Your answer" placeholder
      if (text && text.length < 200 && text.toLowerCase() !== "your answer") {
        return text;
      }
    }
    parent = parent.parentElement;
  }
  return null;
}

/**
 * Helper function to get text inside matching labels.
 * Checks ARIA, standard labels, and Google Forms-specific title containers.
 */
function getAssociatedLabelText(element) {
  // 1. Check standard <label> elements
  if (element.id) {
    const label = document.querySelector(`label[for="${element.id}"]`);
    if (label) {
      const labelText = label.innerText.trim();
      if (labelText && labelText.toLowerCase() !== "your answer") return labelText;
    }
  }
  const parentLabel = element.closest("label");
  if (parentLabel) {
    const labelText = parentLabel.innerText.trim();
    if (labelText && labelText.toLowerCase() !== "your answer") return labelText;
  }
  
  // 2. Check aria-labelledby (highly specific visible text references)
  const ariaLabelledBy = element.getAttribute("aria-labelledby");
  if (ariaLabelledBy) {
    const ids = ariaLabelledBy.trim().split(/\s+/);
    const labelTexts = ids.map(id => {
      const el = document.getElementById(id);
      return el ? el.innerText.trim() : "";
    }).filter(t => t && t.toLowerCase() !== "your answer");
    if (labelTexts.length > 0) {
      return labelTexts.join(" ");
    }
  }
  
  // 3. Check aria-label directly on input (skip generic "your answer" placeholders)
  const ariaLabel = element.getAttribute("aria-label");
  if (ariaLabel && ariaLabel.toLowerCase() !== "your answer") return ariaLabel;

  // 4. Google Forms-specific deep traversal (up to 15 levels up)
  const gfTitle = findGoogleFormsQuestionTitle(element);
  if (gfTitle) return gfTitle;

  // 5. Sibling traversal fallback
  let prev = element.previousElementSibling;
  while (prev) {
    const text = (prev.innerText || "").trim();
    if ((prev.tagName === "LABEL" || text) && text.toLowerCase() !== "your answer") {
      return text;
    }
    prev = prev.previousElementSibling;
  }
  return "";
}

/**
 * For radio buttons in Google Forms, we need the OPTION label (e.g., "Male")
 * separately from the QUESTION title (e.g., "Gender").
 * This function returns the radio option's own visible label text.
 */
function getRadioOptionLabel(element) {
  // For role="radio" divs in Google Forms, aria-label contains the option text
  const ariaLabel = element.getAttribute("aria-label");
  if (ariaLabel) return ariaLabel.trim();
  
  // For native radio inputs, check the parent label or adjacent text
  const parentLabel = element.closest("label");
  if (parentLabel) return parentLabel.innerText.trim();
  
  // Check value attribute
  const val = element.value || element.getAttribute("data-value") || "";
  if (val) return val.trim();
  
  return "";
}

// Scan page for fillable fields and assign a unique tracking ID
let fieldCounter = 0;
function scanPageFields() {
  const elements = document.querySelectorAll(
    'input[type="text"], input[type="date"], input[type="number"], input[type="email"], input[type="tel"], input[type="radio"], input:not([type]), select, textarea, [role="textbox"], [role="radio"], [role="listbox"]'
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

    const isRadio = el.type === "radio" || el.getAttribute("role") === "radio";
    const typeAttr = el.getAttribute("type") || (el.getAttribute("role") === "radio" ? "radio" : el.tagName.toLowerCase());

    let labelText;
    let radioOptionText = "";
    
    if (isRadio) {
      // For radios: get the question title AND the option label separately
      radioOptionText = getRadioOptionLabel(el);
      // The question title comes from the parent question container
      labelText = findGoogleFormsQuestionTitle(el) || getAssociatedLabelText(el);
      // If we still only got the option label as the "question", try harder
      if (!labelText || labelText === radioOptionText) {
        labelText = ""; // will be resolved by AI mapper
      }
    } else {
      labelText = getAssociatedLabelText(el);
    }

    const placeholder = el.getAttribute("placeholder") || "";
    const nameAttr = el.getAttribute("name") || "";
    const ariaLabel = el.getAttribute("aria-label") || "";

    scanned.push({
      asha_id: id,
      id: el.id || "",
      name: nameAttr,
      type: typeAttr,
      placeholder: placeholder,
      aria_label: ariaLabel,
      label_text: labelText,
      radio_option: radioOptionText  // e.g., "Male", "Female", "Other"
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
        const type = (el.getAttribute("type") || el.getAttribute("role") || el.tagName).toLowerCase();
        
        if (type === "radio" || el.type === "radio") {
          // ---- RADIO BUTTON HANDLING ----
          // Get the visible label of this specific radio option
          const optionLabel = getRadioOptionLabel(el).toLowerCase().trim();
          const targetValue = value.toLowerCase().trim();
          
          logDebug(`Radio check: option="${optionLabel}" vs target="${targetValue}"`);
          
          // Strict matching: option label must exactly equal the target value
          // OR the target value must be contained as a standalone word
          let isMatch = false;
          
          if (optionLabel === targetValue) {
            // Exact match: "male" === "male"
            isMatch = true;
          } else if (optionLabel.length > 0 && targetValue.length > 0) {
            // Word-boundary match, but ONLY if the option is shorter/equal to the target
            // This prevents "male" from matching "female"
            // We check: does the option label START with the target, or is it exactly a word in the target?
            const optionWords = optionLabel.split(/\s+/);
            const targetWords = targetValue.split(/\s+/);
            
            // Check if any target word exactly matches any option word
            isMatch = optionWords.some(ow => targetWords.some(tw => tw === ow));
            
            // Safety: explicitly exclude partial substring matches like "male" in "female"
            if (isMatch) {
              // Double-check: "female" should not match "male"
              if (optionLabel.includes(targetValue) && optionLabel !== targetValue) {
                // e.g., optionLabel="female" includes targetValue="male" but they're not equal
                isMatch = false;
                logDebug(`Rejected false positive: "${optionLabel}" contains "${targetValue}" but is not exact match`);
              }
              if (targetValue.includes(optionLabel) && optionLabel !== targetValue) {
                // e.g., targetValue="female" includes optionLabel="male" but they're not equal
                isMatch = false;
                logDebug(`Rejected false positive: "${targetValue}" contains "${optionLabel}" but is not exact match`);
              }
            }
          }
          
          if (isMatch) {
            logDebug(`✅ Matching radio option found: "${optionLabel}". Clicking.`);
            el.focus();
            if (el.tagName === "INPUT") {
              el.checked = true;
              el.dispatchEvent(new Event("change", { bubbles: true }));
              el.dispatchEvent(new Event("input", { bubbles: true }));
            } else {
              // Google Forms role="radio" div — just click it
              el.click();
            }
            filledCount++;
          } else {
            logDebug(`❌ Radio option "${optionLabel}" did not match target "${targetValue}"`);
          }
        } else if (el.tagName === "SELECT") {
          // ---- SELECT DROPDOWN HANDLING ----
          el.focus();
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
          el.blur();
        } else if (el.type === "date" || type === "date") {
          // ---- DATE INPUT HANDLING ----
          el.focus();
          const isoDate = formatToISODate(value);
          
          // Use the native input setter to ensure frameworks detect the change
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          nativeInputValueSetter.call(el, isoDate);
          
          el.dispatchEvent(new Event("input", { bubbles: true }));
          el.dispatchEvent(new Event("change", { bubbles: true }));
          filledCount++;
          logDebug(`Set date input to: ${isoDate}`);
          el.blur();
        } else {
          // ---- GENERAL TEXT / TEXTAREA / CONTENTEDITABLE HANDLING ----
          el.focus();
          if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
            // Use native setter to bypass React/Angular/Vue value trapping
            const proto = el.tagName === "TEXTAREA"
              ? window.HTMLTextAreaElement.prototype
              : window.HTMLInputElement.prototype;
            const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value').set;
            nativeSetter.call(el, value);
            logDebug(`Set ${el.tagName.toLowerCase()} value to: ${value}`);
          } else if (el.isContentEditable || el.getAttribute("contenteditable") === "true") {
            el.innerText = value;
            logDebug(`Set contenteditable innerText to: ${value}`);
          } else {
            // Fallback for divs with role="textbox"
            el.innerText = value;
            logDebug(`Set fallback element innerText to: ${value}`);
          }
          el.dispatchEvent(new Event("input", { bubbles: true }));
          el.dispatchEvent(new Event("change", { bubbles: true }));
          el.dispatchEvent(new Event("blur", { bubbles: true }));
          filledCount++;
          el.blur();
        }
        
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
