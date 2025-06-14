const WEBHOOK_URL = 'https://sandbox.zohoapis.com/crm/v7/functions/telus_webhook_to_capture_lead/actions/execute?auth_type=apikey&zapikey=1003.889f987039f9ee27f3c76f676263a8f4.5409f4070de428bf6646fad109b33cc0';

// Replace with the auth token information TELUS provided you. If you do not have this, or have lost it, email dltrlzohodev@telus.com
const AUTH_TOKEN_NAME = 'EnterAuthTokenName'; //Fill in this field with the token name you were provided
const AUTH_TOKEN_VALUE = 'EnterAuthTokenValue'; //Fill in this field with the token value you were provided

function sendToWebhook(e) {
  Logger.log('sendToWebhook function started.');
  Logger.log('Event object (e): ' + JSON.stringify(e));
  
  // Check if AUTH_TOKEN_NAME and AUTH_TOKEN_VALUE are set
  if (AUTH_TOKEN_NAME === 'EnterAuthTokenName') {
    Logger.log('AUTH_TOKEN_NAME is not set. Please set it to the token name you were provided.');
    return;
  }
  if (AUTH_TOKEN_VALUE === 'EnterAuthTokenValue') {
    Logger.log('AUTH_TOKEN_VALUE is not set. Please set it to the token value you were provided.');
    return;
  }
  // This function will be triggered when a new row is added
  if (e && e.range && e.range.getRow() == 1) { // Added e.range check for robustness
    Logger.log('Header row change detected. Ignoring.');
    return;
  }
  if (!e || !e.range) {
    Logger.log('Not an onEdit event or range not found. Exiting.');
    return;
  }
  Logger.log('Change detected in row: ' + e.range.getRow());

  const sheet = SpreadsheetApp.getActiveSheet();
  const lastRow = sheet.getLastRow();
  Logger.log('Active Sheet: ' + sheet.getName());
  Logger.log('Last row in sheet: ' + lastRow);

  // Get data from the last row where the edit occurred
  // It's usually better to use e.range.getRow() instead of lastRow to get the *edited* row's data
  // if the intent is to send the data of the row that was just changed.
  // For 'onEdit' triggers, e.range gives you the exact row/column that was edited.
  // If a single cell edit in a new row triggers this, lastRow might be correct.
  // However, if an existing row is edited, lastRow would get the bottom-most row.
  // For new row additions, e.range.getRow() would be the new last row.
  const rowToProcess = e.range.getLastRow();
  const data = sheet.getRange(rowToProcess, 1, 1, sheet.getLastColumn()).getValues()[0];
  Logger.log('Data retrieved from row ' + rowToProcess + ': ' + JSON.stringify(data));


  // Calculate dates
  const today = new Date();
  const endDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days later
  Logger.log('Today: ' + today.toISOString() + ', End Date (30 days later): ' + endDate.toISOString());

  // Calculate the number of days between today and endDate
  const diffTime = Math.abs(endDate.getTime() - today.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Modified Logger.log line
  Logger.log('Today: ' + today.toISOString() + ', End Date: ' + endDate.toISOString() + ', Days between: ' + diffDays);

  // Clean phone of all symbols, spaces etc.
  const phone = String(data[2]).replace(/[^0-9+]/g, ''); // Retails only digits and '+' and assumes Phone is in the 3rd column
  Logger.log('Original Phone Data: ' + data[2] + ', Cleaned Phone: ' + phone);

  // Prepare the payload using API Names from the documentation
  const payload = {
    auth_token_name: AUTH_TOKEN_NAME,
    auth_token_value: AUTH_TOKEN_VALUE,
    First_Name: data[0], // Assuming First Name is in the 1st column
    Last_Name: data[1], // Assuming Last Name is in the 2nd column
    Phone: phone, // Uses cleaned phone from above variable and assumes Phone is in the 3rd column
    Datahub_Src: data[3], // Assuming Datahub_Src is in the 4th column
    Campaign_Name: data[4], // Assuming Phone is in the 5th column
    Description: data[5], //Assuming Description is in the 6th column
    Street: data[6], //Assuming Street is in the 7th column
    City: data[7], //Assuming City is in the 8th column
    State: data[8], //Assuming Province is in the 9th column
    Zip_Code: data[9], //Assuming Postal Code is in the 10th column
    Country: data[10], //Assuming Country is in the 11th column
    Rate_Plan_Description: data[11], //Assuming Rate Plan Description is in the 12th column
    Phone_Model: data[12], //Assuming Device Model is in the 13th column
    Brand: data[13], //Assuming Current Provider is in the 14th column
    note: data[14], //Assuming Note is in the 15th column
    Consent_to_Contact_Captured: true,
    Created_By_Email: Session.getActiveUser().getEmail(),
    Campaign_Start_Date: Utilities.formatDate(today, "GMT", "yyyy-MM-dd"),
    Campaign_End_Date: Utilities.formatDate(endDate, "GMT", "yyyy-MM-dd"),
    SalesRepPin: "MBPS" // Enter the CPMS SalesRepPin of the user you want new leads assgined to
    // AssignToSalesRepUserID: "5877708000011780014", // Enter the Zoho UserID of the user you want new leads assgined to. Email dltrlzohodev@telus.com if you do not know your 19 digit Zoho user ID number
    // AssignToSalesRepEmail: "example@email.com", // Enter the email address of the user you want new leads assigned to
    // Add other fields as needed, using the API Names from the documentation
  };
  Logger.log('Payload prepared: ' + JSON.stringify(payload));


  // Send the payload to the webhook
  const options = {
    'method': 'POST',
    'contentType': 'application/json',
    'payload': JSON.stringify(payload),
    'muteHttpExceptions': true // Added for debugging full responses on errors
  };
  Logger.log('Webhook URL: ' + WEBHOOK_URL);
  Logger.log('Fetch options: ' + JSON.stringify(options));


  try {
    const response = UrlFetchApp.fetch(WEBHOOK_URL, options);
    Logger.log('Webhook response: ' + response.getContentText());
    Logger.log('Webhook response code: ' + response.getResponseCode());
  } catch (error) {
    Logger.log('Error sending to webhook: ' + error.toString());
  }
  Logger.log('sendToWebhook function finished.');
}