<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/12H0ZLuOVHarUJGYDt5m3EciXQ2vfbAml

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
:
# Visual Chapter Planner

![Visual Chapter Planner Screenshot - Input View with Gradients](https://i.imgur.com/your_screenshot_url_here.png) <!-- Replace with an actual screenshot of the input view -->
![Visual Chapter Planner Screenshot - Planning View](https://i.imgur.com/your_planning_view_screenshot_url_here.png) <!-- Replace with an actual screenshot of the planning view -->
![Visual Chapter Planner Screenshot - Gallery View](https://i.imgur.com/your_gallery_view_screenshot_url_here.png) <!-- Replace with an actual screenshot of the gallery view -->

## Overview

The **Visual Chapter Planner** is an advanced editorial tool designed for creators and storytellers. It transforms narrative text, PDFs, and plain text files into structured visual storyboards and high-fidelity images, leveraging the power of Google's Gemini API. This application streamlines the visualization process for long-form content such as novels, manga, webtoons, or scripts, ensuring visual consistency across characters and settings through intelligent AI agents.

With a sleek, modern UI featuring vibrant gradients and fluid animations, the Visual Chapter Planner offers an intuitive experience from text input to final image export.

## Features

*   **AI-Powered Visual Storyboarding**: A three-step workflow guides users from input to planning and final image generation.
*   **Multi-modal Input**: Accepts narrative text directly, or uploads of PDF, TXT, Markdown, CSV, PNG, JPEG, and WEBP files for chapter content.
*   **Smart Context Management**:
    *   **Series Bible Generation**: Automatically extracts and structures key details (summary, characters, locations, art style) from uploaded background documents (PDF, TXT, MD).
    *   **Web Search Grounding**: If a book title is provided without background files, the AI intelligently uses Google Search to research story context, character appearances, and world-building details.
*   **Consistent Character & Setting Generation**: AI agents leverage the generated "Series Bible" or real-time web research to ensure visual elements (especially character appearances) remain consistent across all generated scenes.
*   **Customizable Output Styles**: Choose from distinct visual profiles like "Novel Explanation" (cinematic/realistic), "Anime Recap" (cel-shaded), or "Manhwa Summary" (webtoon aesthetic).
*   **Interactive Planning View**: Review and refine the AI-generated storyboard.
    *   **Character Editor**: Modify auto-detected character physical descriptions to guide image generation.
    *   **Scene Editing**: Edit descriptions, change visual types (e.g., `character_anchor`, `location`, `action`, `mood`), and regenerate individual scene descriptions.
    *   **Add Scenes**: Manually add new visual items to the plan.
*   **High-Fidelity Image Generation**: Utilizes `gemini-2.5-flash-image` to create stunning visuals based on detailed scene descriptions and chosen style.
*   **Seamless Asset Export**: Download the complete visual plan as a JSON file and all generated images as PNGs.
*   **Chapter Continuity**: Advance to the next chapter while preserving the learned "Series Bible" and character edits for ongoing projects.
*   **Intuitive UI/UX**: Features a dark, premium aesthetic with dynamic gradients, glassmorphism effects, and fluid `framer-motion` animations for a delightful user experience.

## AI Agent Architecture

The application is powered by a suite of specialized AI agents:

1.  **Context Extractor Agent (`generateSeriesBible`)**: Builds a foundational "Series Bible" from source material (user files or web search), focusing on consistent character visuals, locations, and overall art style.
2.  **Visual Selector Agent (`generateVisualPlan`)**: Analyzes specific chapter content against the Series Bible (or performs dynamic web research) to identify key narrative moments and translate them into a sequence of structured visual scenes for the storyboard.
3.  **Image Generation Agent (`generateImageForItem`)**: Renders high-quality images for each visual scene, strictly adhering to the selected output profile, chapter mood, and the detailed character/setting information from the Series Bible to ensure visual consistency.
4.  **Visual Refiner Agent (`regenerateVisualDescription`)**: Allows for iterative improvement and re-generation of individual visual scene descriptions, capable of performing targeted web searches for lore-accurate refinement.

## Technologies Used

*   **Frontend**:
    *   [React](https://react.dev/)
    *   [TypeScript](https://www.typescriptlang.org/)
    *   [Tailwind CSS](https://tailwindcss.com/)
    *   [Framer Motion](https://www.framer.com/motion/) for animations
    *   [Lucide React](https://lucide.dev/) for icons
    *   [pdfjs-dist](https://mozilla.github.io/pdf.js/) for PDF text extraction
*   **Backend / AI**:
    *   [Google Gemini API](https://ai.google.dev/models/gemini) via the [`@google/genai`](https://www.npmjs.com/package/@google/genai) SDK

## Setup Instructions

To get this project up and running locally, follow these steps:

### Prerequisites

*   A modern web browser (e.g., Chrome, Firefox, Edge).
*   A Google Cloud Project with the Gemini API enabled and a valid API Key. This API key will need to be accessible as `process.env.API_KEY` in the execution environment. The application expects this to be pre-configured and does not provide UI for entering the key.

### Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/your-username/visual-chapter-planner.git
    cd visual-chapter-planner
    ```

2.  **No `npm install` needed**: This is a single-file application designed to run directly in the browser using ES Modules (ESM) via an `importmap`. All dependencies are loaded from ESM CDNs.

### Running the Application

Since this is a single `index.html` file using ES Modules, you can simply open `index.html` in your web browser. However, due to browser security restrictions (`file://` protocol limitations with ES Modules), it's recommended to serve the files using a simple local web server.

**Option 1: Using `http-server` (Recommended)**

1.  If you don't have it, install `http-server` globally:
    ```bash
    npm install -g http-server
    ```
2.  Navigate to the project root directory in your terminal:
    ```bash
    cd visual-chapter-planner
    ```
3.  Start the server:
    ```bash
    http-server .
    ```
4.  Open your browser and go to `http://localhost:8080` (or whatever port `http-server` indicates).

**Option 2: Using Python's built-in server**

1.  Navigate to the project root directory:
    ```bash
    cd visual-chapter-planner
    ```
2.  Start the server (Python 3):
    ```bash
    python -m http.server
    ```
    Or for Python 2:
    ```bash
    python -m SimpleHTTPServer
    ```
3.  Open your browser and go to `http://localhost:8000`.

## Usage Guide

The application guides you through a seamless 3-step process:

### Step 1: Input View

1.  **Chapter Content**:
    *   Paste the text of your specific chapter into the large text area.
    *   Alternatively, click "Attach Chapter (PDF/TXT)" to upload `.pdf`, `.txt`, `.md`, `.csv`, or image files.
2.  **Story Context / Background Info**:
    *   Expand this section to provide overarching story details for consistency.
    *   **Title (Required for Search)**: Enter the title of your book/story (e.g., "Lord of the Mysteries"). This is crucial if you don't upload background files, as the AI will use it for web search.
    *   **Author**: (Optional) Provide the author's name (e.g., "Cuttlefish That Loves Diving").
    *   **Genre**: (Optional) Specify the genre (e.g., "Chinese Web Novel").
    *   **Background PDF/TXT (Optional)**: Click "Attach Full Book (PDF/TXT)" to upload complete novels/scripts. If uploaded, the AI will build a "Series Bible" from these files.
    *   Click "Process Background File" (if files are attached) or "Research Story Context (Web)" (if only a title is provided) to analyze your context.
3.  **Output Style**: Select your desired visual aesthetic: "Novel Explanation," "Anime Recap," or "Manhwa Summary."
4.  Click **"Generate Visual Plan"** to proceed to the next step.

### Step 2: Planning View (Visual Storyboard)

1.  **Review the Plan**: The AI presents a storyboard of 6-9 visual scenes extracted from your chapter.
2.  **Character Visuals**: If characters were detected (or found via your Series Bible), a "Character Visuals" section allows you to review and edit their physical descriptions. These edits will influence how the image generation agent renders them.
3.  **Edit Scenes**:
    *   Each card represents a scene. You can directly edit its description for precision.
    *   Click the dropdown next to the type icon to change the scene's `VisualType` (e.g., `character_anchor`, `location`, `action`).
    *   Use the icons at the bottom of each card to `Edit Description`, `Regenerate` the scene's description, or `Remove` the scene entirely.
4.  **Add New Scene**: Click the "+ Add New Scene" card to manually add more visual items to your plan.
5.  Once satisfied, click **"Generate Images"** to proceed to the Gallery View and begin image rendering.

### Step 3: Gallery View (Production Gallery)

1.  **View Generated Images**: See all your AI-generated images, along with their corresponding scene descriptions.
2.  **Manage Assets**:
    *   **Download Individual Images**: Click the download icon on each image card.
    *   **Regenerate / Delete**: You can still regenerate a scene's description or delete it from the gallery.
3.  **Export All Assets**: Click **"Export Assets"** to download a JSON file of your entire visual plan and all generated images.
4.  **Next Chapter**: Click **"Next Chapter"** to clear the current chapter's input and visual plan, while intelligently retaining your generated `SeriesBible` and character edits. This allows for consistent planning across multiple chapters of the same story.
5.  **Reset**: Click **"Reset"** to clear all data and start a completely new project.

## Contributing

Contributions are welcome! If you have suggestions for improvements or new features, please feel free to open an issue or submit a pull request.

## License

This project is licensed under the MIT License - see the `LICENSE` file for details.

## Acknowledgements

*   Powered by the **Google Gemini API**
*   Built with the **@google/genai** SDK
*   PDF parsing enabled by **PDF.js**
*   UI/UX design inspired by modern web applications and cinematic storytelling tools.
