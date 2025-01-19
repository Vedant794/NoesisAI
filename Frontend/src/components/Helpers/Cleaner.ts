export function cleanResponse(response: string) {
  try {
    // Step 1: Clean up the JSON structure (only escape fixes outside the "content" field)
    let cleanedString = response
      .replace(/^"\{/, "{") // Remove leading escaped quotes
      .replace(/\}"$/, "}") // Remove trailing escaped quotes
      .replace(/\\"/g, '"') // Fix escaped quotes globally
      .replace(/\\\\/g, "\\") // Fix double backslashes
      .replace(/\\n/g, "")
      .replace(/\\`/g, '"');

    // console.log("Before Removing", cleanedString);

    // Step 2: Parse the JSON safely
    // const parsedJson = JSON.parse(cleanedString);

    // Step 3: Process each "content" field to fix inner formatting issues
    if (Array.isArray(cleanedString)) {
      cleanedString.forEach((item: any) => {
        if (item.content) {
          item.content = item.content
            .replace(/\\n/g, "\\n") // Ensure that \n remains as a literal string \n
            .replace(/\\\\/g, "\\") // Convert double backslashes to single backslashes
            .replace(/\\'/g, "'") // Convert escaped single quotes
            .replace(/;/g, ";\\n");

          // Optionally handle other escape sequences as needed
        }
      });
    }

    // Step 4: Return the cleaned JSON as an object
    // cleanedString = cleanedString.replace(/;/g, ";\n");
    return cleanedString;
  } catch (error: any) {
    console.error("Error cleaning response:", error.message);
    throw new Error("Invalid JSON format. Please check the response.");
  }
}
