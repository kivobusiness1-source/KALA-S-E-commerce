'use client'

import { useState, useEffect, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { toast } from 'sonner'
import { MessageSquare, Trash2, Send, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatRelative } from './helpers'
import type { Conversation, ConversationDetail } from './types'

const getDisplayName = (name: string | null | undefined, email: string | null | undefined) => {
  if (name) return name
  if (email) return email
  return 'Client'
}

export default function MessagesSection() {
  const queryClient = useQueryClient()
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { data: conversations, isLoading: convsLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => fetch('/api/messages').then(r => r.json()).then(d => d.data as Conversation[]),
    refetchInterval: 5000,
  })

  const { data: convDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['conversation', selectedConvId],
    queryFn: () => fetch(`/api/messages/${selectedConvId}`).then(r => r.json()).then(d => d.data as ConversationDetail),
    enabled: !!selectedConvId,
  })

  // Scroll to bottom on new messages
  useEffect(() => {
    if (convDetail?.messages?.length) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [convDetail?.messages?.length])

  const selectConversation = (id: string) => {
    setSelectedConvId(id)
    setReplyText('')
  }

  const sendReply = async () => {
    if (!replyText.trim() || !selectedConvId) return
    setSending(true)
    try {
      const res = await fetch(`/api/messages/${selectedConvId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyText.trim() }),
      })
      const data = await res.json()
      if (data.success) {
        setReplyText('')
        queryClient.invalidateQueries({ queryKey: ['conversation', selectedConvId] })
        queryClient.invalidateQueries({ queryKey: ['conversations'] })
        queryClient.invalidateQueries({ queryKey: ['stats'] })
      } else {
        toast.error(data.error || 'Erreur')
      }
    } catch {
      toast.error('Erreur serveur')
    } finally {
      setSending(false)
    }
  }

  const deleteConversation = async (id: string) => {
    try {
      const res = await fetch(`/api/messages/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast.success('Conversation supprimée')
        if (selectedConvId === id) setSelectedConvId(null)
        queryClient.invalidateQueries({ queryKey: ['conversations'] })
        queryClient.invalidateQueries({ queryKey: ['stats'] })
      } else {
        toast.error(data.error || 'Erreur')
      }
    } catch {
      toast.error('Erreur serveur')
    }
  }

  return (
    <div className="space-y-4">
      {/* Average response time */}
      <Card className="border-t-4 border-t-emerald-500">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-emerald-50 text-emerald-600">
              <Clock className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground truncate">Temps de réponse moyen</p>
              <p className="text-xl font-bold text-gray-900">2h 30min</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex h-[calc(100vh-16rem)] border border-gray-200 rounded-lg overflow-hidden bg-white">
      {/* Conversations list */}
      <div className={`w-full sm:w-80 border-r border-gray-200 flex flex-col ${selectedConvId ? 'hidden sm:flex' : 'flex'}`}>
        <div className="p-3 border-b border-gray-100">
          <h3 className="font-semibold text-sm">Conversations</h3>
          <p className="text-xs text-muted-foreground">{conversations?.length ?? 0} conversation(s)</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {convsLoading ? (
            <div className="p-3 space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : conversations && conversations.length > 0 ? (
            conversations.map(conv => (
              <button
                key={conv.id}
                onClick={() => selectConversation(conv.id)}
                className={`w-full text-left p-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${selectedConvId === conv.id ? 'bg-emerald-50 border-l-2 border-l-emerald-500' : ''}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-medium truncate ${!conv.isRead ? 'text-gray-900' : 'text-gray-600'}`}>
                    {getDisplayName(conv.customerName, conv.customerEmail)}
                  </span>
                  <span className="text-xs text-muted-foreground shrink-0 ml-2">{formatRelative(conv.updatedAt)}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{conv.latestMessage?.content || 'Aucun message'}</p>
                {conv.unreadCount > 0 && (
                  <span className="inline-block mt-1 px-1.5 py-0.5 rounded-full bg-emerald-600 text-white text-xs font-bold">
                    {conv.unreadCount} nouveau(x)
                  </span>
                )}
              </button>
            ))
          ) : (
            <div className="p-6 text-center">
              <MessageSquare className="h-8 w-8 mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-muted-foreground">Aucune conversation</p>
            </div>
          )}
        </div>
      </div>

      {/* Messages panel */}
      <div className={`flex-1 flex flex-col ${!selectedConvId ? 'hidden sm:flex' : 'flex'}`}>
        {selectedConvId && convDetail ? (
          <>
            {/* Header */}
            <div className="p-3 border-b border-gray-100 flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm">{getDisplayName(convDetail.customerName, convDetail.customerEmail)}</p>
                {convDetail.customerEmail && convDetail.customerName && (
                  <p className="text-xs text-muted-foreground">{convDetail.customerEmail}</p>
                )}
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700" onClick={() => deleteConversation(selectedConvId)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              {detailLoading ? (
                <div className="space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className={`h-12 w-3/4 ${i % 2 === 0 ? 'ml-auto' : ''}`} />)}</div>
              ) : convDetail.messages.length > 0 ? (
                <div className="space-y-3">
                  {convDetail.messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.senderType === 'admin' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] ${msg.senderType === 'admin' ? 'border-l-2 border-emerald-400' : ''}`}>
                        <p className={`text-xs mb-1 ${msg.senderType === 'admin' ? 'text-right' : ''} text-gray-400`}>
                          {msg.senderType === 'admin' ? 'Vous' : 'Client'}
                        </p>
                        <div className={`rounded-2xl px-4 py-2.5 text-sm ${msg.senderType === 'admin' ? 'bg-emerald-600 text-white rounded-br-md' : 'bg-gray-100 text-gray-900 rounded-bl-md'}`}>
                          <p>{msg.content}</p>
                          <p className={`text-xs mt-1 ${msg.senderType === 'admin' ? 'text-emerald-100' : 'text-gray-400'}`}>
                            {format(new Date(msg.createdAt), 'HH:mm', { locale: fr })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">Aucun message</p>
              )}
            </ScrollArea>

            {/* Reply input */}
            <div className="p-3 border-t border-gray-100">
              <div className="flex gap-2">
                <Input
                  placeholder="Écrire une réponse..."
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply() } }}
                  disabled={sending}
                />
                <Button size="icon" className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0" onClick={sendReply} disabled={sending || !replyText.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p className="text-muted-foreground">Sélectionnez une conversation</p>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  )
}