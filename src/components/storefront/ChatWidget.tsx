'use client'

import { useEffect, useRef } from 'react'
import { MessageCircle, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import type { ChatMessageType } from './types'

interface ChatWidgetProps {
  chatOpen: boolean
  setChatOpen: (open: boolean) => void
  chatMessages: ChatMessageType[]
  chatInput: string
  setChatInput: (val: string) => void
  chatLoading: boolean
  chatName: string
  setChatName: (val: string) => void
  chatEmail: string
  setChatEmail: (val: string) => void
  chatRegistered: boolean
  onRegister: () => void
  onSend: () => void
}

export function ChatWidget({
  chatOpen,
  setChatOpen,
  chatMessages,
  chatInput,
  setChatInput,
  chatLoading,
  chatName,
  setChatName,
  chatEmail,
  setChatEmail,
  chatRegistered,
  onRegister,
  onSend,
}: ChatWidgetProps) {
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setChatOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
        style={{ animation: 'breathing 2s ease-in-out infinite' }}
        aria-label="Ouvrir le chat"
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {/* Chat Sheet */}
      <Sheet open={chatOpen} onOpenChange={setChatOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
          <SheetHeader className="bg-emerald-600 text-white px-4 py-3 rounded-none border-0">
            <SheetTitle className="text-white flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Chat avec CongoClean
            </SheetTitle>
            <SheetDescription className="text-emerald-100">Nous répondons rapidement</SheetDescription>
          </SheetHeader>

          {!chatRegistered ? (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="w-full max-w-sm space-y-4">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                    <MessageCircle className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Bienvenue !</h3>
                  <p className="text-gray-500 text-sm mt-1">Entrez vos informations pour commencer</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="chat-name">Nom <span className="text-red-500">*</span></Label>
                  <Input
                    id="chat-name"
                    placeholder="Votre nom"
                    value={chatName}
                    onChange={(e) => setChatName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="chat-email">Email (optionnel)</Label>
                  <Input
                    id="chat-email"
                    type="email"
                    placeholder="votre@email.com"
                    value={chatEmail}
                    onChange={(e) => setChatEmail(e.target.value)}
                  />
                </div>
                <Button
                  onClick={onRegister}
                  disabled={chatLoading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {chatLoading ? '...' : 'Commencer le chat'}
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Messages */}
              <ScrollArea className="flex-1 p-4" style={{ maxHeight: 'calc(100vh - 180px)' }}>
                <div className="space-y-3">
                  {chatMessages.length === 0 && (
                    <div className="text-center text-gray-400 text-sm py-8">
                      <p>Début de la conversation</p>
                      <p className="text-xs mt-1">Envoyez-nous un message !</p>
                    </div>
                  )}
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.senderType === 'customer' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                          msg.senderType === 'customer'
                            ? 'bg-emerald-600 text-white rounded-br-md'
                            : 'bg-gray-100 text-gray-800 rounded-bl-md'
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
              </ScrollArea>

              {/* Chat Input */}
              <div className="p-3 border-t bg-white">
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    onSend()
                  }}
                  className="flex gap-2"
                >
                  <Input
                    placeholder="Votre message..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    disabled={chatLoading}
                    className="flex-1"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={chatLoading || !chatInput.trim()}
                    className="bg-emerald-600 hover:bg-emerald-700 shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
