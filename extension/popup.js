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

    // Query active tab and send fill message
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length === 0) return;
      
      const activeTab = tabs[0];
      chrome.tabs.sendMessage(activeTab.id, {
        action: "autofill",
        profile: activeProfile
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error("Autofill communication error:", chrome.runtime.lastError);
          const originalText = btnFill.innerHTML;
          btnFill.innerHTML = "⚠️ Please Refresh the Webpage!";
          btnFill.style.background = "#F59E0B";
          setTimeout(() => {
            btnFill.innerHTML = originalText;
            btnFill.style.background = "";
          }, 3000);
          return;
        }

        // Feedback success visual on button
        const originalText = btnFill.innerHTML;
        btnFill.innerHTML = "✅ Form Filled Successfully!";
        btnFill.style.background = "#10B981";
        setTimeout(() => {
          btnFill.innerHTML = originalText;
          btnFill.style.background = "";
        }, 1500);
      });
    });
  });
});
