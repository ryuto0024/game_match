'use client'
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { v4 as uuid } from 'uuid'
import Link from 'next/link';

export default function CreatePost() {
  const supabase = createClient();
  const [content, setContent] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // ユーザーIDの取得
  const fetchUserId = async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      console.error("ユーザーIDの取得に失敗しました", error);
    } else {
      setUserId(data?.user?.id || null);
    }
  };

  // ファイル選択時の処理
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setVideoFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 動画ファイルがあればアップロード
    let uploadedVideoUrl = null;
    const pathName = `${uuid()}`;
    if (videoFile) {
      const { data, error } = await supabase.storage
        .from('videos')
        .upload(pathName, videoFile);

      if (error) {
        console.error('動画のアップロードに失敗しました:', error);
        return;
      }
       uploadedVideoUrl = data?.path;
    }

    // 投稿データをDBに挿入
    const { error } = await supabase
      .from('post')
      .insert([
        {
          user_id: userId, 
          content,
          video_url: videoFile
            ? uploadedVideoUrl
            : null,
        }
      ]);

      if (error) {
        console.error('投稿の作成に失敗しました:', error.message);
        console.error('詳細情報:', error.details);
        return;
      }
  };

  // 初回レンダリング時にユーザーIDを取得
  useEffect(() => {
    fetchUserId();
  }, []);

  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-center text-3xl font-bold font-roboto text-black mb-8">
          投稿作成
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              投稿内容
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              className="w-full h-32 p-3 border border-gray-300 rounded-md bg-gray-100 focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              動画
            </label>
            <input
              type="file"
              onChange={handleFileChange}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-black file:text-white hover:file:bg-gray-900"
            />
          </div>
          <div className="flex justify-end">
            <Link href={'/board'}>
              <button
                type="submit"
                className="px-6 py-2 border border-black text-sm font-medium rounded-md text-white bg-black hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
              >
              投稿する
              </button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
