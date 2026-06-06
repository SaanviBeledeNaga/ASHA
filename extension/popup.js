document.addEventListener("DOMContentLoaded", async () => {
  const loader = document.getElementById("loader-view");
  const errorView = document.getElementById("error-view");
  const profileView = document.getElementById("profile-view");
  const btnFill = document.getElementById("btn-fill");

  const fields = {
    name: document.getElementById("field-name"),
    dob: document.getElementById("field-dob"),
    gender: document.getElementById("field-gender"),
    aadhaar: document.getElementById("field-aadhaar"),
    address: document.getElementById("field-address")
  };

  let activeProfile = null;

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

    // Query active tab and send fill message
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length === 0) {
        resetButton(originalText);
        return;
      }
      
      const activeTab = tabs[0];

      // Step 1: Scan fields on the webpage via content script
      chrome.tabs.sendMessage(activeTab.id, { action: "scanFields" }, async (scanResponse) => {
        if (chrome.runtime.lastError || !scanResponse || !scanResponse.fields) {
          console.error("Autofill scan error:", chrome.runtime.lastError);
          showErrorButton("⚠️ Please Refresh Webpage!");
          return;
        }

        const scannedFields = scanResponse.fields;
        if (scannedFields.length === 0) {
          showErrorButton("⚠️ No Form Fields Detected!");
          return;
        }

        btnFill.innerHTML = "🧠 AI Mapping Fields...";

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

          // Attach asha_id from scannedFields matching index structure
          const enrichedMappings = mappings.map((m, idx) => ({
            ...m,
            asha_id: scannedFields[idx].asha_id
          }));

          btnFill.innerHTML = "⚡ Auto-filling Form...";

          // Step 3: Populate values using content script
          chrome.tabs.sendMessage(activeTab.id, {
            action: "fillFields",
            mappings: enrichedMappings,
            profile: activeProfile
          }, (fillResponse) => {
            if (chrome.runtime.lastError || !fillResponse) {
              console.error("Autofill execution error:", chrome.runtime.lastError);
              showErrorButton("⚠️ Fill Execution Failed!");
              return;
            }

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
      btnFill.innerHTML = "⚡ Autofill Form";
      btnFill.style.background = "";
    }, 3000);
  }
});
