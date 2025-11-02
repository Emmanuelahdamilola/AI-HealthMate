// // app/api/suggested-ai-doctors-enhanced/route.ts
// // Enhanced version with N-ATLAS integration

// import { openai } from "@/config/OpenAiModel";
// import { AiDoctorList } from "@/shared/doctorList";
// import { NextRequest, NextResponse } from "next/server";
// import { rateLimiter } from "@/lib/rateLimiter";
// import { analyzeForDoctorSuggestion } from "@/lib/natlas-service"; 

// export async function POST(req: NextRequest) {
//   if (!rateLimiter(req)) {
//     return NextResponse.json({ success: false, error: 'Too many requests' }, { status: 429 });
//   }

//   try {
//     const { notes, language } = await req.json();
    
//     if (!notes || typeof notes !== 'string' || notes.trim() === '') {
//       return NextResponse.json({ success: false, error: 'Invalid notes' }, { status: 400 });
//     }

//     // Step 1: Determine language. Rely on user input; default to 'english'.
//     // The backend (Render API) handles the universal search regardless of this tag.
//     const determinedLanguage = language || 'english';
//     console.log(`🌍 Language used: ${determinedLanguage} (User/Default)`);

//     // Step 2: Analyze with N-ATLAS for cultural context and translation
//     let natlasAnalysis;
//     let enhancedNotes = notes;
//     let culturalContext = '';
//     let extractedSymptoms: string[] = [];
//     let severity = 'moderate';

//     try {
//       // Pass the determined language to the backend for contextual fallback generation
//       natlasAnalysis = await analyzeForDoctorSuggestion(notes, determinedLanguage);
      
//       if (natlasAnalysis.success) {
//         // These fields are guaranteed to be populated now due to the Enhanced Fallback fix on the API
//         enhancedNotes = natlasAnalysis.enhanced_notes;
//         culturalContext = natlasAnalysis.cultural_insights.context;
//         extractedSymptoms = natlasAnalysis.keywords;
//         severity = natlasAnalysis.severity;
        
//         console.log(`✅ N-ATLAS Analysis: ${natlasAnalysis.match_type} (${natlasAnalysis.similarity_score}%)`);
//         console.log(`   Keywords: ${extractedSymptoms.join(', ')}`);
//       }
//     } catch (natlasError) {
//       console.warn('⚠️ N-ATLAS unavailable, proceeding without enhancement:', natlasError);
//       // Continue without N-ATLAS if it fails
//     }

//     // Step 3: Build enhanced prompt for AI doctor suggestion
//     const systemPrompt = `You are a helpful medical assistant specializing in Nigerian healthcare. 
// Based on the patient's symptoms, suggest which doctors from the following list are most relevant.

// ${natlasAnalysis ? `
// CULTURAL CONTEXT: ${culturalContext}
// DETECTED SYMPTOMS: ${extractedSymptoms.join(', ')}
// SEVERITY: ${severity}
// ` : ''}

// Available doctors:
// ${JSON.stringify(AiDoctorList)}

// IMPORTANT: Only suggest doctors from this list. Prioritize specialties that match the detected symptoms and severity.`;

//     const userPrompt = natlasAnalysis 
//       ? `Original patient input: "${notes}"
         
//          Translation/Analysis: ${natlasAnalysis.translation}
         
//          Enhanced medical context: ${enhancedNotes}
         
//          Return ONLY a JSON array of the most relevant doctors from the provided list. Select 2-4 doctors based on symptom match and severity. Do not include explanations or markdown.`
//       : `User symptoms: ${notes}\n\nReturn ONLY a JSON array of relevant doctors from the provided list. Do not include explanations or markdown.`;

//     // Step 4: Get AI suggestions with enhanced context
//     const completion = await openai.chat.completions.create({
//       model: 'meta-llama/llama-4-scout-17b-16e-instruct',
//       messages: [
//         { role: 'system', content: systemPrompt },
//         { role: 'user', content: userPrompt },
//       ],
//     });

//     const aiRaw = completion.choices[0].message?.content?.trim() || '';
//     const jsonStart = aiRaw.indexOf('[');
//     const jsonEnd = aiRaw.lastIndexOf(']') + 1;
    
//     if (jsonStart === -1 || jsonEnd === -1) {
//       throw new Error('No valid JSON array found');
//     }

//     // Use a try-catch for JSON.parse just in case the slicing is imperfect
//     let aiParsed: any[] = [];
//     try {
//         aiParsed = JSON.parse(aiRaw.slice(jsonStart, jsonEnd));
//     } catch (e) {
//         console.error("❌ Failed to parse final AI JSON output:", e, aiRaw);
//         // Fallback to empty array if parsing fails
//     }
    
//     const matchedDoctors = AiDoctorList.filter(doc => 
//       aiParsed.some((aiDoc: any) => aiDoc.name === doc.name)
//     );

//     // Step 5: Return enhanced response
//     return NextResponse.json({ 
//       success: true, 
//       data: matchedDoctors,
//       natlasEnhancement: natlasAnalysis ? {
//         language: determinedLanguage,
//         translation: natlasAnalysis.translation,
//         culturalContext: culturalContext,
//         severity: severity,
//         detectedSymptoms: extractedSymptoms,
//         recommendedSpecialties: natlasAnalysis.recommended_specialties,
//         matchType: natlasAnalysis.match_type,
//         cached: natlasAnalysis.cached
//       } : null
//     });

