let autoSkipEnabled = false;

function waitForElement(selector, timeout = 3000) {
	return new Promise((resolve, reject) => {
		const startTime = Date.now();
		const checkElement = () => {
			let element;
			if (selector.includes(":contains(")) {
				const text = selector.match(/:contains\("(.+)"\)/)[1];
				element = Array.from(document.querySelectorAll("button")).find(
					(el) =>
						el.textContent.trim().toLowerCase() ===
						text.toLowerCase()
				);
			} else {
				element = document.querySelector(selector);
			}
			if (element) {
				resolve(element);
			} else if (Date.now() - startTime > timeout) {
				reject(
					new Error(
						`Element ${selector} not found within ${timeout}ms`
					)
				);
			} else {
				setTimeout(checkElement, 100);
			}
		};
		checkElement();
	});
}

async function handleQuiz() {
	if (!autoSkipEnabled) return;

	try {
		// Select the first option
		const firstOption = await waitForElement(
			'input[type="radio"], input[type="checkbox"]'
		);
		firstOption.click();

		// Wait for a short time to allow the page to update
		await new Promise((resolve) => setTimeout(resolve, 1000));

		// Look for the "Submit" button and click it
		const submitButton = await waitForElement('button:contains("Submit")');
		submitButton.click();

		// Wait for the page to update after submission
		await new Promise((resolve) => setTimeout(resolve, 1000));

		// Look for "Next" or "Next question" button
		const nextButton = await Promise.race([
			waitForElement('button:contains("Next")'),
			waitForElement('button:contains("Next question")'),
		]);
		nextButton.click();

		// Check for "Continue watching" button
		try {
			const continueButton = await waitForElement(
				'button:contains("Continue watching")',
				1000
			);
			continueButton.click();
		} catch (error) {
			console.log("Continue watching button not found, moving on.");
		}

		// Schedule the next check
		setTimeout(checkForQuiz, 1000);
	} catch (error) {
		console.error("Error in handleQuiz:", error);
		setTimeout(checkForQuiz, 1000);
	}
}

function checkForQuiz() {
	if (autoSkipEnabled && window.location.href.includes("/quiz/")) {
		handleQuiz();
	}
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.action === "toggleAutoSkip") {
		autoSkipEnabled = request.enabled;
		if (autoSkipEnabled) {
			checkForQuiz();
		}
		sendResponse({ received: true });
	}
	return true; // Indicates that the response will be sent asynchronously
});

// Check auto-skip status when the script loads
chrome.storage.sync.get("autoSkipEnabled", function (data) {
	autoSkipEnabled = data.autoSkipEnabled || false;
	if (autoSkipEnabled) {
		checkForQuiz();
	}
});

// Listen for URL changes
let lastUrl = location.href;
new MutationObserver(() => {
	const url = location.href;
	if (url !== lastUrl) {
		lastUrl = url;
		checkForQuiz();
	}
}).observe(document, { subtree: true, childList: true });
