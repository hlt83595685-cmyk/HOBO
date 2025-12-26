import { GoogleGenAI, Type } from "@google/genai";

const getAiClient = () => {
  if (!process.env.API_KEY) {
    throw new Error("API Key not found in environment variables");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

/**
 * Streams the PDF analysis using gemini-3-flash-preview.
 */
export const streamPdfAnalysis = async (
  base64Data: string,
  onChunk: (text: string) => void
): Promise<void> => {
  const ai = getAiClient();
  const model = "gemini-3-flash-preview";

  const prompt = `
    你是一位资深的学术科研助手。请分析上传的 PDF 学术论文。
    
    请严格按照以下结构输出，使用严谨、专业的学术中文，并使用 Markdown 格式排版。
    
    **重要格式要求**：
    1.  **HTML 颜色支持**：请在输出“论文元数据”时，严格使用 HTML \`<span>\` 标签配合内联样式来实现颜色要求（见下文）。
    2.  **章节标题**：请使用 Markdown 的三级标题 \`###\` 来标注“作者工作总结”、“创新技术与贡献”等子栏目，以便前端渲染为大号加粗字体。
    3.  **重点提亮（关键）**：请将正文中的“**核心改进方法**”、“**关键创新点**”以及“**重要实验结论**”用 Markdown 粗体（**...**）进行标注。
    4.  **禁止表格**：请勿生成 Markdown 表格，用列表形式呈现。
    5.  **显著分段**：段落之间保持空行。
    6.  **Latex**：数学符号使用 LaTeX 格式（$...$ 或 $$...$$）。

    请严格按以下顺序和章节输出：

    # 0. 论文元数据
    请在报告最开头提取以下信息，并严格使用指定的 HTML 样式：
    *   **标题**：<span style="color:black; font-weight:bold; font-size: 1.2em;">(在此填入论文英文或中文原标题)</span>
    *   **年份**：<span style="color:#dc2626; font-weight:bold;">(在此填入发表年份)</span>
    *   **期刊与分区**：<span style="color:#16a34a; font-weight:bold;">(在此填入期刊名称，并估计其中科院分区，如“CVPR (CCF-A)”或“Nature (Q1)”)</span>
    (请换行)
    ---

    # 1. 核心内容提取
    ### 作者工作总结
    (请换行) 简要概括论文的核心思想和主要工作。

    ### 创新技术与贡献
    (请换行) 详细列出论文的创新点。**对于具体的改进算法或架构名称，请务必加粗**。

    ### 实验方法
    (请换行) 概括论文使用的核心实验方法。**对于核心的方法论步骤，请务必加粗**。

    # 2. 数据与实验分析
    ### 关键数据趋势
    (请换行) 识别文中的关键对比数据（如 Accuracy, F1-Score 等）。**请将最优结果数据加粗**。用文字详细描述实验结果的优劣对比。

    ### 图表内容解读
    (请换行) 识别文中关键的图表，并用文字描述其内容和含义。

    # 3. 结论与展望
    *   (请换行) 简短总结论文的结论及未来展望。
  `;

  try {
    const responseStream = await ai.models.generateContentStream({
      model,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "application/pdf",
              data: base64Data,
            },
          },
          { text: prompt },
        ],
      },
    });

    for await (const chunk of responseStream) {
      if (chunk.text) {
        onChunk(chunk.text);
      }
    }
  } catch (error) {
    console.error("Error streaming analysis:", error);
    throw error;
  }
};

/**
 * Generates a methodology illustration based on the PDF content.
 * Updated to generate a logic diagram/flowchart in English.
 */
export const generateMethodologyIllustration = async (
  base64Data: string
): Promise<{ imageUrl: string; promptUsed: string }> => {
  const ai = getAiClient();

  // Step 1: Extract Image Prompt
  const extractionPrompt = `
    Based on the 'Methodology', 'System Architecture', or 'Implementation' section of the attached paper, 
    describe the core technical logic or pipeline.
    
    Create a detailed prompt for an image generator following these rules:
    1. **Visual Style**: Technical Block Diagram or Flowchart. Clean, flat 2D style, white background. 
       Use geometric shapes (rectangles, diamonds) and arrows. High contrast.
       Do NOT use realistic 3D rendering or photorealism.
    2. **Content**: Clearly describe the flow of data or logic.
    3. **Language**: Explicitly state that ALL text labels inside the diagram MUST be in **ENGLISH**. 
    
    Output ONLY the prompt description.
  `;

  const promptResponse = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        { inlineData: { mimeType: "application/pdf", data: base64Data } },
        { text: extractionPrompt },
      ],
    },
  });

  const imagePrompt = promptResponse.text?.trim() || "A technical block diagram of the research methodology.";
  
  // Refine prompt for image model
  // Added "Times New Roman" font requirement
  const finalImagePrompt = `Technical block diagram, flowchart, flat design, white background, high quality line art. 
  Text labels MUST be in ENGLISH and use 'Times New Roman' font. 
  ${imagePrompt}`;

  // Step 2: Generate Image
  const imageResponse = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: {
      parts: [
        { text: finalImagePrompt }
      ]
    },
    config: {
        imageConfig: {
            aspectRatio: "16:9" 
        }
    }
  });

  // Extract Image
  let imageUrl = "";
  if (imageResponse.candidates?.[0]?.content?.parts) {
    for (const part of imageResponse.candidates[0].content.parts) {
      if (part.inlineData) {
        imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        break;
      }
    }
  }

  if (!imageUrl) {
    throw new Error("No image data returned from Gemini.");
  }

  return { imageUrl, promptUsed: finalImagePrompt };
};