import { NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import { createClient } from '@/lib/supabase/server'

const SYSTEM_PROMPT = `You are a livestock health triage assistant for farmers in Pakistan. You respond in the same language the farmer used (Urdu or English) — match it exactly, including using natural Urdu script, not transliteration, if they wrote in Urdu.

Given an animal's type, age, and reported symptoms (structured signs + free text + optional photo description), you must respond with exactly these four sections:

1. Possible Conditions: List 2-3 plausible conditions in plain, non-technical language a farmer would understand (e.g. mastitis, foot-and-mouth disease, tick fever, bloat, internal parasites). Never state a single certain diagnosis.

2. Urgency Level: Choose exactly one — "Emergency" (see a vet within hours), "See a vet soon" (within 1-2 days), or "Monitor at home" (recheck in 24-48 hours). Base this on symptom severity and combinations (e.g. bloat + distress = Emergency; mild appetite loss alone = Monitor).

3. Safe First-Aid Advice: General, non-medical safe actions only — isolate the animal, ensure water access, keep it in shade, avoid stress, do not milk if mastitis is suspected. NEVER name a specific drug, dosage, or injection. NEVER recommend antibiotics or any prescription treatment.

4. Disclaimer: Always end with a clear statement that this is an AI-generated preliminary triage, not a veterinary diagnosis, and that the farmer should contact a registered veterinarian for anything beyond mild/routine symptoms — phrase this naturally in the response language.

If the input is too vague to assess, ask ONE clarifying question instead of guessing.

If symptoms suggest a contagious disease outbreak risk (e.g. foot-and-mouth, avian flu signs), explicitly flag this as Emergency and advise isolating the animal from the rest of the herd immediately.

You MUST respond with ONLY a valid JSON object — no markdown, no code fences, no explanation before or after. Example format:
{"possibleConditions":"...","urgencyLevel":"See a vet soon","firstAid":"...","disclaimer":"..."}`

export async function POST(request: Request) {
  try {
    // Auth check
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { animalType, animalAge, symptoms, freeText, language, photoCaption } = body

    if (!animalType) {
      return NextResponse.json({ error: 'Animal type is required' }, { status: 400 })
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Gemini API key not configured in .env.local' }, { status: 500 })
    }

    // Build the prompt
    const ageStr = animalAge?.years
      ? `${animalAge.years} year(s)${animalAge.months ? ` and ${animalAge.months} month(s)` : ''}`
      : animalAge?.months ? `${animalAge.months} month(s)` : 'unknown age'

    const symptomsStr = symptoms?.length > 0 ? symptoms.join(', ') : 'No specific symptoms selected'

    const userMessage = language === 'ur'
      ? `جانور کی قسم: ${animalType}\nعمر: ${ageStr}\nعلامات: ${symptomsStr}\nتفصیل: ${freeText || 'کوئی اضافی تفصیل نہیں'}${photoCaption ? `\nتصویر: ${photoCaption}` : ''}`
      : `Animal Type: ${animalType}\nAge: ${ageStr}\nReported Symptoms: ${symptomsStr}\nAdditional Description: ${freeText || 'None provided'}${photoCaption ? `\nPhoto: ${photoCaption}` : ''}`

    // Call Gemini using new @google/genai SDK
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: userMessage,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        maxOutputTokens: 1024,
        temperature: 0.3,
        responseMimeType: 'application/json',
      },
    })

    const responseText = response.text?.trim() ?? ''

    // Parse JSON
    let parsed: {
      possibleConditions: string
      urgencyLevel: string
      firstAid: string
      disclaimer: string
    }

    try {
      const clean = responseText
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim()
      parsed = JSON.parse(clean)
      if (!parsed.possibleConditions || !parsed.urgencyLevel) throw new Error('incomplete')
    } catch {
      // Fallback in case JSON parsing fails
      parsed = {
        possibleConditions: responseText || 'Unable to determine — please describe symptoms more clearly.',
        urgencyLevel: 'See a vet soon',
        firstAid: language === 'ur'
          ? 'جانور کو الگ رکھیں، صاف پانی فراہم کریں اور سایے میں رکھیں۔'
          : 'Isolate the animal, provide clean water, keep in shade, and reduce stress.',
        disclaimer: language === 'ur'
          ? 'یہ AI سے تیار کردہ ابتدائی جائزہ ہے، ویٹرنری تشخیص نہیں۔ کسی بھی سنگین علامت کے لیے فوری طور پر رجسٹرڈ جانوروں کے ڈاکٹر سے رابطہ کریں۔'
          : 'This is an AI-generated preliminary triage, not a veterinary diagnosis. Please contact a registered veterinarian for any serious or worsening symptoms.',
      }
    }

    return NextResponse.json({ ...parsed, raw: responseText })

  } catch (error) {
    console.error('Triage API error:', error)
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: `Triage failed: ${msg}` }, { status: 500 })
  }
}
