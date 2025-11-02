
















// import { openai } from "@/config/OpenAiModel";
// import { AiDoctorList } from "@/shared/doctorList";
// import { NextRequest, NextResponse } from "next/server";
// import { rateLimiter } from "@/lib/rateLimiter";

// export async function POST(req: NextRequest) {
//   if (!rateLimiter(req)) return NextResponse.json({ success: false, error: 'Too many requests' }, { status: 429 });

//   try {
//     const { notes } = await req.json();
//     if (!notes || typeof notes !== 'string' || notes.trim() === '')
//       return NextResponse.json({ success: false, error: 'Invalid notes' }, { status: 400 });

//     const completion = await openai.chat.completions.create({
//       model: 'meta-llama/llama-4-scout-17b-16e-instruct',
//       messages: [
//         { role: 'system', content: `You are a helpful medical assistant. Based on the user's symptoms, suggest which doctors from the following list are most relevant. Do not create new doctors. Only respond with doctors from this list:\n\n${JSON.stringify(AiDoctorList)}` },
//         { role: 'user', content: `User symptoms: ${notes}\n\nReturn ONLY a JSON array of relevant doctors from the provided list. Do not include explanations or markdown.` },
//       ],
//     });

//     const aiRaw = completion.choices[0].message?.content?.trim() || '';
//     const jsonStart = aiRaw.indexOf('[');
//     const jsonEnd = aiRaw.lastIndexOf(']') + 1;
//     if (jsonStart === -1 || jsonEnd === -1) throw new Error('No valid JSON array found');

//     const aiParsed = JSON.parse(aiRaw.slice(jsonStart, jsonEnd));
//     const matchedDoctors = AiDoctorList.filter(doc => aiParsed.some((aiDoc: any) => aiDoc.name === doc.name));

//     return NextResponse.json({ success: true, data: matchedDoctors });
//   } catch (error: any) {
//     console.error('❌ suggested-ai-doctors POST error:', error.message);
//     return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
//   }
// }











// import { openai } from '@/config/OpenAiModel';
// import { AiDoctorList } from '@/shared/doctorList';
// import { NextRequest, NextResponse } from 'next/server';

// export async function POST(req: NextRequest) {
//   const { notes } = await req.json();

//   try {
//     const completion = await openai.chat.completions.create({
//       model: "meta-llama/llama-4-scout-17b-16e-instruct",
//       messages: [
//         {
//           role: "system",
//           content: `You are a helpful medical assistant. Based on the user's symptoms, suggest which doctors from the following list are most relevant. Do not create new doctors. Only respond with doctors from this list:\n\n${JSON.stringify(AiDoctorList)}`
//         },
//         {
//           role: "user",
//           content: `User symptoms: ${notes}\n\nReturn ONLY a JSON array of relevant doctors from the provided list. Do not include explanations or markdown.`
//         }
//       ],
//     });

//     const aiRaw = completion.choices[0].message?.content?.trim() || '';
//     console.log("🤖 AI raw response:", aiRaw);

//     // Extract JSON array using regex (safe)
//     // @ts-ignore
//     const match = aiRaw.match(/\[.*\]/s);
//     if (!match) throw new Error("No valid JSON array found in AI response.");

//     const aiParsed = JSON.parse(match[0]);

    
//     const matchedDoctors = AiDoctorList.filter(doc =>
//       aiParsed.some((aiDoc: any) => aiDoc.name === doc.name)
//     );

//     return NextResponse.json(matchedDoctors, { status: 200 });

//   } catch (error) {
//     console.error("❌ Error occurred:", error);
//     return NextResponse.json(
//       {
//         error: "An error occurred while processing your request.",
//         message: (error as any)?.message || 'Unknown error'
//       },
//       { status: 500 }
//     );
//   }
// }
