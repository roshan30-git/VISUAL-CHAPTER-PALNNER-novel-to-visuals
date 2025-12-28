# Visual Chapter Planner

!
<img width="1268" height="820" alt="Screenshot 2025-12-28 175756" src="https://github.com/user-attachments/assets/b24a20aa-7ee0-43d0-b1eb-d4d7a59a831a" />
<img width="1386" height="796" alt="Screenshot 2025-12-28 175541" src="https://github.com/user-attachments/assets/5bc4a200-93e6-42bd-be8c-646b8fe07a28" />
<img width="1256" height="810" alt="Screenshot 2025-12-28 175823" src="https://github.com/user-attachments/assets/4661d936-4cef-4f57-bf73-dd573a32c995" />


An AI-powered editorial tool that transforms narrative content (text, PDFs, images) into structured visual storyboards and character bibles. Leverage the power of the Google Gemini API to pre-visualize your stories with high-fidelity images and maintain visual consistency across your entire project.

## Features

*   **Multi-modal Input**: Feed your story directly into the app using plain text, PDF documents, or image files for chapter content.
*   **Intelligent Storyboarding**: Automatically generates a visual plan, breaking down your narrative into discrete scenes with dynamically adjusted visual counts based on content length.
*   **Emotional Pacing Heatmap**: Get a clear visual representation of your chapter's emotional arc, highlighting key beats and intensity fluctuations.
*   **AI-Generated Visuals**: Produce stunning, high-fidelity images for each storyboard segment. Choose from various artistic profiles like "Novel Explanation" (cinematic), "Anime Recap" (cel-shaded), and "Manhwa Summary" (webtoon style).
*   **Context-Aware Planning (Series Bible)**:
    *   Provide book-level metadata (title, author, genre).
    *   Upload full book documents or enable AI web research to generate a "Series Bible" outlining consistent character designs, key locations, and overarching art style. This ensures visual coherence across all chapters.
*   **Character Visual Bible**: Automatically identifies characters and generates consistent visual reference portraits. Edit character descriptions to refine their appearance and ensure they look the same across all generated scenes.
*   **Interactive Editing & Refinement**:
    *   **Manual Prompt Editing**: Directly click and edit the text descriptions of individual visual segments to fine-tune the prompts before image generation.
    *   **Magic Image Editing**: Utilize follow-up text prompts to modify existing generated images, allowing for precise adjustments (e.g., "add a hat to the character," "change the time of day to night").
*   **Seamless Multi-Chapter Workflow**: The "Finish & Start Next Chapter" feature allows creators to advance their project chapter by chapter without losing established story context, characters, or art style settings.

## Technologies Used

*   **Frontend**: React (TypeScript), Tailwind CSS, Framer Motion
*   **AI Integration**: Google Gemini API (`@google/genai`)
*   **PDF Processing**: `pdfjs-dist` (for client-side PDF text extraction)

## Getting Started

To get this project up and running locally, follow these steps:

### Prerequisites

*   Node.js (LTS version recommended)
*   A Google Gemini API Key

### Installation

1.  **Clone the repository:**
    ```bash
    git clone [YOUR_REPO_URL_HERE]
    cd visual-chapter-planner
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```
3.  **Set up your API Key:**
    The application expects the API key to be available as `process.env.API_KEY`. You can set this as an environment variable in your development environment. For example, if using `npm start` directly, you might run:
    ```bash
    API_KEY=YOUR_GEMINI_API_KEY npm start
    ```
    Replace `YOUR_GEMINI_API_KEY` with your actual key obtained from Google AI Studio.

### Running the application

```bash
npm start
# or
yarn start

This will open the application in your browser, typically at http://localhost:3000.
Usage
Input Chapter Content: Paste your chapter text into the main textarea or attach PDF/image files.
Add Context (Optional): Expand the "Add Book-level Context" section to provide book title, author, genre, and upload larger context files. Click "Process File" or "Enable Web Research" to generate a Series Bible.
Select Output Style: Choose an aesthetic profile (Novel, Anime, Manhwa) that best fits your project.
Generate Visual Plan: Click "Generate Visual Plan" to create your storyboard, emotional heatmap, and character list.
Review and Refine:
Storyboard Tab: View your generated scenes.
Click on a scene's text description to manually edit the prompt.
Click the "Magic Wand" icon to open an image editor and provide follow-up text prompts to modify the generated image.
Generate images for individual scenes or all at once.
Characters Tab: Review identified characters and generate consistent reference portraits.
Continue to Next Chapter: Use the "Finish & Start Next Chapter" button to clear the current chapter's specifics while preserving your book's overall context for the next segment of your story.
Contributing
(Optional section - add guidelines for contributions if this were an open-source project)
License
(Optional section - specify your project's license)
Credits
Built with Google Gemini API
Developed as a demonstration of advanced AI capabilities in creative workflows.