//   } catch (error: any) {
//     console.error('❌ suggested-ai-doctors-enhanced POST error:', error.message);
//     return NextResponse.json({ 
//       success: false, 
//       error: error.message || 'Internal Server Error' 
//     }, { status: 500 });
//   }
// }


// app/api/suggested-ai-doctors-enhanced/route.ts
// Enhanced version with N-ATLAS integration - FIXED

import { openai } from "@/config/OpenAiModel";
import { AiDoctorList } from "@/shared/doctorList";
import { NextRequest, NextResponse } from "next/server";
import { rateLimiter } from "@/lib/rateLimiter";
import { analyzeForDoctorSuggestion } from "@/lib/natlas-service"; 

export async function POST(req: NextRequest) {
  if (!rateLimiter(req)) {
    return NextResponse.json({ success: false, error: 'Too many requests' }, { status: 429 });
  }

  try {
    const { notes, language } = await req.json();
    
    if (!notes || typeof notes !== 'string' || notes.trim() === '') {
      return NextResponse.json({ success: false, error: 'Invalid notes' }, { status: 400 });
    }

    // Step 1: Determine language. Rely on user input; default to 'english'.
    const determinedLanguage = language || 'english';
    console.log(`🌍 Language used: ${determinedLanguage} (User/Default)`);

    // Step 2: Analyze with N-ATLAS for cultural context and translation
    let natlasAnalysis;
    let enhancedNotes = notes;
    let culturalContext = '';
    let extractedSymptoms: string[] = [];
    let severity = 'moderate';

    try {
      natlasAnalysis = await analyzeForDoctorSuggestion(notes, determinedLanguage);
      
      if (natlasAnalysis.success) {
        // ✅ FIXED: Using correct property names from NatlasAnalysisResponse
        enhancedNotes = natlasAnalysis.enhanced_notes || notes;
        culturalContext = natlasAnalysis.cultural_context || '';  // Fixed from cultural_insights.context
        extractedSymptoms = natlasAnalysis.medical_keywords || [];  // Fixed from keywords
        severity = natlasAnalysis.severity || 'moderate';
        
        console.log(`✅ N-ATLAS Analysis: ${natlasAnalysis.match_type} (${natlasAnalysis.similarity_score}%)`);
        console.log(`   Keywords: ${extractedSymptoms.join(', ')}`);
      }
    } catch (natlasError) {
      console.warn('⚠️ N-ATLAS unavailable, proceeding without enhancement:', natlasError);
      // Continue without N-ATLAS if it fails
    }

    // Step 3: Build enhanced prompt for AI doctor suggestion
    const systemPrompt = `You are a helpful medical assistant specializing in Nigerian healthcare. 
Based on the patient's symptoms, suggest which doctors from the following list are most relevant.

${natlasAnalysis ? `
CULTURAL CONTEXT: ${culturalContext}
DETECTED SYMPTOMS: ${extractedSymptoms.join(', ')}
SEVERITY: ${severity}
` : ''}

Available doctors:
${JSON.stringify(AiDoctorList)}

IMPORTANT: Only suggest doctors from this list. Prioritize specialties that match the detected symptoms and severity.`;

    const userPrompt = natlasAnalysis 
      ? `Original patient input: "${notes}"
         
         Translation/Analysis: ${natlasAnalysis.translation}
         
         Enhanced medical context: ${enhancedNotes}
         
         Return ONLY a JSON array of the most relevant doctors from the provided list. Select 2-4 doctors based on symptom match and severity. Do not include explanations or markdown.`
      : `User symptoms: ${notes}\n\nReturn ONLY a JSON array of relevant doctors from the provided list. Do not include explanations or markdown.`;

    // Step 4: Get AI suggestions with enhanced context
    const completion = await openai.chat.completions.create({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });

    const aiRaw = completion.choices[0].message?.content?.trim() || '';
    const jsonStart = aiRaw.indexOf('[');
    const jsonEnd = aiRaw.lastIndexOf(']') + 1;
    
    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error('No valid JSON array found');
    }

    // Parse AI response with error handling
    let aiParsed: any[] = [];
    try {
      aiParsed = JSON.parse(aiRaw.slice(jsonStart, jsonEnd));
    } catch (e) {
      console.error("❌ Failed to parse final AI JSON output:", e, aiRaw);
      // Fallback to empty array if parsing fails
    }
    
    const matchedDoctors = AiDoctorList.filter(doc => 
      aiParsed.some((aiDoc: any) => aiDoc.name === doc.name)
    );

    // Step 5: Return enhanced response
    return NextResponse.json({ 
      success: true, 
      data: matchedDoctors,
      natlasEnhancement: natlasAnalysis ? {
        language: determinedLanguage,
        translation: natlasAnalysis.translation || '',
        culturalContext: culturalContext,
        severity: severity,
        detectedSymptoms: extractedSymptoms,
        recommendedSpecialties: natlasAnalysis.recommended_specialties || [],
        matchType: natlasAnalysis.match_type || 'unknown',
        similarityScore: natlasAnalysis.similarity_score || 0,
        cached: natlasAnalysis.cached || false
      } : null
    });

  } catch (error: any) {
    console.error('❌ suggested-ai-doctors-enhanced POST error:', error.message);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Internal Server Error' 
    }, { status: 500 });
  }
}