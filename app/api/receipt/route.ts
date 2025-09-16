import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENAI_KEY,
  defaultHeaders: {
    "HTTP-Referer": process.env.URL_DOMAIN || "http://localhost:3000",
    "X-Title": "Expenses App",
  },
});

// Updated list with Qwen 2.5 VL 72B as the primary choice
const VISION_MODELS = [
  "qwen/qwen2.5-vl-72b-instruct:free",      // Your preferred choice - most capable
  "qwen/qwen2.5-vl-32b-instruct:free",      // Backup Qwen model
  "google/gemma-3-27b:free",                 // Google's latest multimodal
  "google/gemma-3-12b:free",                 // Smaller Google model
  "google/gemini-2.0-flash-exp:free",        // Original fallback
];

// In your /api/receipt/route.ts file, replace the current prompt with this improved version:

const improvedPrompt = `You are an expert receipt analyzer. Extract the store name and total amount from this receipt image.

STORE NAME:
- Look at the TOP of the receipt for the business name
- Usually the largest, most prominent text at the beginning
- Can be in Hebrew, English, German, or any language
- Examples: "רמי לוי", "EDEKA", "Walmart", "סופר פארם"
- IGNORE addresses, phone numbers, dates, receipt numbers

TOTAL AMOUNT:
- Find the final total amount to pay (usually at BOTTOM)
- Look for keywords: "TOTAL", "סה״כ", "GESAMT", "SUMME"
- Extract only the numeric value (ignore currency symbols ₪€$)
- Ignore subtotals, tax amounts, individual item prices

Return this exact JSON format:
{
  "storeName": "exact business name from receipt",
  "totalAmount": numeric_value_only
}

Examples:
- Store "רמי לוי שיווק השקל" → "storeName": "רמי לוי שיווק השקל"
- Total "סה״כ לתשלום ₪45.50" → "totalAmount": 45.50
- Store "EDEKA Markt" → "storeName": "EDEKA Markt"
- Total "GESAMT €23.45" → "totalAmount": 23.45`;

async function tryModel(model: string, image: string) {
  console.log(`Trying model: ${model}`);
  
  const completion = await openai.chat.completions.create({
    model: model,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: improvedPrompt
          },
          {
            type: "image_url",
            image_url: {
              url: image
            }
          }
        ]
      }
    ],
    temperature: 0.1,
    max_tokens: 300,
  });

  return completion.choices[0].message.content;
}

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json();

    if (!image) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    let responseText = null;
    let usedModel = null;
    let lastError = null;

    // Try each model until one works
    for (const model of VISION_MODELS) {
      try {
        responseText = await tryModel(model, image);
        usedModel = model;
        console.log(`✅ Successfully used model: ${model}`);
        break;
      } catch (error: any) {
        console.log(`❌ Model ${model} failed:`, error.message);
        lastError = error;
        
        // Continue to next model for any error
        continue;
      }
    }

    // If no model worked
    if (!responseText) {
      console.error('All models failed. Last error:', lastError);
      return NextResponse.json(
        { 
          error: 'All AI models are currently unavailable. Please try again later or enter details manually.',
          code: 'ALL_MODELS_FAILED',
          lastError: lastError?.message || 'Unknown error'
        },
        { status: 503 }
      );
    }

    // Enhanced JSON parsing with better error handling
    let extractedData;
    try {
      // Clean the response - remove any markdown formatting
      let cleanedResponse = responseText.trim();
      
      // Remove markdown code blocks if present
      cleanedResponse = cleanedResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      
      // Look for JSON in the response
      const jsonMatch = cleanedResponse.match(/\{[^}]*\}/);
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }

      // Validate the JSON structure
      if (!extractedData.hasOwnProperty('storeName') || !extractedData.hasOwnProperty('totalAmount')) {
        throw new Error('Invalid JSON structure');
      }

    } catch (parseError) {
      console.log('JSON parsing failed, trying manual extraction from:', responseText);
      
      // Enhanced fallback extraction with more patterns
      const storePatterns = [
        /(?:store|shop|business|merchant)[^\w]*[:\-]?\s*([^\n\r,]+)/i,
        /(?:name|business name)[^\w]*[:\-]?\s*([^\n\r,]+)/i,
        /"storeName"[^\w]*[:\-]?\s*"([^"]+)"/i,
        /store[^\w]*([A-Za-z\s]+)/i,
      ];
      
      const amountPatterns = [
        /(?:total|amount|sum|price)[^\w]*[:\-]?\s*(\d+(?:\.\d{1,2})?)/i,
        /"totalAmount"[^\w]*[:\-]?\s*(\d+(?:\.\d{1,2})?)/i,
        /(\d+\.\d{2})/g, // Decimal numbers
        /₪\s*(\d+(?:\.\d{2})?)/g, // Shekel amounts
        /\$\s*(\d+(?:\.\d{2})?)/g, // Dollar amounts
        /€\s*(\d+(?:\.\d{2})?)/g, // Euro amounts
      ];
      
      let storeName = 'Unknown';
      let totalAmount = 0;
      
      // Try to find store name
      for (const pattern of storePatterns) {
        const match = responseText?.match(pattern);
        if (match && match[1] && match[1].trim().length > 0) {
          storeName = match[1].trim().replace(/['"]/g, '').substring(0, 100);
          break;
        }
      }
      
      // Try to find amount
      for (const pattern of amountPatterns) {
        const matches = responseText?.match(pattern);
        if (matches) {
          const numbers = matches.map(m => {
            const num = m.replace(/[^\d.]/g, '');
            return parseFloat(num);
          }).filter(n => !isNaN(n) && n > 0);
          
          if (numbers.length > 0) {
            totalAmount = Math.max(...numbers); // Take the largest number
            break;
          }
        }
      }
      
      extractedData = { storeName, totalAmount };
    }

    // Final validation and cleanup
    if (typeof extractedData.totalAmount === 'string') {
      extractedData.totalAmount = parseFloat(extractedData.totalAmount) || 0;
    }
    
    // Ensure reasonable bounds
    if (isNaN(extractedData.totalAmount) || extractedData.totalAmount < 0 || extractedData.totalAmount > 999999) {
      extractedData.totalAmount = 0;
    }
    
    // Clean store name
    if (typeof extractedData.storeName !== 'string' || extractedData.storeName.length > 100) {
      extractedData.storeName = 'Unknown';
    }

    // Remove extra whitespace and clean up store name
    extractedData.storeName = extractedData.storeName.trim();
    
    return NextResponse.json({
      success: true,
      data: {
        storeName: extractedData.storeName,
        totalAmount: Math.round(extractedData.totalAmount * 100) / 100 // Round to 2 decimals
      },
      usedModel: usedModel?.split('/')[1] || usedModel, // Show just the model name
      rawResponse: responseText
    });

  } catch (error: any) {
    console.error('Error processing receipt:', error);
    
    // Handle specific error types
    if (error.status === 429) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded. Please wait a moment and try again.',
          code: 'RATE_LIMIT_EXCEEDED'
        },
        { status: 429 }
      );
    }
    
    if (error.status === 401) {
      return NextResponse.json(
        { 
          error: 'Invalid API key. Please check your OpenRouter configuration.',
          code: 'INVALID_API_KEY'
        },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to process receipt. Please try again later.',
        code: 'PROCESSING_ERROR',
        details: error.message
      },
      { status: 500 }
    );
  }
}
