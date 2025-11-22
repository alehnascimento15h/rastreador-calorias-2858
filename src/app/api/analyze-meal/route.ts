import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ""
})

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json()

    if (!image) {
      return NextResponse.json(
        { error: "Imagem não fornecida" },
        { status: 400 }
      )
    }

    // Analyze image with OpenAI Vision
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analise esta imagem de refeição e retorne APENAS um JSON válido no seguinte formato:
{
  "mealName": "nome descritivo da refeição em português",
  "calories": número estimado de calorias (apenas o número, sem texto)
}

Seja preciso na estimativa de calorias considerando porções visíveis. Retorne APENAS o JSON, sem texto adicional.`
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
      max_tokens: 300,
      temperature: 0.3
    })

    const content = response.choices[0]?.message?.content || ""
    
    // Parse JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error("Resposta inválida da IA")
    }

    const result = JSON.parse(jsonMatch[0])

    return NextResponse.json({
      mealName: result.mealName,
      calories: parseInt(result.calories)
    })
  } catch (error) {
    console.error("Erro ao analisar refeição:", error)
    return NextResponse.json(
      { error: "Erro ao analisar imagem" },
      { status: 500 }
    )
  }
}
