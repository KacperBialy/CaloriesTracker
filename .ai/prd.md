# Product Requirements Document (PRD) - CaloriesTracker

## 1. Product Overview

CaloriesTracker is a web application designed to allow users to quickly and seamlessly track their daily calorie and macronutrient intake. The main goal of the project is to minimize interaction with the interface by using voice commands, which will be processed by external services (e.g., ChatGPT integrated via an MCP server) and sent to a dedicated API.

The application will consist of two main components:
- A backend in the form of an API (ASP.NET Web API), responsible for processing queries, analyzing text using language models (LLM), fetching nutritional data, saving it to a database, and providing it to the frontend.
- A web application (Angular with Tailwind CSS), which will visualize data for the current day, allow management of the caloric goal, and handle user authentication.

The goal of the MVP is to deliver a fully functional flow, from a voice command to data visualization, focusing on simplicity and usability for a single, primary use case.

## 2. User Problem

Users who are conscious about their diet and count calories often face the problem of time-consuming and inconvenient manual data entry for every product consumed. This process requires them to step away from their meal, search for products in databases, and enter weights, which can be demotivating and lead to irregular diet tracking.

CaloriesTracker addresses this problem by offering a "hands-free" solution. Using natural language (e.g., through a voice assistant), a user can log an entire meal in seconds by saying, for example, "I ate 200 grams of chicken, 100 grams of mozzarella, and 30 grams of butter." The system will automatically process this command, calculate the nutritional values, and update the daily summary, eliminating the need for manual interaction with a phone or computer during a meal.

## 3. Functional Requirements

### 3.1. API (Backend - ASP.NET)
- F-001: Must provide a secure endpoint that accepts POST requests in JSON format, containing a text query about a meal.
- F-002: Must integrate with an LLM to extract product names and their weights from the received text.
- F-003: Must use an LLM to retrieve nutritional information (calories, proteins, fats, carbohydrates) for the recognized products.
- F-004: Must implement a caching mechanism for product data in a local database to optimize performance and ensure data consistency.
- F-005: Must save each product as a separate record in the database, associated with a unique user identifier and the date of consumption.
- F-006: Must provide a GET endpoint to retrieve all of the user's entries for the current day, along with unique identifiers for each entry.
- F-007: Must handle partial failures, returning in the response both a list of successfully processed products and a list of unrecognized queries.
- F-008: Must integrate with an authentication system (Supabase) to verify the user's identity with every request.

### 3.2. Web Application (Frontend - Angular)
- F-009: Must allow users to log in and register exclusively using their Google account (Google OAuth2), utilizing integration with Supabase.
- F-010: Must present a main dashboard that displays consumption data for the current day only.
- F-011: Must visualize the sum of consumed calories in relation to the daily goal set by the user (e.g., using a progress bar).
- F-012: Must visualize the sum of consumed macronutrients (proteins, fats, carbohydrates) in grams.
- F-013: Must display a chronological list of products consumed on a given day, along with their weight and nutritional values.
- F-014: Must provide functionality to delete single entries from the list.
- F-015: Must include a settings page where the user can enter and update their daily caloric requirement.

## 4. Product Boundaries

### 4.1. In Scope for MVP
- User authentication exclusively through Google OAuth2.
- Processing meal queries sent to the API in text form.
- Automatic retrieval of nutritional data.
- Saving each product as a separate entry in the database.
- Visualization of data (calories, macronutrients, product list) for the current day only.
- Ability to set a daily caloric goal.
- Ability to delete an incorrectly added product.

### 4.2. Out of Scope for MVP
- Manual entry or editing of products from the web interface.
- Consumption history from previous days.
- Notifications (e.g., about exceeding the caloric goal).
- Calorie counting based on meal photos.
- Built-in speech recognition mechanism.
- Saving and creating custom recipes.
- Nutritional suggestions and diet plans.
- Grouping products into meals (e.g., breakfast, lunch).

## 5. User Stories

