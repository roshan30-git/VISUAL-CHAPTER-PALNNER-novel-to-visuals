
import { GoogleGenAI, Type } from "@google/genai";
import { VisualPlanResponse, VideoProfile, VisualItem, VisualType, Character, UploadedFile, SeriesBible } from "../types";
import { extractTextFromPDF } from "./pdf";

// Helper to get a fresh instance with the current key
const getAI = () => {
  const apiKey = process.env.API_KEY || '';
  return new GoogleGenAI({ apiKey });
};

// Helper to decode base64 text for non-binary files
const decodeBase64Text = (base64Data: string) => {
  try {
     const binaryString = atob(base64Data);
     const bytes = new Uint8Array(binaryString.length);
     for (let i = 0; i < binaryString.length; i++) {
       bytes[i] = binaryString.charCodeAt(i);
     }
     return new TextDecoder().decode(bytes);
  } catch (e) {
    return "";
  }
};

/**
 * Extracts raw text from uploaded files, converting PDFs if necessary.
 */
const extractContentFromFiles = async (files: UploadedFile[]): Promise<string> => {
  let combinedText = "";
  for (const file of files) {
    if (file.type === 'application/pdf') {
      const pdfText = await extractTextFromPDF(file.data);
      combinedText += `\n--- START DOCUMENT: ${file.name} ---\n${pdfText}\n--- END DOCUMENT ---\n`;
    } else {
       // Support 'text/*' mime types OR assume text if file extension suggests it (txt, md, csv)
       const isText = file.type.startsWith('text/') || 
                      file.name.toLowerCase().endsWith('.txt') || 
                      file.name.toLowerCase().endsWith('.md') ||
                      file.name.toLowerCase().endsWith('.csv');
                      
       if (isText) {
          const base64Data = file.data.includes(',') ? file.data.split(',')[1] : file.data;
          const text = decodeBase64Text(base64Data);
          combinedText += `\n--- START DOCUMENT: ${file.name} ---\n${text}\n--- END DOCUMENT ---\n`;
       }
    }
  }
  return combinedText;
};

/**
 * AGENT 1: CONTEXT EXTRACTOR
 * Reads uploaded files OR searches the web to create a reusable "Story Context" sheet.
 */
