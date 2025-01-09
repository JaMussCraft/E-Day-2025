// Get the button element
const button = document.getElementById("clickButton");

// Add a click event listener to the button
button.addEventListener("click", () => {
  // Get the message element and set its text content
  const message = document.getElementById("message");
  message.textContent = "Button clicked! Welcome to my website.";
});
