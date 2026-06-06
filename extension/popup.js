document.addEventListener("DOMContentLoaded", async () => {
  const loader = document.getElementById("loader-view");
  const errorView = document.getElementById("error-view");
  const profileView = document.getElementById("profile-view");
  const btnFill = document.getElementById("btn-fill");

  const debugSection = document.getElementById("debug-section");
  const btnToggleDebug = document.getElementById("btn-toggle-debug");
  const debugLogs = document.getElementById("debug-logs");

  const fields = {
    name: document.getElementById("field-name"),
    dob: document.getElementById("field-dob"),
    gender: document.getElementById("field-gender"),
    aadhaar: document.getElementById("field-aadhaar"),
    address: document.getElementById("field-address")
  };

  let activeProfile = null;

  // Toggle debug panel
  btnToggleDebug.addEventListener("click", () => {
    if (debugLogs.style.display === "none") {
      debugLogs.style.display = "block";
      btnToggleDebug.innerHTML = "▼ Hide Diagnostics";
    } else {
      debugLogs.style.display = "none";
      btnToggleDebug.innerHTML = "▶ Show Diagnostics";
    }
  });

  function addDebugLog(msg) {
    debugLogs.innerHTML += msg + "\n";
    debugLogs.scrollTop = debugLogs.scrollHeight;
  }

  try {
    const response = await fetch("http://127.0.0.1:8000/api/autofill-profile");
    if (!response.ok) {
      throw new Error("Failed to fetch profile");
    }
    
    activeProfile = await response.json();
    
    // Fill popup UI
    fields.name.textContent = activeProfile.name || "N/A";
    fields.dob.textContent = activeProfile.dob || "N/A";
    fields.gender.textContent = activeProfile.gender || "N/A";
    fields.aadhaar.textContent = activeProfile.aadhaar || "N/A";
    fields.address.textContent = activeProfile.address || "N/A";

    loader.style.display = "none";
    profileView.style.display = "block";
  } catch (err) {
    console.error("Autofill helper error:", err);
    loader.style.display = "none";
    errorView.style.display = "block";
  }

  btnFill.addEventListener("click", () => {
    if (!activeProfile) return;

    // Transition button to loading status
    const originalText = btnFill.innerHTML;
    btnFill.innerHTML = "🌀 Scan Form Fields...";
    btnFill.disabled = true;

    // Show debug section on action
    debugSection.style.display = "block";
    debugLogs.innerHTML = ""; // clear logs
    addDebugLog("[Popup] Clicked Autofill. Querying active tab...");

    // Query active tab and send fill message
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length === 0) {
        addDebugLog("[Popup] Error: No active tab found.");
        resetButton(originalText);
        return;
      }
      
      const activeTab = tabs[0];
      addDebugLog(`[Popup] Active tab: ${activeTab.url}`);

      // Step 1: Scan fields on the webpage via content script
      chrome.tabs.sendMessage(activeTab.id, { action: "scanFields" }, async (scanResponse) => {
        if (chrome.runtime.lastError || !scanResponse || !scanResponse.fields) {
          const errMsg = chrome.runtime.lastError ? chrome.runtime.lastError.message : "No response";
          addDebugLog(`[Popup] Scan failed: ${errMsg}`);
          console.error("Autofill scan error:", chrome.runtime.lastError);
          showErrorButton("⚠️ Please Refresh Webpage!");
          return;
        }

        const scannedFields = scanResponse.fields;
        addDebugLog(`[Popup] Scan complete. Found ${scannedFields.length} fields.`);
        scannedFields.forEach(f => {
          addDebugLog(` - Field ID: ${f.asha_id}, Label: "${f.label_text}", Tag: ${f.type}`);
        });

        if (scannedFields.length === 0) {
          showErrorButton("⚠️ No Form Fields Detected!");
          return;
        }

        btnFill.innerHTML = "🧠 AI Mapping Fields...";
        addDebugLog("[Popup] Sending scanned fields to FastAPI AI mapping service...");

        try {
          // Step 2: Request AI Mapping from Backend FastAPI Server
          const mapResponse = await fetch("http://127.0.0.1:8000/api/map-fields", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ fields: scannedFields })
          });

          if (!mapResponse.ok) {
            throw new Error("AI Mapping service failed");
          }

          const result = await mapResponse.json();
          const mappings = result.mappings;
          
          addDebugLog(`[Popup] Received mappings from AI. Count: ${mappings.length}`);
          mappings.forEach(m => {
            addDebugLog(` - ID: ${m.asha_id} ➔ Mapped: "${m.mapped_field}" (Confidence: ${(m.confidence * 100).toFixed(0)}%)`);
          });

          btnFill.innerHTML = "⚡ Auto-filling Form...";
          addDebugLog("[Popup] Sending fill instructions to content script...");

          // Step 3: Populate values using content script
          chrome.tabs.sendMessage(activeTab.id, {
            action: "fillFields",
            mappings: mappings,
            profile: activeProfile
          }, (fillResponse) => {
            if (chrome.runtime.lastError || !fillResponse) {
              const errMsg = chrome.runtime.lastError ? chrome.runtime.lastError.message : "No response";
              addDebugLog(`[Popup] Fill execution failed: ${errMsg}`);
              console.error("Autofill execution error:", chrome.runtime.lastError);
              showErrorButton("⚠️ Fill Execution Failed!");
              return;
            }

            addDebugLog(`[Popup] Fill complete. Successfully processed.`);
            
            // Pull diagnostics logs from the tab
            chrome.tabs.sendMessage(activeTab.id, { action: "getLogs" }, (logResponse) => {
              if (!chrome.runtime.lastError && logResponse && logResponse.logs) {
                addDebugLog("\n[Tab Logs]");
                logResponse.logs.forEach(l => {
                  addDebugLog(` ${l}`);
                });
              }
            });

            // Step 4: Show Success Confirmation
            btnFill.innerHTML = `✅ Filled ${fillResponse.count} Fields!`;
            btnFill.style.background = "#10B981";
            btnFill.disabled = false;
            
            setTimeout(() => {
              btnFill.innerHTML = originalText;
              btnFill.style.background = "";
            }, 3000);
          });

        } catch (err) {
          addDebugLog(`[Popup] Error: ${err.message}`);
          console.error("AI Mapping execution failure:", err);
          showErrorButton("⚠️ AI Mapping Error!");
        }
      });
    });
  });

  function resetButton(text) {
    btnFill.innerHTML = text;
    btnFill.disabled = false;
  }

  function showErrorButton(msg) {
    btnFill.innerHTML = msg;
    btnFill.style.background = "#EF4444";
    btnFill.disabled = false;
    setTimeout(() => {
      btnFill.innerHTML = "🚀 Autofill Form";
      btnFill.style.background = "";
    }, 3000);
  }
});
