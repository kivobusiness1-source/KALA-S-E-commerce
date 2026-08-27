'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, Send, User, Sparkles, Bot, CheckCheck, MessageSquareDashed } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import type { ChatMessageType } from './types'

const AVATAR_OPTIONS = [
  { icon: '\u{1F60A}', label: 'Sourire' },
  { icon: '\u{1F6D2}', label: 'Acheteur' },
  { icon: '\u2728', label: 'Etoile' },
]

const QUICK_REPLIES: string[] = [
  'Quels sont vos prix ?',
  'Delai de livraison ?',
  'Passer une commande',
  'Zone de livraison ?',
]

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

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2">
      <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
        <Bot className="w-3.5 h-3.5 text-emerald-600" />
      </div>
      <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
        <div className="flex gap-1 items-center h-4">
          <motion.span
            className="w-2 h-2 bg-gray-400 rounded-full"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
          />
          <motion.span
            className="w-2 h-2 bg-gray-400 rounded-full"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }}
          />
          <motion.span
            className="w-2 h-2 bg-gray-400 rounded-full"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
          />
        </div>
      </div>
    </div>
  )
}

function formatMessageTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
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
  const [selectedAvatar, setSelectedAvatar] = useState(0)
  const [showWelcomeAnim, setShowWelcomeAnim] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setShowWelcomeAnim(false), 2000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const handler = () => setChatOpen(true)
    document.addEventListener('open-chat', handler)
    return () => document.removeEventListener('open-chat', handler)
  }, [setChatOpen])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, chatLoading])

  const unreadCount = chatOpen ? 0 : chatMessages.length

  const handleQuickReply = (text: string) => {
    setChatInput(text)
    setTimeout(() => {
      onSend()
    }, 100)
  }

  const showQuickReplies = chatMessages.length <= 2 && !chatLoading

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => setChatOpen(true)}
            className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
            style={{ animation: 'chatBreathing 3s ease-in-out infinite' }}
            aria-label="Ouvrir le chat"
          >
            <MessageCircle className="w-6 h-6" />
            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="left" className="bg-gray-900 text-white text-xs">
          Besoin d'aide ?
        </TooltipContent>
      </Tooltip>

      <style>{`@keyframes chatBreathing { 0%, 100% { box-shadow: 0 4px 15px rgba(5, 150, 105, 0.3); } 50% { box-shadow: 0 4px 25px rgba(5, 150, 105, 0.5); } }`}</style>

      <Sheet open={chatOpen} onOpenChange={setChatOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
          <SheetHeader className="bg-gradient-to-r from-emerald-600 to-teal-500 text-white px-4 py-3 rounded-none border-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <SheetTitle className="text-white text-base">Chat avec CongoClean</SheetTitle>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-emerald-300 rounded-full animate-pulse" />
                    <SheetDescription className="text-emerald-100 text-xs">En ligne · Nous repondons rapidement</SheetDescription>
                  </div>
                </div>
              </div>
            </div>
          </SheetHeader>

          {!chatRegistered ? (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="w-full max-w-sm space-y-5">
                <AnimatePresence>
                  {showWelcomeAnim ? (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="text-center mb-4"
                    >
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-200/50"
                      >
                        <Sparkles className="w-10 h-10 text-emerald-500" />
                      </motion.div>
                      <h3 className="font-bold text-gray-900 text-lg">Bienvenue sur CongoClean !</h3>
                      <p className="text-gray-500 text-sm mt-1">Nous sommes la pour vous aider</p>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center mb-4"
                    >
                      <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                        <MessageCircle className="w-8 h-8 text-emerald-600" />
                      </div>
                      <h3 className="font-semibold text-gray-900">Bienvenue !</h3>
                      <p className="text-gray-500 text-sm mt-1">Entrez vos informations pour commencer</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex justify-center gap-3">
                  {AVATAR_OPTIONS.map((avatar, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSelectedAvatar(i)}
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all duration-200 ${
                        selectedAvatar === i
                          ? 'ring-2 ring-emerald-500 ring-offset-2 bg-emerald-50 scale-110'
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      {avatar.icon}
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="chat-name">Nom <span className="text-red-500">*</span></Label>
                  <Input
                    id="chat-name"
                    placeholder="Votre nom"
                    value={chatName}
                    onChange={(e) => setChatName(e.target.value)}
                    className="focus-visible:ring-emerald-500/30 focus-visible:border-emerald-400"
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
                    className="focus-visible:ring-emerald-500/30 focus-visible:border-emerald-400"
                  />
                </div>
                <Button
                  onClick={onRegister}
                  disabled={chatLoading}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white font-semibold shadow-md shadow-emerald-600/20"
                >
                  {chatLoading ? '...' : 'Commencer le chat'}
                </Button>
              </div>
            </div>
          ) : (
            <>
              <ScrollArea className="flex-1 p-4" style={{ maxHeight: 'calc(100vh - 200px)' }}>
                <div className="space-y-4">
                  {chatMessages.length === 0 && !chatLoading && (
                    <div className="text-center py-10">
                      <div className="relative w-24 h-24 mx-auto mb-4">
                        <div className="absolute inset-0 rounded-full bg-emerald-50" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <MessageSquareDashed className="w-10 h-10 text-emerald-300" />
                        </div>
                      </div>
                      <p className="text-gray-600 font-medium">Posez-nous votre premiere question !</p>
                      <p className="text-gray-400 text-sm mt-1">Notre equipe vous repondra rapidement</p>
                    </div>
                  )}
                  {chatMessages.map((msg) => {
                    const isCustomer = msg.senderType === 'customer'
                    return (
                      <div key={msg.id} className={`flex gap-2 ${isCustomer ? 'flex-row-reverse' : 'flex-row'}`}>
                        {!isCustomer && (
                          <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-1">
                            <Bot className="w-3.5 h-3.5 text-emerald-600" />
                          </div>
                        )}
                        <div className={`max-w-[80%] ${isCustomer ? 'items-end' : 'items-start'}`}>
                          <div className={`flex items-center gap-1.5 mb-1 ${isCustomer ? 'flex-row-reverse' : ''}`}>
                            <span className="text-[11px] font-medium text-gray-400">
                              {isCustomer ? 'Vous' : 'CongoClean'}
                            </span>
                          </div>
                          <div
                            className={`rounded-2xl px-4 py-2.5 text-sm ${
                              isCustomer
                                ? 'bg-emerald-600 text-white rounded-br-md'
                                : 'bg-gray-100 text-gray-800 rounded-bl-md'
                            }`}
                          >
                            {msg.content}
                          </div>
                          <div className={`flex items-center gap-1 mt-1 ${isCustomer ? 'flex-row-reverse' : ''}`}>
                            <span className="text-[10px] text-gray-400">
                              {formatMessageTime(msg.createdAt)}
                            </span>
                            {isCustomer && (
                              <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                            )}
                          </div>
                        </div>
                        {isCustomer && (
                          <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center shrink-0 mt-1">
                            <User className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                    )
                  })}
                  {chatLoading && <TypingIndicator />}
                  <div ref={chatEndRef} />
                </div>
              </ScrollArea>

              {showQuickReplies && (
                <div className="px-4 pb-2 flex flex-wrap gap-2">
                  {QUICK_REPLIES.map((reply) => (
                    <button
                      key={reply}
                      onClick={() => handleQuickReply(reply)}
                      className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-3 py-1.5 hover:bg-emerald-100 hover:border-emerald-300 transition-colors duration-200 whitespace-nowrap"
                    >
                      {reply}
                    </button>
                  ))}
                </div>
              )}

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
                    className="flex-1 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-400"
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
    </TooltipProvider>
  )
}
