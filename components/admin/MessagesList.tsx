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

export default function MessagesList({ initialMessages, dbError }: { initialMessages: any[], dbError: boolean }) {
  const t = useTranslations('admin_portal.messages');
  const locale = useLocale();
  const dateLocale = locale === 'ar' ? arMA : fr;

  const [messages, setMessages] = useState<Message[]>(initialMessages);
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
      // Optimistic update
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, isRead: true } : m));
      
      try {
        await fetch('/api/contact/mark-read', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: msg.id })
        });
        // Side effect: Sidebar will update automatically on next poll
      } catch (e) {
        console.error("Failed to mark as read", e);
      }
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-4">
            <div className="p-3.5 bg-[hsl(var(--gov-blue))] rounded-2xl shadow-xl shadow-[hsl(var(--gov-blue))]/20">
               <Mail className="w-8 h-8 text-white" />
            </div>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
              {t('title')}
            </span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 ml-1 flex items-center gap-2">
            <span className="w-8 h-[2px] bg-[hsl(var(--gov-blue))]/30 rounded-full" />
            {t('subtitle')}
          </p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 ${locale === 'ar' ? 'right-4' : 'left-4'}`} />
            <input 
              type="text" 
              placeholder={t('search_placeholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-[hsl(var(--gov-blue))] outline-none transition-all shadow-sm ${locale === 'ar' ? 'pr-12 pl-4' : 'pl-12 pr-4'}`}
            />
          </div>
          <div className="flex flex-col items-end">
            <span className="text-2xl font-black text-[hsl(var(--gov-blue))]">{filteredMessages.length}</span>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('messages_count', { count: filteredMessages.length }).split(' ')[0]}</span>
          </div>
        </div>
      </div>

      {dbError ? (
        <div className="bg-red-50 p-6 rounded-2xl border border-red-200 flex gap-4 items-center animate-pulse">
          <AlertCircle className="w-8 h-8 text-red-600" />
          <div>
            <h3 className="font-bold text-red-900">{t('db_error_title')}</h3>
            <p className="text-red-700">{t('db_error_desc')}</p>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl shadow-gray-100/50 border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                <tr>
                  <th className={`p-5 font-semibold text-gray-500 uppercase text-xs tracking-wider ${locale === 'ar' ? 'text-right' : 'text-left'}`}>{t('author')}</th>
                  <th className={`p-5 font-semibold text-gray-500 uppercase text-xs tracking-wider ${locale === 'ar' ? 'text-right' : 'text-left'}`}>{t('subject_message')}</th>
                  <th className={`p-5 font-semibold text-gray-500 uppercase text-xs tracking-wider w-48 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>{t('date')}</th>
                  <th className="p-5 font-semibold text-gray-500 uppercase text-xs tracking-wider w-32 text-center">{t('actions')}</th>
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
                  <tr 
                    key={msg.id} 
                    className={`
                      hover:bg-gray-50/80 dark:hover:bg-gray-700/30 transition-colors cursor-pointer group
                      ${!msg.isRead ? 'bg-blue-50/40 dark:bg-blue-900/10 border-l-4 border-l-blue-500' : 'border-l-4 border-l-transparent'}
                    `}
                    onClick={() => handleViewMessage(msg)}
                  >
                    <td className="p-5 align-top">
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
                    </td>
                    <td className="p-5 align-top">
                      <div className="mb-1">
                        <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded border border-gray-200">
                          {msg.sujet}
                        </span>
                      </div>
                      <p className={`text-sm line-clamp-2 leading-relaxed ${!msg.isRead ? 'text-gray-900 font-medium' : 'text-gray-600 dark:text-gray-300'}`}>
                        {msg.message}
                      </p>
                    </td>
                    <td className="p-5 align-top text-sm">
                       <div className="flex items-center gap-2 text-gray-900 font-medium">
                         <Clock className="w-4 h-4 text-gray-400" />
                         {format(new Date(msg.createdAt), 'dd MMM yyyy', { locale: dateLocale })}
                       </div>
                       <div className={`text-gray-500 text-xs mt-1 ${locale === 'ar' ? 'pr-6' : 'pl-6'}`}>
                         {format(new Date(msg.createdAt), 'HH:mm', { locale: dateLocale })}
                       </div>
                    </td>
                    <td className="p-5 align-top text-center" onClick={(e) => e.stopPropagation()}>
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Message Modal */}
      <AnimatePresence>
        {selectedMessage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedMessage(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden"
              dir={locale === 'ar' ? 'rtl' : 'ltr'}
            >
              {/* Modal Header */}
              <div className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700 p-8 flex justify-between items-start">
                 <div className="flex items-center gap-5">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-xl ${
                        selectedMessage.userId ? 'bg-gradient-to-br from-[hsl(var(--gov-blue))] to-[hsl(var(--gov-blue-dark))] shadow-[hsl(var(--gov-blue))]/20' : 'bg-gradient-to-br from-gray-400 to-gray-500 shadow-gray-200'
                    }`}>
                        {selectedMessage.nom ? selectedMessage.nom.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-1">{selectedMessage.sujet}</h3>
                        <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                             <div className="flex items-center gap-1.5 font-bold text-gray-700 dark:text-gray-300">
                               <User className="w-4 h-4 text-[hsl(var(--gov-blue))]" />
                               <span>{selectedMessage.nom}</span>
                             </div>
                             <span className="w-1.5 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full" />
                             <span className="text-[hsl(var(--gov-blue))] font-medium underline decoration-dotted underline-offset-4">{selectedMessage.email}</span>
                        </div>
                    </div>
                 </div>
                 <button 
                  onClick={() => setSelectedMessage(null)}
                  className="p-2.5 bg-white dark:bg-gray-800 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-all shadow-sm border border-gray-100 dark:border-gray-700 hover:rotate-90"
                 >
                   <X className="w-6 h-6" />
                 </button>
              </div>
              
              {/* Modal Body */}
              <div className="p-8">
                 <div className="flex items-center gap-2 text-sm text-gray-400 mb-6 font-mono bg-gray-50/50 p-2 rounded-lg w-fit">
                    <Clock className="w-4 h-4" />
                    {t('received_on', { date: format(new Date(selectedMessage.createdAt), 'PPPP p', { locale: dateLocale }) })}
                 </div>
                 
                 <div className="text-gray-700 leading-loose text-lg whitespace-pre-wrap">
                    {selectedMessage.message}
                 </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-gray-50 dark:bg-gray-700/30 p-6 flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-gray-100 dark:border-gray-700">
                 <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest bg-white dark:bg-gray-800 px-3 py-1 rounded-full border border-gray-100 dark:border-gray-700 shadow-sm">ID: {selectedMessage.id}</span>
                 <div className="flex gap-4 w-full sm:w-auto">
                    <button 
                      onClick={() => setSelectedMessage(null)}
                      className="flex-1 sm:flex-none px-6 py-3 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-2xl font-bold transition-colors"
                    >
                      {t('close')}
                    </button>
                    <a 
                      href={`mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.sujet}`}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-3 px-8 py-3 bg-[hsl(var(--gov-blue))] text-white rounded-2xl font-bold shadow-xl shadow-[hsl(var(--gov-blue))]/20 hover:bg-[hsl(var(--gov-blue-dark))] transition-all transform hover:-translate-y-1 active:scale-95"
                    >
                      <Reply className={`w-5 h-5 ${locale === 'ar' ? 'rotate-180' : ''}`} />
                      {t('reply_email')}
                    </a>
                 </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
