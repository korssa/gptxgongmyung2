"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Upload, Image as ImageIcon, X } from "lucide-react";
import { blockTranslationFeedback, createAdminButtonHandler } from "@/lib/translation-utils";

export function UploadDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(files);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = createAdminButtonHandler(async () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      alert('파일을 선택해주세요.');
      return;
    }

    if (!title.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }

    try {
      // setIsUploading(true); // This state variable is not defined in the original file

      // 파일 업로드
      const uploadPromises = selectedFiles.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('prefix', 'upload');

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Upload failed: ${response.statusText}`);
        }

        const result = await response.json();
        return result.url;
      });

      const uploadedUrls = await Promise.all(uploadPromises);

      // 업로드된 파일 정보를 부모 컴포넌트에 전달
      // onUpload({ // This prop is not defined in the original file
      //   files: uploadedUrls,
      //   title,
      //   tags: tags.filter(tag => tag.trim() !== '')
      // });

      // 폼 초기화
      setSelectedFiles([]);
      setTitle("");
      setTags("");
      // setIsUploading(false); // This state variable is not defined in the original file
      setIsOpen(false);

    } catch (error) {

      alert('업로드에 실패했습니다. 다시 시도해주세요.');
      // setIsUploading(false); // This state variable is not defined in the original file
    }
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Upload className="h-4 w-4" />
          업로드
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>이미지 업로드</DialogTitle>
          <DialogDescription>
            새로운 이미지를 갤러리에 추가해보세요.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* 파일 선택 */}
          <div>
            <label
              htmlFor="file-upload"
              className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <ImageIcon className="w-8 h-8 mb-2 text-gray-400" />
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold">클릭하여 업로드</span> 또는 드래그 앤 드롭
                </p>
                <p className="text-xs text-gray-500">
                  PNG, JPG, JPEG (최대 10MB)
                </p>
              </div>
              <input
                id="file-upload"
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />
            </label>
          </div>

          {/* 선택된 파일 미리보기 */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">선택된 파일:</h4>
              <div className="grid grid-cols-2 gap-2">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                    <p className="text-xs text-center mt-1 truncate">
                      {file.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 제목 입력 */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-2">
              제목
            </label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="이미지 제목을 입력하세요"
            />
          </div>

          {/* 태그 입력 */}
          <div>
            <label htmlFor="tags" className="block text-sm font-medium mb-2">
              태그 (선택사항)
            </label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="태그를 쉼표로 구분하여 입력하세요"
            />
            <p className="text-xs text-gray-500 mt-1">
              예: 자연, 풍경, 산
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            취소
          </Button>
          <Button 
            onClick={handleUpload}
            disabled={selectedFiles.length === 0 || !title.trim()}
          >
            업로드
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