export const generateSeriesBible = async (
  contextFiles: UploadedFile[], 
  metadata?: { title: string; author: string; genre: string }
): Promise<SeriesBible> => {
  const ai = getAI();
  let fullContextText = "";
  let model = 'gemini-2.5-flash';
  let tools: any = undefined;
  let sourceLabel = "Uploaded Documents";

  // 1. Determine Source: Files vs Web Search
  if (contextFiles.length > 0) {
    fullContextText = await extractContentFromFiles(contextFiles);
    if (!fullContextText.trim()) throw new Error("No readable text found in context files.");
  } else if (metadata?.title) {
    // SEARCH GROUNDING ACTIVATED
    model = 'gemini-3-flash-preview';
    tools = [{ googleSearch: {} }];
    sourceLabel = "Google Search Results";
    fullContextText = `Research Task: Find detailed visual descriptions for the characters, setting, and art style of the story titled "${metadata.title}" by "${metadata.author || 'Unknown'}".`;
  } else {
    throw new Error("No context files or book title provided.");
  }

  // 2. Generate Structured Context
  const systemInstruction = `
    You are a Lead Creative Director. 
    Your job is to read the provided source material (${sourceLabel}) and extract a "Story Context Sheet".
    
    Output structured data containing:
    1. A brief summary.
    2. A comprehensive list of MAIN characters.
       CRITICAL: You MUST extract detailed physical visual traits (Hair color/style, Eye color, Skin tone, Clothing style, Accessories, Age, Body type).
       Example: "Silver hair, sharp blue eyes, wearing a tattered victorian trench coat, top hat, scar over left eye."
    3. Key Locations with visual cues.
    4. An Art Style Guide string describing the world.
    
    Goal: This Context will be passed to other agents to generate consistent scenes.
  `;

  const prompt = `
    Analyze this source material.
    Title: ${metadata?.title || 'Unknown'}
    Author: ${metadata?.author || 'Unknown'}
    
    SOURCE MATERIAL:
    ${fullContextText.slice(0, 1000000)} 
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: { parts: [{ text: prompt }] },
      config: {
        tools: tools,
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            characters: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  physical_description: { type: Type.STRING, description: "Detailed visual description for Image Generation AI" }
                }
              }
            },
            locations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  visual_description: { type: Type.STRING }
                }
              }
            },
            art_style_guide: { type: Type.STRING }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No Context generated.");
    return JSON.parse(text) as SeriesBible;

  } catch (error: any) {
    console.error("Context Gen Error:", error);
    throw new Error("Failed to extract Story Context. " + error.message);
  }
};

/**
 * AGENT 2: VISUAL SELECTOR
 * Uses the pre-generated Context + Chapter Text to plan.
 * NOW SUPPORTS: Automatic Search Research if Context is missing.
 * ADDED: Emotion Heatmap analysis.
 * ADDED: Dynamic Scene Count Calculation based on Word Count.
 */
export const generateVisualPlan = async (
  chapterText: string,
  chapterFiles: UploadedFile[],
  profile: VideoProfile,
  contextText?: string,
  bible?: SeriesBible | null,
  metadata?: { title: string; author: string; genre: string }
): Promise<VisualPlanResponse> => {
  const ai = getAI();
  
  // 1. Calculate Content Complexity & Length
  let fullChapterContent = chapterText || "";
  if (chapterFiles.length > 0) {
      try {
          const filesContent = await extractContentFromFiles(chapterFiles);
          fullChapterContent += `\n\n--- ATTACHED FILE CONTENT ---\n${filesContent}`;
      } catch (e) {
          console.warn("Failed to read files for word count estimation", e);
      }
  }

  const wordCount = fullChapterContent.trim().split(/\s+/).length;
  
  // Dynamic Pacing Algorithm
  // Adjusts the target number of visuals based on text density.
  let minScenes = 4;
  let maxScenes = 8;

  if (wordCount < 300) {
      // Short / Flash Fiction
      minScenes = 3;
      maxScenes = 6;
  } else if (wordCount < 800) {
      // Short Chapter / Scene
      minScenes = 6;
      maxScenes = 10;
  } else if (wordCount < 1500) {
      // Standard Chapter
      minScenes = 10;
      maxScenes = 16;
  } else if (wordCount < 3000) {
      // Long Chapter
      minScenes = 16;
      maxScenes = 24;
  } else {
      // Very Long / Novella
      minScenes = 24;
      maxScenes = 35;
  }
  
  // Decide Strategy: If no Context is provided but we have a Book Title, 
  // use Gemini 3 Flash with Search to research the characters on the fly.
  const useSearch = !bible && !contextText && !!metadata?.title;
  const model = useSearch ? 'gemini-3-flash-preview' : 'gemini-2.5-flash';
  const tools = useSearch ? [{ googleSearch: {} }] : undefined;
  
  const systemInstruction = `
    You are a visual editor for long-form novel explanation videos.
    
    GOAL: Create a visual storyboard plan for the PROVIDED CHAPTER CONTENT.
    
    TASKS:
    1. Identify characters and their appearances.
    2. Select ${minScenes} to ${maxScenes} visual moments for the storyboard.
       - The text length is approx ${wordCount} words.
       - Ensure the visuals are evenly distributed to cover the ENTIRE narrative arc.
       - Do not rush the ending.
       - For long texts, ensure you capture the nuances and key dialogue interactions.
    3. Analyze the EMOTIONAL PACING of the chapter (The "Heatmap").
    
    CONTEXT HANDLING:
    ${bible ? `
    - Use the attached "STORY CONTEXT" for Character Appearance and Location designs. 
    - STRICTLY ADHERE to the physical descriptions in the Context to ensure consistency.
    ` : useSearch ? `
    - RESEARCH MODE ACTIVATED: You do not have a Story Context. You MUST uses Google Search to find information about the book "${metadata?.title}" by "${metadata?.author || 'Unknown'}".
    - STEP 1: Identify characters mentioned in the Narrative Text below.
    - STEP 2: Search for their canonical physical appearance (hair, eyes, clothes, key items).
    - STEP 3: Apply these RESEARCHED details to the 'characters' list output and the 'visuals' descriptions.
    ` : `
    - Analyze the text to infer character appearances.
    `}
    
    Video Profile: ${profile}
    STRICT OUTPUT FORMAT: JSON ONLY.
  `;

  const parts: any[] = [];
  
  // 1. Inject the Context (Lightweight RAG)
  if (bible) {
    parts.push({ text: `
--- STORY CONTEXT (SOURCE OF TRUTH) ---
Summary: ${bible.summary}
Art Style: ${bible.art_style_guide}

KNOWN CHARACTERS (USE THESE DESCRIPTIONS):
${bible.characters.map(c => `- ${c.name}: ${c.physical_description}`).join('\n')}

KNOWN LOCATIONS:
${bible.locations.map(l => `- ${l.name}: ${l.visual_description}`).join('\n')}
--------------------------------------
    `});
  } else if (contextText) {
    parts.push({ text: `Context Notes: ${contextText}` });
  }

  // 2. Add Chapter Content
  parts.push({ text: "--- CHAPTER CONTENT TO VISUALIZE ---" });
  parts.push({ text: fullChapterContent });

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: { parts },
      config: {
        tools: tools,
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            chapter_mood: {
              type: Type.OBJECT,
              properties: {
                tone: { type: Type.STRING },
                palette_hint: { type: Type.STRING }
              }
            },
            characters: {
              type: Type.ARRAY,
              description: "List of characters present IN THIS CHAPTER with their visual descriptions.",
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  physical_description: { type: Type.STRING }
                }
              }
            },
            emotion_arc: {
              type: Type.ARRAY,
              description: "A chronological list of emotional beats (minimum 6 points) representing the flow of the chapter.",
              items: {
                type: Type.OBJECT,
                properties: {
                  beat_description: { type: Type.STRING, description: "Short label for this moment (e.g., 'The Argument')" },
                  emotion_label: { type: Type.STRING, description: "One word emotion (e.g. Tension, Fear, Joy)" },
                  intensity: { type: Type.NUMBER, description: "1 to 10" },
                  color_hex: { type: Type.STRING, description: "Color code representing the emotion (e.g. #FF0000 for danger)" }
                }
              }
            },
            visuals: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING, enum: ['character_anchor', 'mood', 'location', 'action', 'symbolic'] },
                  description: { type: Type.STRING },
                  reuse: { type: Type.BOOLEAN }
                }
              }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Visual Selector Agent");
    
    return JSON.parse(text) as VisualPlanResponse;
  } catch (error: any) {
    console.error("Visual Plan Generation Error:", error);
    const errorMessage = error.message || JSON.stringify(error);
    if (errorMessage.includes("exceeds the supported page limit")) {
       throw new Error("Chapter file is too large. Please paste text directly or use a smaller file.");
    }
    throw error;
  }
};

/**
 * Role 3: Image Generator
 */
export const generateImageForItem = async (
  item: VisualItem,
  profile: VideoProfile,
  mood: { tone: string, palette_hint: string },
  characters: Character[] = []
): Promise<string> => {
  const ai = getAI();
  const styles: Record<VideoProfile, string> = {
    'Novel Explanation': 'digital art, semi-realistic, atmospheric lighting, detailed background, matte painting style, cinematic composition',
    'Anime Recap': 'high quality anime style, makoto shinkai inspired, vibrant colors, clean lines, cel shaded, dramatic lighting',
    'Manhwa Summary': 'webtoon style, korean manhwa aesthetic, bold colors, sharp details, dynamic angle, highly polished'
  };

  const selectedStyle = styles[profile];
  
  // Consistency Injection: We pass ALL characters present in the chapter.
  // The model is instructed to look for names in the description and apply the matching design.
  let characterContext = "";
  if (characters.length > 0) {
    characterContext = `
    --- CHARACTER VISUAL SHEET (STRICT CONSISTENCY REQUIRED) ---
    The following characters are defined in this scene's context. 
    IF (and only if) their name appears in the scene description below, YOU MUST generate them EXACTLY as described here.
    
    ${characters.map(c => `[NAME: ${c.name.toUpperCase()}]\nVISUALS: ${c.physical_description}`).join("\n\n")}
    ------------------------------------------------------------
    `;
  }

  const fullPrompt = `
    Style: ${selectedStyle}
    
    SCENE ACTION:
    ${item.description}
    
    ${characterContext}
    
    ATMOSPHERE & MOOD:
    ${mood.tone}, using a ${mood.palette_hint} color palette.
    Shot Type: ${item.type}
    
    TECHNICAL CONSTRAINTS: 
    - Aspect Ratio: 16:9
    - No text, speech bubbles, or UI elements.
    - High fidelity, sharp focus.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: fullPrompt }] },
      config: { imageConfig: { aspectRatio: "16:9" } }
    });
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    throw new Error("No image data returned");
  } catch (error) {
    console.error(`Image Gen Error for ${item.id}:`, error);
    throw error;
  }
};

