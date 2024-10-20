document.addEventListener("DOMContentLoaded", function () {
	const toggleSwitch = document.getElementById("toggleSwitch");
	const statusText = document.getElementById("status");

	chrome.storage.sync.get("autoSkipEnabled", function (data) {
		toggleSwitch.checked = data.autoSkipEnabled || false;
		statusText.textContent = toggleSwitch.checked ? "On" : "Off";
	});

	toggleSwitch.addEventListener("change", function () {
		const isEnabled = toggleSwitch.checked;
		statusText.textContent = isEnabled ? "On" : "Off";
		chrome.storage.sync.set({ autoSkipEnabled: isEnabled });

		chrome.tabs.query(
			{ active: true, currentWindow: true },
			function (tabs) {
				if (tabs[0]) {
					chrome.tabs
						.sendMessage(tabs[0].id, {
							action: "toggleAutoSkip",
							enabled: isEnabled,
						})
						.then((response) => {
							console.log("Message sent successfully");
						})
						.catch((error) => {
							console.error("Error sending message:", error);
						});
				}
			}
		);
	});
});
