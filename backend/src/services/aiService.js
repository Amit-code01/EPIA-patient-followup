const Groq = require('groq-sdk');

async function generateMessage(patient) {
  if (!process.env.GROQ_API_KEY) return { message: `Hello ${patient.name}, this is a friendly reminder from the care team about your follow-up scheduled for today. Please contact us if you have any questions.`, provider: 'MOCK' };
  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const response = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile', temperature: 0.4, max_tokens: 120,
      messages: [
        { role: 'system', content: 'Write one concise, polite healthcare follow-up reminder suitable for WhatsApp. Do not mention diagnoses, treatment, medical advice, or outcomes. Include no information beyond the patient first name and that a follow-up is due today. Do not claim the message was sent.' },
        { role: 'user', content: `Patient first name: ${patient.name.trim().split(/\s+/)[0]}. Follow-up is due today.` }
      ]
    });
    const message = response.choices?.[0]?.message?.content?.trim();
    if (!message) throw new Error('Empty AI response');
    return { message, provider: 'GROQ' };
  } catch (error) {
    return { message: `Hello ${patient.name}, this is a friendly reminder from the care team about your follow-up scheduled for today. Please contact us if you have any questions.`, provider: 'MOCK' };
  }
}
module.exports = { generateMessage };

