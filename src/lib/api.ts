import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://fastlk.netlify.app';

export interface VideoFormat {
  format_id: string;
  height: number;
  ext: string;
  filesize: number;
  format_note: string;
  vcodec: string;
  acodec: string;
}

export interface VideoInfo {
  title: string;
  duration: number;
  formats: VideoFormat[];
}

export const API_ENDPOINTS = {
    convert: `${API_BASE_URL}/api/convert`,
    download: `${API_BASE_URL}/api/download`
};

export const validateUrl = (url: string, platform: string): boolean => {
    const patterns = {
        youtube: /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/,
        facebook: /^(https?:\/\/)?(www\.)?facebook\.com\/.+$/,
        instagram: /^(https?:\/\/)?(www\.)?instagram\.com\/.+$/,
        tiktok: /^(https?:\/\/)?(www\.)?tiktok\.com\/.+$/,
        pinterest: /^(https?:\/\/)?(www\.)?pinterest\.com\/.+$/
    };

    return patterns[platform as keyof typeof patterns]?.test(url) || false;
};

export async function getVideoInfo(url: string) {
  const response = await fetch(`${API_BASE_URL}/api/info?url=${encodeURIComponent(url)}`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

export async function downloadVideo(url: string, formatId: string) {
  const response = await fetch(`${API_BASE_URL}/api/download`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url,
      quality: parseInt(formatId),
      output_format: 'mp4',
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  // Create a blob from the response
  const blob = await response.blob();
  
  // Create a URL for the blob
  const downloadUrl = window.URL.createObjectURL(blob);
  
  // Create a temporary link element
  const link = document.createElement('a');
  link.href = downloadUrl;
  
  // Get the filename from the Content-Disposition header or use a default
  const contentDisposition = response.headers.get('Content-Disposition');
  const filename = contentDisposition
    ? contentDisposition.split('filename=')[1].replace(/"/g, '')
    : 'video.mp4';
  
  link.download = filename;
  
  // Append to body, click, and remove
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the URL
  window.URL.revokeObjectURL(downloadUrl);
} 
