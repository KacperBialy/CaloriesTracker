# CaloriesTracker

A web application designed to allow users to quickly and seamlessly track their daily calorie and macronutrient intake using voice commands.

## Table of Contents

- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## Project Description

CaloriesTracker addresses the common problem of time-consuming and inconvenient manual data entry for tracking daily food intake. This process can be demotivating and lead to inconsistent diet monitoring.

Our solution offers a "hands-free" approach. By using natural language—for example, saying, "I ate 200 grams of chicken, 100 grams of mozzarella, and 30 grams of butter"—the system automatically processes the command, calculates nutritional values, and updates the daily summary. This eliminates the need for manual interaction with a phone or computer during meals, making diet tracking simple and efficient.

## Tech Stack

The project is built with a modern tech stack focused on performance and developer experience:

- **Framework**: [Astro](https://astro.build/) v5.5.5
- **UI Library**: [React](https://react.dev/) v19.0.0
- **Language**: [TypeScript](https://www.typescriptlang.org/) v5
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) v4.0.17
- **UI Components**: [Shadcn/ui](https://ui.shadcn.com/)

## Getting Started Locally

To run the project locally, please follow these steps.

### Prerequisites

- Node.js `22.14.0` (as specified in the `.nvmrc` file)
- npm (or your preferred package manager)

### Installation

1.  **Clone the repository:**

    ```sh
    git clone https://github.com/your-username/CaloriesTracker.git
    cd CaloriesTracker
    ```

2.  **Install dependencies:**

    ```sh
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root of the project and add the necessary environment variables. For example:

    ```env
    # Supabase
    PUBLIC_SUPABASE_URL="your-supabase-url"
    PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
    ```

4.  **Run the development server:**
    ```sh
    npm run dev
    ```
    The application will be available at `http://localhost:4321`.

## Available Scripts

The following scripts are available in the `package.json`:

| Script             | Description                                    |
| ------------------ | ---------------------------------------------- |
| `npm run dev`      | Starts the development server.                 |
| `npm run build`    | Builds the application for production.         |
| `npm run preview`  | Previews the production build locally.         |
| `npm run lint`     | Lints the code using ESLint.                   |
| `npm run lint:fix` | Lints the code and automatically fixes issues. |
| `npm run format`   | Formats the code using Prettier.               |

## Project Scope

The scope of the project is defined for the Minimum Viable Product (MVP).

### In Scope for MVP

- **Authentication**: User login and registration exclusively through Google OAuth2.
- **Data Entry**: Processing meal queries sent to the API in text form.
- **Data Retrieval**: Automatic retrieval of nutritional data for recognized products.
- **Database**: Saving each product as a separate entry associated with the user.
- **Data Visualization**:
  - Displaying consumption data for the current day only.
  - Visualizing the sum of consumed calories and macronutrients.
  - Displaying a chronological list of consumed products.
- **User Settings**: Ability to set and update a daily caloric goal.
- **Data Management**: Ability to delete an incorrectly added product.

### Out of Scope for MVP

- Manual entry or editing of products from the web interface.
- Consumption history from previous days.
- Notifications (e.g., about exceeding the caloric goal).
- Calorie counting based on meal photos.
- A built-in speech recognition mechanism.
- Saving and creating custom recipes.
- Nutritional suggestions and diet plans.
- Grouping products into meals (e.g., breakfast, lunch).

## Project Status

The project is currently in the **development phase of the MVP**.

The success of the MVP will be measured by the following criteria:

- **End-to-End Functional Correctness**: The entire flow, from a voice command to data visualization, operates flawlessly.
- **Product Recognition Accuracy**: The system achieves at least 95% accuracy in identifying products and their weights from text commands.
- **Stability and Reliability**: The application and API operate without critical errors during normal use.

## License

This project is licensed under the MIT License. See the `LICENSE` file for more details.