### US-001
- Title: Authentication with a Google account
- Description: As a user, I want to be able to log into the application using my Google account to securely access my personalized data.
- Acceptance Criteria:
  1. The application's homepage displays a "Sign in with Google" button.
  2. Clicking the button redirects to the standard Google authentication process.
  3. After successfully logging in with Google, I am redirected back to the application and am logged in.
  4. In case of a login error, an appropriate message is displayed.

### US-002
- Title: Setting a daily caloric goal
- Description: As a user, I want to be able to set my daily caloric goal so I can track my progress towards it on the main dashboard.
- Acceptance Criteria:
  1. A "Settings" section is available in the application.
  2. In the settings, there is a field to enter the numerical value of the daily caloric goal.
  3. After saving, the new goal value is visible on the main dashboard.
  4. The set goal is permanently saved to my account.
  5. The system validates that the entered value is a positive integer.

### US-003
- Title: Processing a text command via the API
- Description: As the system, I want to receive a text command from an external source (e.g., a voice assistant) to process it, identify products and their weights, and then save them to the database.
- Acceptance Criteria:
  1. The API accepts a POST request with text like "chicken 200g and rice 100g".
  2. The system correctly parses the text, identifying two products: "chicken" (200g) and "rice" (100g).
  3. Calorie and macronutrient data are retrieved for each product.
  4. Each product is saved as a separate record in the database, associated with the authenticated user and the current date.
  5. The API returns a success response containing a summary of the added products.

### US-004
- Title: Displaying the daily summary
- Description: As a user, I want to see a summary of my daily calorie and macronutrient intake on the main dashboard.
- Acceptance Criteria:
  1. The main dashboard displays the total calories consumed on the current day.
  2. Progress towards the caloric goal is presented graphically (e.g., as a progress bar).
  3. The dashboard displays the total amount of protein, fats, and carbohydrates in grams.
  4. All values on the dashboard update automatically after a new product is added.

### US-005
- Title: Viewing the list of consumed products
- Description: As a user, I want to see a list of all products consumed during the day so I can review and verify them.
- Acceptance Criteria:
  1. Below the daily summary, there is a list of products added on the current day.
  2. The list is sorted chronologically (from newest to oldest).
  3. Each item on the list includes the product name, its weight, calorie count, and macronutrients.

### US-006
- Title: Deleting an incorrectly added product
- Description: As a user, I want to be able to delete a single product from my daily list if it was added by mistake.
- Acceptance Criteria:
  1. A "Delete" icon/button is visible next to each product on the list.
  2. After clicking the "Delete" button and confirming, the product disappears from the list.
  3. After deleting a product, the daily summary of calories and macronutrients is immediately recalculated.

### US-007
- Title: Handling a partially unrecognized command
- Description: As the system, when I receive a command containing both recognizable and unrecognizable products, I want to save the correct ones and report the errors.
- Acceptance Criteria:
  1. For the query "chicken 200g, unknownproduct 50g", the API correctly processes and saves "chicken 200g".
  2. The API response includes information about the successful addition of the chicken.
  3. The API response also includes information that "unknownproduct 50g" was not recognized.
  4. The web application does not crash, and the data for the chicken is displayed correctly.

### US-008
- Title: Logging out of the application
- Description: As a user, I want to be able to log out of the application to end my session and secure access to my data.
- Acceptance Criteria:
  1. There is a "Logout" button in the application interface.
  2. After clicking the button, my session is terminated.
  3. I am redirected to the login page.

## 6. Success Metrics

Since this is a personal project, formal KPI metrics are not a priority. The success of the MVP will be measured by achieving the following qualitative and functional goals:

1. End-to-End Functional Correctness:
   - Description: The key criterion is the flawless operation of the entire flow: from the moment the user speaks a command, through its processing by the API, to the correct visualization of updated data in the web application.
   - Measurement: Successful processing of 10 out of 10 test queries for various meals.

2. Product Recognition Accuracy:
   - Description: The ability of the system (supported by an LLM) to correctly identify product names and their weights from text commands.
   - Goal: Achieve at least 95% accuracy in correctly matching a product and its weight for typical queries.

3. Stability and Reliability:
   - Description: The application and the API operate stably, without unexpected errors or crashes during normal use.
   - Measurement: No critical errors preventing the use of key features during a one-week testing period.
