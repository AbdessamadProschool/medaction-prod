'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { fr, arMA } from 'date-fns/locale';
import { 
  Mail, 
  Clock, 
  User, 
  AlertCircle, 
  Search, 
  Eye, 
  Reply, 
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import { useData } from '@/hooks/use-data';
import { useMutation } from '@/hooks/use-mutation';
import { GovTable, GovTh, GovTd, GovTr } from '@/components/ui/GovTable';
import { GovModal } from '@/components/ui/GovModal';
import { GovPageHeader, GovButton } from '@/components/ui';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface Message {
  id: string;
  nom: string;
  email: string;
  sujet: string;
  message: string;
  createdAt: Date | string;
  userId?: string | null;
  isRead: boolean;
}

export default function MessagesList() {
  const t = useTranslations('admin_portal.messages');
  const locale = useLocale();
  const dateLocale = locale === 'ar' ? arMA : fr;

  const { data: messagesData, isLoading, mutate: refreshMessages, error } = useData('/api/contact');
  const actionMutation = useMutation();
  const messages: Message[] = messagesData?.data || [];

  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMessages = messages.filter((msg: any) => 
    (msg.sujet?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
    (msg.nom?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
    (msg.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const handleViewMessage = async (msg: Message) => {
    setSelectedMessage(msg);
    
    if (!msg.isRead) {
      try {
        await actionMutation.mutate('/api/contact/mark-read', {
          method: 'POST',
          data: { id: msg.id }
        });
        refreshMessages();
      } catch (e) {
        console.error("Failed to mark as read", e);
        toast.error("Erreur lors de la mise à jour");
      }
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <GovPageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        icon={<Mail className="w-8 h-8 group-hover:scale-110 transition-transform duration-500" />}
        actions={
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <Search className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 ${locale === 'ar' ? 'right-4' : 'left-4'}`} />
              <input 
                type="text" 
                placeholder={t('search_placeholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full py-2.5 bg-background border border-input rounded-xl focus:ring-2 focus:ring-[hsl(var(--gov-blue))] outline-none transition-colors shadow-sm ${locale === 'ar' ? 'pr-12 pl-4' : 'pl-12 pr-4'}`}
              />
            </div>
            <div className="flex flex-col items-end">
              <span className="text-2xl font-black text-[hsl(var(--gov-blue))]">{filteredMessages.length}</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('messages_count', { count: filteredMessages.length }).split(' ')[0]}</span>
            </div>
          </div>
        }
      />

      {error ? (
        <div className="bg-[hsl(var(--gov-red)/0.08)] p-6 rounded-lg border border-[hsl(var(--gov-red)/0.25)] flex gap-4 items-center">
          <AlertCircle className="w-8 h-8 text-red-600" />
          <div>
            <h3 className="font-bold text-red-900">{t('db_error_title')}</h3>
            <p className="text-red-700">{error.message || t('db_error_desc')}</p>
          </div>
        </div>
      ) : isLoading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--gov-blue))]" />
        </div>
      ) : (
        <GovTable>
          <thead>
            <tr>
              <GovTh>{t('author')}</GovTh>
              <GovTh>{t('subject_message')}</GovTh>
              <GovTh className="w-48">{t('date')}</GovTh>
              <GovTh className="w-32 text-center">{t('actions')}</GovTh>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredMessages.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-16 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center">
                          <Mail className="w-10 h-10 text-gray-300" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">{t('no_messages')}</h3>
                        <p className="text-gray-500 max-w-sm">
                           {t('no_messages_desc')}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : filteredMessages.map((msg: any) => (
                  <GovTr 
                    key={msg.id} 
                    className={`
                      cursor-pointer group
                      ${!msg.isRead ? 'bg-[hsl(var(--gov-blue)/0.06)]' : ''}
                    `}
                    onClick={() => handleViewMessage(msg)}
                  >
                    <GovTd>
                      <div className="flex items-start gap-3">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold shadow-lg relative transition-transform group-hover:scale-105 ${
                          msg.userId ? 'bg-gradient-to-br from-[hsl(var(--gov-blue))] to-[hsl(var(--gov-blue-dark))]' : 'bg-gradient-to-br from-gray-400 to-gray-500'
                        }`}>
                          {msg.nom ? msg.nom.charAt(0).toUpperCase() : '?'}
                          {!msg.isRead && (
                            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 border-2 border-white dark:border-gray-800 rounded-full animate-pulse shadow-sm" />
                          )}
                        </div>
                        <div className="pt-1">
                          <div className={`font-bold group-hover:text-[hsl(var(--gov-blue))] transition-colors ${!msg.isRead ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                            {msg.nom}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{msg.email}</div>
                          {msg.userId && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 mt-2 bg-[hsl(var(--gov-blue))]/10 text-[hsl(var(--gov-blue))] text-[10px] font-bold uppercase tracking-widest rounded-full border border-[hsl(var(--gov-blue))]/20">
                              <User size={10} />
                              {t('member')}
                            </span>
                          )}
                        </div>
                      </div>
                    </GovTd>
                    <GovTd>
                      <div className="mb-1">
                        <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded border border-gray-200">
                          {msg.sujet}
                        </span>
                      </div>
                      <p className={`text-sm line-clamp-2 leading-relaxed ${!msg.isRead ? 'text-gray-900 font-medium' : 'text-gray-600 dark:text-gray-300'}`}>
                        {msg.message}
                      </p>
                    </GovTd>
                    <GovTd className="text-sm">
                       <div className="flex items-center gap-2 text-gray-900 font-medium">
                         <Clock className="w-4 h-4 text-gray-400" />
                         {format(new Date(msg.createdAt), 'dd MMM yyyy', { locale: dateLocale })}
                       </div>
                       <div className={`text-gray-500 text-xs mt-1 ${locale === 'ar' ? 'pr-6' : 'pl-6'}`}>
                         {format(new Date(msg.createdAt), 'HH:mm', { locale: dateLocale })}
                       </div>
                    </GovTd>
                    <GovTd className="text-center" onClick={(e) => e.stopPropagation()}>
                       <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                          <button 
                            onClick={() => handleViewMessage(msg)}
                            className="p-2.5 text-gray-400 hover:text-[hsl(var(--gov-blue))] hover:bg-[hsl(var(--gov-blue))]/10 rounded-xl transition-all shadow-sm hover:shadow-md"
                            title={t('view')}
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <a 
                            href={`mailto:${msg.email}?subject=Re: ${msg.sujet}`}
                            className="p-2.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all shadow-sm hover:shadow-md"
                            title={t('reply')}
                          >
                            <Reply className={`w-5 h-5 ${locale === 'ar' ? 'rotate-180' : ''}`} />
                          </a>
                       </div>
                    </GovTd>
                  </GovTr>
                ))}
              </tbody>
            </GovTable>
      )}

      <GovModal
        isOpen={!!selectedMessage}
        onClose={() => setSelectedMessage(null)}
        title={selectedMessage?.sujet}
        subtitle={
          <div className="flex flex-wrap items-center gap-3 text-sm mt-1">
             <div className="flex items-center gap-1.5 font-bold text-foreground">
               <User className="w-4 h-4 text-[hsl(var(--gov-blue))]" />
               <span>{selectedMessage?.nom}</span>
             </div>
             <span className="w-1.5 h-1.5 bg-border rounded-full" />
             <span className="text-[hsl(var(--gov-blue))] font-medium">{selectedMessage?.email}</span>
          </div>
        }
        icon={
           <div className={`w-full h-full flex items-center justify-center text-white text-xl font-bold rounded-2xl ${
             selectedMessage?.userId ? 'bg-gradient-to-br from-[hsl(var(--gov-blue))] to-[hsl(var(--gov-blue-dark))]' : 'bg-gradient-to-br from-gray-400 to-gray-500'
           }`}>
             {selectedMessage?.nom ? selectedMessage.nom.charAt(0).toUpperCase() : '?'}
           </div>
        }
        footer={
           <div className="flex w-full items-center justify-between gap-4">
             <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-3 py-1 bg-background rounded-full border border-border shadow-sm">
               ID: {selectedMessage?.id}
             </span>
             <div className="flex gap-3">
               <GovButton variant="outline" onClick={() => setSelectedMessage(null)}>
                 {t('close')}
               </GovButton>
               {selectedMessage && (
                 <GovButton 
                   variant="primary" 
                   onClick={() => window.location.href = `mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.sujet}`}
                   leftIcon={<Reply className={`w-5 h-5 ${locale === 'ar' ? 'rotate-180' : ''}`} />}
                 >
                   {t('reply_email')}
                 </GovButton>
               )}
             </div>
           </div>
        }
      >
        {selectedMessage && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground font-mono bg-muted/30 p-3 rounded-xl w-fit border border-border/50">
               <Clock className="w-4 h-4" />
               {t('received_on', { date: format(new Date(selectedMessage.createdAt), 'PPPP p', { locale: dateLocale }) })}
            </div>
            
            <div className="text-foreground leading-loose text-lg whitespace-pre-wrap">
               {selectedMessage.message}
            </div>
          </div>
        )}
      </GovModal>
    </div>
  );
}
