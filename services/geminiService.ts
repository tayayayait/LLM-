import { GoogleGenAI } from "@google/genai";
import { SummaryLength, FileData } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const generateSummary = async (
  fileData: FileData,
  length: SummaryLength
): Promise<string> => {
  const lengthInstruction = length === SummaryLength.Short
    ? "3줄로 짧게 요약"
    : "한 문단으로 중간 길이로 요약";

  const basePrompt = `당신은 SK 하이닉스 직원을 돕는 유용한 어시스턴트입니다. 주어진 문서의 내용을 한국어로 요약하는 것이 당신의 임무입니다.
요약은 ${lengthInstruction}으로 해주세요.`;

  try {
    const promptForTextFile = `${basePrompt}
---
문서 내용:
${fileData.content}
---
요약:`;

    const promptForDocxFile = `${basePrompt}
---
아래 제공되는 파일 내용을 바탕으로 요약해주세요.
---
요약:`;
    
    const contents = fileData.isBase64
      ? {
          parts: [
            { text: promptForDocxFile },
            {
              inlineData: {
                data: fileData.content,
                mimeType: fileData.mimeType,
              },
            },
          ],
        }
      : promptForTextFile;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents,
    });
    return response.text;
  } catch (error) {
    console.error("Error generating summary:", error);
    if (error instanceof Error) {
        return `오류: 요약 생성에 실패했습니다. ${error.message}`;
    }
    return "요약을 생성하는 중 알 수 없는 오류가 발생했습니다.";
  }
};
