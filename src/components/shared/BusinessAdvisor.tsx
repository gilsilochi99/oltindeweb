
'use client';

import { useState } from 'react';
import { Bot, User, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { businessAdvisor } from '@/ai/flows/business-advisor';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { cn } from '@/lib/utils';
import { marked } from 'marked';


interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function BusinessAdvisor() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setInput('');
    setError(null);

    try {
      const result = await businessAdvisor({ question: input });
      if (result && result.response) {
        const assistantMessage: Message = { role: 'assistant', content: result.response };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error('No se ha podido obtener respuesta.');
      }
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Ocurrió un error al contactar al asistente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="max-w-3xl mx-auto">
      <CardContent className="p-4">
        <div className="flex flex-col h-[400px]">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.length === 0 && (
                 <div className="text-center text-muted-foreground pt-16">
                    <p>Ej: "¿Qué empresas de construcción están verificadas?"</p>
                </div>
              )}
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={cn(
                    'flex items-start gap-3',
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                    {message.role === 'assistant' && (
                        <Avatar className="h-8 w-8">
                            <AvatarFallback><Bot /></AvatarFallback>
                        </Avatar>
                    )}
                  <div
                    className={cn(
                      'p-3 rounded-lg max-w-sm',
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}
                  >
                     <div
                        className="prose prose-sm max-w-none text-foreground dark:text-foreground"
                        dangerouslySetInnerHTML={{ __html: marked(message.content) as string }}
                    />
                  </div>
                   {message.role === 'user' && (
                        <Avatar className="h-8 w-8">
                            <AvatarFallback><User /></AvatarFallback>
                        </Avatar>
                    )}
                </div>
              ))}
              {isLoading && (
                <div className="flex items-start gap-3 justify-start">
                     <Avatar className="h-8 w-8">
                        <AvatarFallback><Bot /></AvatarFallback>
                    </Avatar>
                     <div className="p-3 rounded-lg bg-muted">
                        <Loader2 className="w-5 h-5 animate-spin" />
                    </div>
                </div>
              )}
              {error && <p className="text-sm text-destructive text-center">{error}</p>}
            </div>
          </ScrollArea>
          <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t p-4">
            <Input
              type="text"
              placeholder="Escriba su pregunta..."
              value={input}
              onChange={handleInputChange}
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading || !input.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
