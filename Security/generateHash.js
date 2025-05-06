const bcrypt = require("bcrypt");

async function generateAdminHash() {
  try {
    const password = "inc"; // Your admin password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log("Hashed Admin Password:", hashedPassword);
  } catch (error) {
    console.error("Error generating hash:", error);
  }
}

generateAdminHash();
