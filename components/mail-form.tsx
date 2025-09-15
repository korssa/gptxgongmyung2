"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Mail, Send, X } from "lucide-react";
import { blockTranslationFeedback, createAdminButtonHandler, createAdminFormHandler } from "@/lib/translation-utils";

interface MailFormProps {
  type: "events" | "feedback" | "contact";
  buttonText: string;
  buttonDescription: string;
  onMouseEnter?: () => void;
}

export function MailForm({ type, buttonText, buttonDescription, onMouseEnter }: MailFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    agreeToMarketing: false
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getTitle = () => {
    switch (type) {
      case "events":
        return "Events";
      case "feedback":
        return "Feedback & Suggestions";
      case "contact":
        return "Contact & Support";
      default:
        return "Send Message";
    }
  };

  const getSubjectPlaceholder = () => {
    switch (type) {
      case "events":
        return "Event App";
      case "feedback":
        return "Your feedback or suggestion";
      case "contact":
        return "How can we help you?";
      default:
        return "Subject";
    }
  };

  const getMessagePlaceholder = () => {
    switch (type) {
      case "events":
        return "";
      case "feedback":
        return "Share your thoughts, suggestions, or report any issues...";
      case "contact":
        return "Describe your question or issue in detail...";
      default:
        return "Your message";
    }
  };

  const handleSubmit = createAdminFormHandler(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Block translation feedback
      if (onMouseEnter) {
        onMouseEnter();
      }

      // Call API endpoint
      const response = await fetch('/api/send-mail', {
        method: 'POST',
        headers: {
          // Don't set Content-Type when using FormData (browser sets it automatically)
        },
        body: (() => {
          const formDataToSend = new FormData();
          formDataToSend.append('type', type);
          formDataToSend.append('name', formData.name);
          formDataToSend.append('email', formData.email);
          formDataToSend.append('subject', formData.subject);
          formDataToSend.append('message', formData.message);
          formDataToSend.append('agreeToMarketing', formData.agreeToMarketing.toString());
          
          if (selectedFile) {
            formDataToSend.append('file', selectedFile);
          }
          
          return formDataToSend;
        })(),
      });

      // Check response text first
      const responseText = await response.text();
      let result;
      
             try {
         result = JSON.parse(responseText);
       } catch {
 
         throw new Error('Unable to process server response.');
       }

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send message.');
      }

             // Reset form on success
               setFormData({
          name: "",
          email: "",
          subject: "",
          message: "",
          agreeToMarketing: false
        });
        setSelectedFile(null);
      setIsOpen(false);
      
      // Success message (only when not Events type)
      if (type !== "events") {
        alert(result.message || "Message sent successfully!");
      }
               } catch (err) {
         
             
                 // Display more detailed error information
                 let errorMessage = "Failed to send message. Please try again.";
                 if (err instanceof Error) {
                   errorMessage = err.message;
                 }
             
         
                 //   message: errorMessage,
                 //   stack: err instanceof Error ? err.stack : "No stack trace"
                 // });
            
                 alert(errorMessage);
               } finally {
      setIsSubmitting(false);
    }
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
    } else if (file) {
      alert('Please select an image file.');
      e.target.value = '';
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsOpen(true);
          }}
          onMouseEnter={onMouseEnter}
          className={`w-full border border-white rounded-lg p-4 text-left hover:border-amber-400 hover:bg-gray-800/50 transition-all duration-300 group ${type === "events" ? "event-mail-button" : ""}`}
        >
          <div className="text-base font-medium group-hover:text-amber-400 transition-colors">
            {buttonText}
          </div>
                     <div className="text-xs text-gray-400 mt-1 group-hover:text-gray-300 transition-colors">
             {buttonDescription}
           </div>
        </button>
      </DialogTrigger>
      
             <DialogContent className="sm:max-w-sm bg-gray-900 border-gray-700 text-white max-h-[80vh] overflow-y-auto">
         <DialogHeader>
           <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-amber-400">
             <Mail className="h-4 w-4" />
             {getTitle()}
           </DialogTitle>
         </DialogHeader>
        
                 <form onSubmit={handleSubmit} className="space-y-3 mt-3">
           <div className="grid grid-cols-2 gap-3">
             <div>
                                <label htmlFor="name" className="block text-xs font-medium text-gray-300 mb-1" onMouseEnter={blockTranslationFeedback}>
                   Name *
                 </label>
               <Input
                 id="name"
                 type="text"
                 required
                 value={formData.name}
                 onChange={(e) => handleInputChange("name", e.target.value)}
                                    className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-amber-400"
                   placeholder="Your name"
               />
             </div>
             <div>
                                <label htmlFor="email" className="block text-xs font-medium text-gray-300 mb-1" onMouseEnter={blockTranslationFeedback}>
                   Email *
                 </label>
               <Input
                 id="email"
                 type="email"
                 required
                 value={formData.email}
                 onChange={(e) => handleInputChange("email", e.target.value)}
                                    className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-amber-400"
                   placeholder="your@email.com"
               />
             </div>
           </div>
          
                               {type === "events" ? (
            <div>
                             <label className="block text-xs font-medium text-gray-300 mb-2" onMouseEnter={blockTranslationFeedback}>
                 Event App *
               </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={createAdminButtonHandler(() => handleInputChange("subject", "Event App 1"))}
                  onMouseEnter={blockTranslationFeedback}
                                     className={`px-3 py-2 text-sm rounded border transition-colors ${
                     formData.subject === "Event App 1" 
                       ? "bg-amber-500 border-amber-500 text-white" 
                       : "bg-gray-800 border-gray-600 text-gray-300 hover:border-amber-400"
                   }`}
                >
                  1
                </button>
                <button
                  type="button"
                  onClick={createAdminButtonHandler(() => handleInputChange("subject", "Event App 2"))}
                  onMouseEnter={blockTranslationFeedback}
                                     className={`px-3 py-2 text-sm rounded border transition-colors ${
                     formData.subject === "Event App 2" 
                       ? "bg-amber-500 border-amber-500 text-white" 
                       : "bg-gray-800 border-gray-600 text-gray-300 hover:border-amber-400"
                   }`}
                >
                  2
                </button>
                <button
                  type="button"
                  onClick={createAdminButtonHandler(() => handleInputChange("subject", "Event App 3"))}
                  onMouseEnter={blockTranslationFeedback}
                                     className={`px-3 py-2 text-sm rounded border transition-colors ${
                     formData.subject === "Event App 3" 
                       ? "bg-amber-500 border-amber-500 text-white" 
                       : "bg-gray-800 border-gray-600 text-gray-300 hover:border-amber-400"
                   }`}
                >
                  3
                </button>
              </div>
            </div>
          ) : (
            <div>
                             <label htmlFor="subject" className="block text-xs font-medium text-gray-300 mb-1" onMouseEnter={blockTranslationFeedback}>
                 Subject *
               </label>
              <Input
                id="subject"
                type="text"
                required
                value={formData.subject}
                onChange={(e) => handleInputChange("subject", e.target.value)}
                                 className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-amber-400"
                 placeholder={getSubjectPlaceholder()}
              />
            </div>
          )}
           
                                   <div>
                             <label htmlFor="message" className="block text-xs font-medium text-gray-300 mb-1" onMouseEnter={blockTranslationFeedback}>
                 Message {type === "events" ? "(optional)" : "*"}
               </label>
              <Textarea
                id="message"
                required={type !== "events"}
                rows={3}
                value={formData.message}
                onChange={(e) => handleInputChange("message", e.target.value)}
                                 className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-amber-400 resize-none"
                 placeholder={getMessagePlaceholder()}
              />
                         </div>

             {/* Image attachment for Contact Us */}
             {type === "contact" && (
               <div>
                 <label className="block text-xs font-medium text-gray-300 mb-2" onMouseEnter={blockTranslationFeedback}>
                   Attach Image (optional)
                 </label>
                 <div className="space-y-2">
                   <input
                     id="file-input"
                     type="file"
                     accept="image/*"
                     onChange={handleFileChange}
                     className="hidden"
                   />
                   <div className="flex gap-2">
                     <button
                       type="button"
                       onClick={createAdminButtonHandler(() => document.getElementById('file-input')?.click())}
                       onMouseEnter={blockTranslationFeedback}
                       className="px-3 py-2 text-sm bg-gray-800 border border-gray-600 text-gray-300 hover:border-amber-400 rounded transition-colors"
                     >
                       Choose Image
                     </button>
                     {selectedFile && (
                                            <button
                       type="button"
                       onClick={createAdminButtonHandler(removeFile)}
                       onMouseEnter={blockTranslationFeedback}
                       className="px-3 py-2 text-sm bg-red-600 border border-red-600 text-white hover:bg-red-700 rounded transition-colors"
                     >
                       Remove
                     </button>
                     )}
                   </div>
                   {selectedFile && (
                     <div className="text-xs text-gray-400">
                       Selected: {selectedFile.name}
                     </div>
                   )}
                 </div>
               </div>
             )}

             {/* Checkbox for events */}
            {type === "events" && (
              <div className="mt-4">
                                 <label className="flex items-start space-x-2 text-sm text-gray-400" onMouseEnter={blockTranslationFeedback}>
                  <input
                    type="checkbox"
                    required
                    className="mt-1"
                    name="agreeToMarketing"
                    checked={formData.agreeToMarketing}
                    onChange={(e) => handleInputChange("agreeToMarketing", e.target.checked)}
                  />
                  <span>
                    I agree to receive occasional news and offers from gongmyung.com via email.  
                    <br className="sm:hidden" />
                    <em className="text-xs text-gray-500">(*Required to receive your free app.)</em>
                  </span>
                </label>
              </div>
            )}
          
                     <div className="flex gap-3 pt-2">
                            <Button
                 type="submit"
                 disabled={isSubmitting}
                 onMouseEnter={blockTranslationFeedback}
                 className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-medium"
               >
                                {isSubmitting ? (
                   <div className="flex items-center gap-2">
                     <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                     <span>Sending...</span>
                   </div>
                 ) : (
                   <div className="flex items-center gap-2">
                     <Send className="h-4 w-4" />
                     <span>Send Message</span>
                   </div>
                 )}
             </Button>
             
                            <Button
                 type="button"
                 variant="outline"
                 onClick={createAdminButtonHandler(() => setIsOpen(false))}
                 onMouseEnter={blockTranslationFeedback}
                 className="border-gray-600 text-gray-300 hover:bg-gray-800"
               >
               <X className="h-4 w-4" />
             </Button>
           </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
