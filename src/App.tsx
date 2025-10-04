import React, { useState, useRef, useEffect } from 'react';
import parseLLMJson from './utils/jsonParser';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface AgentResponse {
  response: {
    message: string;
    tone: string;
    focus_area: string;
    conversation_type: string;
  };
  metadata: {
    response_type: string;
    safety_level: string;
    engagement_style: string;
  };
}

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateRandomId = () => {
    return Math.random().toString(36).substr(2, 9);
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: generateRandomId(),
      text: inputText,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    try {
      const userId = `user${generateRandomId()}@test.com`;
      const sessionId = `session${generateRandomId()}`;

      const response = await fetch('https://agent-prod.studio.lyzr.ai/v3/inference/chat/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'sk-default-obhGvAo6gG9YT9tu6ChjyXLqnw7TxSGY'
        },
        body: JSON.stringify({
          user_id: userId,
          agent_id: '68e0e2a0615699d53b623bbc',
          session_id: sessionId,
          message: inputText
        })
      });

      const data = await response.text();
      let agentResponse: AgentResponse;

      try {
        // Extract JSON from markdown code blocks if present
        const jsonMatch = data.match(/```json\s*([\s\S]*?)\s*```/);
        const jsonData = jsonMatch ? jsonMatch[1] : data;

        let parsed = parseLLMJson(jsonData);

        // If parseLLMJson returns a failure object, fall back to manual parsing
        if (parsed && typeof parsed === 'object' && (parsed as any).success === false) {
          parsed = JSON.parse(jsonData);
        }

        // Check if the parsed data has the expected structure
        if (parsed && (parsed as AgentResponse).response && (parsed as AgentResponse).response.message) {
          agentResponse = parsed as AgentResponse;
        } else {
          throw new Error('Invalid response format');
        }
      } catch (error) {
        console.error('Agent response error:', error);
        console.error('Raw response:', data);
        agentResponse = {
          response: {
            message: "Tell me more about what is on your mind, I am here to listen and support you.",
            tone: "supportive",
            focus_area: "emotional_support",
            conversation_type: "active_listening"
          },
          metadata: {
            response_type: "therapeutic",
            safety_level: "appropriate",
            engagement_style: "supportive"
          }
        };
      }

      const botMessage: Message = {
        id: generateRandomId(),
        text: agentResponse.response.message,
        isUser: false,
        timestamp: new Date()
      };

      setTimeout(() => {
        setMessages(prev => [...prev, botMessage]);
        setIsTyping(false);
      }, 1000);

    } catch (error) {
      console.error('Error contacting agent:', error);
      const errorMessage: Message = {
        id: generateRandomId(),
        text: "I am here for you. Sometimes it is good to just be present with your feelings. How are you feeling right now?",
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-green-50 to-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-purple-100">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-center">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">🧘</span>
            <h1 className="text-2xl font-semibold text-gray-700 tracking-wide">
              MindMate
            </h1>
          </div>
        </div>
      </header>

      {/* Chat Container */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-6 py-8">
        <div className="bg-white rounded-3xl shadow-lg h-full flex flex-col">
          {/* Messages Area */}
          <div className="flex-1 p-6 overflow-y-auto">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="text-6xl">💭</div>
                  <h2 className="text-xl font-medium text-gray-600">Welcome to MindMate</h2>
                  <p className="text-gray-500 max-w-md">
                    This is a calm, judgment-free space for you to share your thoughts and feelings.
                    I am here to listen and support you.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.isUser ? 'justify-end' : 'justify-start'
                    } animate-fade-in`}
                  >
                    {!message.isUser && (
                      <div className="w-8 h-8 bg-purple-200 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                        <span className="text-lg">🤍</span>
                      </div>
                    )}
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-sm ${
                        message.isUser
                          ? 'bg-gray-100 text-gray-800 rounded-br-lg'
                          : 'bg-purple-100 text-gray-800 rounded-bl-lg'
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{message.text}</p>
                      <p className={`text-xs mt-2 opacity-70 ${
                        message.isUser ? 'text-right' : 'text-left'
                      }`}>
                        {message.timestamp.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="w-8 h-8 bg-purple-200 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                      <span className="text-lg">🤍</span>
                    </div>
                    <div className="bg-purple-100 px-4 py-3 rounded-2xl rounded-bl-lg shadow-sm">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t border-purple-100 p-6">
            <div className="flex items-end space-x-3">
              <div className="flex-1">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Share your thoughts..."
                  className="w-full px-4 py-3 border-2 border-purple-200 rounded-2xl focus:outline-none focus:border-purple-300 resize-none bg-gray-50 text-gray-700 placeholder-gray-500 transition-colors"
                  rows={1}
                  disabled={isTyping}
                />
              </div>
              <button
                onClick={sendMessage}
                disabled={!inputText.trim() || isTyping}
                className="bg-purple-300 hover:bg-purple-400 disabled:bg-gray-300 disabled:cursor-not-allowed text-white p-3 rounded-2xl transition-colors shadow-sm"
              >
                <svg className="w-5 h-5 transform rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;