/**
 * GENERATE CHARACTER PORTRAIT (Reference Sheet)
 */
export const generateCharacterPortrait = async (
  character: Character,
  profile: VideoProfile
): Promise<string> => {
  const ai = getAI();
  const styles: Record<VideoProfile, string> = {
    'Novel Explanation': 'digital art, character concept art, neutral background, detailed face, cinematic lighting, semi-realistic',
    'Anime Recap': 'anime character sheet, white background, high quality, studio ghibli style, clean lines, cel shaded',
    'Manhwa Summary': 'webtoon character profile, high detailed, glowing lighting, korean manhwa style, dynamic pose'
  };

  const prompt = `
    Type: Character Reference Sheet
    Style: ${styles[profile]}
    
    CHARACTER: ${character.name}
    DESCRIPTION: ${character.physical_description}
    
    Focus on creating a clear, definitive visual reference for this character.
    Front facing or 3/4 view. Neutral expression.
    Aspect Ratio: 1:1
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
      config: { imageConfig: { aspectRatio: "1:1" } }
    });
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    throw new Error("No image data returned");
  } catch (error) {
    console.error(`Portrait Gen Error for ${character.name}:`, error);
    throw error;
  }
};

/**
 * Role 4: Visual Refiner (Regenerate single item)
 * NOW SUPPORTS: Google Search if Title is provided.
 */
export const regenerateVisualDescription = async (
  currentType: string | VisualType,
  chapterText: string,
  currentDescription: string,
  bookTitle?: string
): Promise<{ type: string; description: string }> => {
  const ai = getAI();
  
  // Logic: Use Search if we have a title to ensure the refinement is accurate to lore
  const useSearch = !!bookTitle;
  const model = useSearch ? 'gemini-3-flash-preview' : 'gemini-2.5-flash';
  const tools = useSearch ? [{ googleSearch: {} }] : undefined;

  const systemInstruction = `
    You are a specialized Visual Director. Your goal is to IMPROVE a specific visual description for a video scene.
    ${useSearch ? `
    RESEARCH MODE: Use Google Search to verify details about the book "${bookTitle}".
    Ensure the improved description matches canonical character designs and setting details.
    ` : 'Make it more detailed, cinematic, and accurate to the source text.'}
    
    CRITICAL INSTRUCTION: Output ONLY valid JSON. Do not include markdown formatting. 
    DO NOT REPEAT THE PROVIDED CONTEXT TEXT IN YOUR OUTPUT.
    Keep the description concise (under 200 words).
  `;

  const prompt = `
    REGENERATE THIS VISUAL SCENE:
    
    Current Type: ${currentType}
    Current Description: ${currentDescription}
    
    Relevant Context (Chapter Segment):
    ${chapterText.slice(0, 8000)} 
    
    INSTRUCTIONS:
    1. Read the context and the current description.
    2. Create a BETTER, MORE VIVID description. 
    3. You may change the 'type' if another camera angle/shot type works better.
    4. Keep it concise but descriptive for an image generator (no dialogue, just visuals).
    
    Output JSON structure:
    {
      "type": "string (e.g., character_anchor, mood, location, action, symbolic)",
      "description": "string"
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: { parts: [{ text: prompt }] },
      config: {
        tools: tools,
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        maxOutputTokens: 2000,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING },
            description: { type: Type.STRING }
          }
        }
      }
    });

    let text = response.text || "{}";
    
    // Cleanup potential Markdown artifacts if model disobeys mimeType
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    return JSON.parse(text) as { type: string; description: string };
  } catch (error) {
    console.error("Visual Regeneration Error:", error);
    throw error;
  }
};

/**
 * EDIT EXISTING IMAGE
 * Uses an existing image + text prompt to generate a new version.
 */
export const editVisualImage = async (
  originalImageBase64: string,
  changePrompt: string
): Promise<string> => {
  const ai = getAI();
  
  // Extract base64 data and mime type for the API
  const matches = originalImageBase64.match(/^data:(.+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error("Invalid image data format");
  }
  const mimeType = matches[1];
  const base64Data = matches[2];

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType
            }
          },
          {
            text: `Edit instruction: ${changePrompt}. Maintain the original composition and style where possible.`
          }
        ]
      }
    });
    
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    throw new Error("No image data returned from edit");
  } catch (error) {
    console.error("Image Edit Error:", error);
    throw error;
  }
};
