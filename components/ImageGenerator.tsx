
import React, { useState, useRef } from 'react';
import { AspectRatio, GenerationRequest, AIModel, Language } from '../types';
import { generateImage, fileToBase64 } from '../services/gemini';
import { Button } from './Button';
import { t } from '../services/translations';

interface ImageGeneratorProps {
  activeModel: AIModel;
  language: Language;
}

export const ImageGenerator: React.FC<ImageGeneratorProps> = ({ activeModel, language }) => {
  const [prompt, setPrompt] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(AspectRatio.Portrait);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        setSelectedFile(file);
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleGenerate = async () => {
    if (!prompt && !selectedFile) {
      setError("Please provide a prompt or upload an image.");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedImage(null);

    try {
      let base64Image = undefined;
      let mimeType = undefined;

      if (selectedFile) {
        base64Image = await fileToBase64(selectedFile);
        mimeType = selectedFile.type;
      }

      const request: GenerationRequest = {
        prompt,
        sourceImageBase64: base64Image,
        sourceImageMimeType: mimeType,
        aspectRatio,
        model: activeModel
      };

      const resultBase64 = await generateImage(request);
      setGeneratedImage(resultBase64);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (generatedImage) {
      const link = document.createElement('a');
      link.href = generatedImage;
      link.download = `generated-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Adaptive aspect ratio classes
  const ratioClass = aspectRatio === AspectRatio.Portrait 
    ? "aspect-[9/16] max-w-xs" 
    : "aspect-[16/9] max-w-md";

  return (
    <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-8 p-4">
      
      {/* Input Section */}
      <div className="space-y-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">{t(language, 'gen.inputTitle')}</h2>
        
        {/* Upload Area */}
        <div 
          className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer relative flex flex-col items-center justify-center min-h-[200px] ${selectedFile ? 'border-primary bg-blue-50' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
          />
          
          {previewUrl ? (
             <div className={`${ratioClass} w-full relative overflow-hidden rounded-lg shadow-inner bg-gray-200`}>
               <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
               <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all flex items-center justify-center text-white opacity-0 hover:opacity-100 font-medium">
                 {t(language, 'gen.uploadDesc')}
               </div>
             </div>
          ) : (
            <div className="space-y-2">
              <div className="w-12 h-12 bg-blue-100 text-primary rounded-full flex items-center justify-center mx-auto">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-gray-600">{t(language, 'gen.uploadTitle')}</p>
              <p className="text-xs text-gray-400">{t(language, 'gen.uploadType')}</p>
            </div>
          )}
        </div>

        {/* Prompt Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t(language, 'gen.promptLabel')}</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={t(language, 'gen.promptPlaceholder')}
            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none h-32 text-gray-700"
          />
        </div>

        {/* Aspect Ratio Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t(language, 'gen.aspectRatio')}</label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setAspectRatio(AspectRatio.Portrait)}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${aspectRatio === AspectRatio.Portrait ? 'border-primary bg-blue-50 text-primary ring-1 ring-primary' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
            >
              <div className="w-4 h-6 border-2 border-current rounded-sm"></div>
              <span className="text-sm font-medium">9:16 (Portrait)</span>
            </button>
            <button
              type="button"
              onClick={() => setAspectRatio(AspectRatio.Landscape)}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${aspectRatio === AspectRatio.Landscape ? 'border-primary bg-blue-50 text-primary ring-1 ring-primary' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
            >
              <div className="w-6 h-4 border-2 border-current rounded-sm"></div>
              <span className="text-sm font-medium">16:9 (Landscape)</span>
            </button>
          </div>
        </div>

        <Button 
          onClick={handleGenerate} 
          isLoading={isGenerating} 
          className="w-full h-12 text-lg"
        >
          {isGenerating ? t(language, 'gen.generating') : t(language, 'gen.generateBtn')}
        </Button>

        {error && (
          <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm">
            Error: {error}
          </div>
        )}
      </div>

      {/* Result Section */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">{t(language, 'gen.resultTitle')}</h2>
        
        <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 rounded-xl border border-gray-200 min-h-[400px] relative overflow-hidden">
          {isGenerating ? (
             <div className="flex flex-col items-center gap-4">
               <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
               <p className="text-gray-500 animate-pulse">{t(language, 'gen.processing')}</p>
             </div>
          ) : generatedImage ? (
            <div className="w-full h-full flex items-center justify-center p-4">
               <div className={`relative shadow-xl rounded-lg overflow-hidden ${ratioClass}`}>
                 <img src={generatedImage} alt="Generated Result" className="w-full h-full object-cover" />
               </div>
            </div>
          ) : (
            <div className="text-center text-gray-400">
              <svg className="w-16 h-16 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p>{t(language, 'gen.emptyResult')}</p>
            </div>
          )}
        </div>

        <div className="mt-6">
          <Button 
            onClick={handleDownload} 
            disabled={!generatedImage} 
            variant="secondary"
            className="w-full"
          >
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
             </svg>
             {t(language, 'gen.download')}
          </Button>
        </div>
      </div>

    </div>
  );
};
