
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

    const determinedLanguage = language || 'english';
    console.log(`🌍 Language used: ${determinedLanguage}`);

    // Parallel execution with timeout protection
    let natlasAnalysis;
    let enhancedNotes = notes;
    let culturalContext = '';
    let extractedSymptoms: string[] = [];
    let severity = 'moderate';

    // Try N-ATLAS with 10s timeout
    try {
      console.log(' Starting N-ATLAS analysis with 10s timeout...');
      
      const natlasPromise = analyzeForDoctorSuggestion(notes, determinedLanguage);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('N-ATLAS timeout')), 10000)
      );

      natlasAnalysis = await Promise.race([natlasPromise, timeoutPromise]) as any;
      
      if (natlasAnalysis?.success) {
        enhancedNotes = natlasAnalysis.enhanced_notes || notes;
        culturalContext = natlasAnalysis.cultural_context || '';
        extractedSymptoms = natlasAnalysis.medical_keywords || [];
        severity = natlasAnalysis.severity || 'moderate';
        
        console.log(`✅ N-ATLAS completed: ${natlasAnalysis.match_type} (${natlasAnalysis.similarity_score}%)`);
      }
    } catch (natlasError: any) {
      console.warn('⚠️ N-ATLAS failed/timeout, proceeding without enhancement:', natlasError.message);
      
    }

    // Simplified and faster AI prompt
    const systemPrompt = `You are a medical assistant. Based on symptoms, suggest 2-3 relevant doctors from this list:
${JSON.stringify(AiDoctorList.map(d => ({ name: d.name, specialty: d.specialty })))}

${extractedSymptoms.length > 0 ? `
Detected symptoms: ${extractedSymptoms.join(', ')}
Severity: ${severity}` : ''}

Return ONLY a JSON array of doctor names, no explanations.`;

    const userPrompt = `Patient symptoms: ${enhancedNotes}

Return JSON array of 2-3 most relevant doctor names from the list.`;

    console.log(' Calling OpenAI...');
    
    //  Faster OpenAI call with streaming disabled
    const completion = await Promise.race([
      openai.chat.completions.create({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3, 
        max_tokens: 200, 
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('OpenAI timeout')), 15000)
      )
    ]) as any;

    console.log(' OpenAI response received');

    const aiRaw = completion.choices[0].message?.content?.trim() || '';
    console.log('AI Raw Response:', aiRaw);

    //  Better JSON extraction
    let aiParsed: any[] = [];
    
    try {
      // Try direct parse first
      aiParsed = JSON.parse(aiRaw);
    } catch {
      // Extract JSON array from text
      const jsonMatch = aiRaw.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          aiParsed = JSON.parse(jsonMatch[0]);
        } catch (e) {
          console.error("❌ JSON parse failed:", e);
        }
      }
    }

    //  Fallback if AI fails
    if (!Array.isArray(aiParsed) || aiParsed.length === 0) {
      console.warn('⚠️ AI parsing failed, using fallback matching');
      
      // Fallback: Match by keywords
      const keywords = extractedSymptoms.length > 0 
        ? extractedSymptoms 
        : notes.toLowerCase().split(' ').filter(w => w.length > 4);

      const matched = AiDoctorList.filter(doc => {
        const docText = `${doc.name} ${doc.specialty} ${doc.description}`.toLowerCase();
        return keywords.some(keyword => docText.includes(keyword.toLowerCase()));
      }).slice(0, 3);

      // If still no match, return general practitioners
      const finalDoctors = matched.length > 0 
        ? matched 
        : AiDoctorList.filter(d => 
            d.specialty.toLowerCase().includes('general') || 
            d.specialty.toLowerCase().includes('family')
          ).slice(0, 2);

      return NextResponse.json({ 
        success: true, 
        data: finalDoctors,
        natlasEnhancement: natlasAnalysis ? {
          language: determinedLanguage,
          translation: natlasAnalysis.translation || '',
          culturalContext: culturalContext,
          severity: severity,
          detectedSymptoms: extractedSymptoms,
          recommendedSpecialties: natlasAnalysis.recommended_specialties || [],
          matchType: natlasAnalysis.match_type || 'fallback',
          similarityScore: natlasAnalysis.similarity_score || 0,
          cached: natlasAnalysis.cached || false
        } : null,
        fallbackUsed: true
      });
    }
    
    // Match doctors from AI response
    const matchedDoctors = AiDoctorList.filter(doc => 
      aiParsed.some((aiDoc: any) => {
        const aiName = typeof aiDoc === 'string' ? aiDoc : aiDoc.name;
        return aiName && doc.name.toLowerCase().includes(aiName.toLowerCase());
      })
    );

    console.log(`✅ Matched ${matchedDoctors.length} doctors`);

    // Return success response
    return NextResponse.json({ 
      success: true, 
      data: matchedDoctors.slice(0, 2), 
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
      } : null,
      fallbackUsed: false
    });

  } catch (error: any) {
    console.error('❌ suggested-ai-doctors-enhanced POST error:', error.message);
    
    // Return helpful error messages
    if (error.message.includes('timeout')) {
      return NextResponse.json({ 
        success: false, 
        error: 'Analysis took too long. Please try again with simpler symptoms.' 
      }, { status: 504 });
    }
    
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Internal Server Error' 
    }, { status: 500 });
  }
}