import { Message } from 'ai'

interface VoiceOutputProps {
  messages: Message[]
}

export default function VoiceOutput({ messages }: VoiceOutputProps) {
  return (
    <div className="mt-4 p-4 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-2">AI Responses:</h2>
      {messages.map((message) => (
        <div key={message.id} className="mb-2">
          <strong>{message.role}:</strong> {message.content}
        </div>
      ))}
    </div>
  )
}

