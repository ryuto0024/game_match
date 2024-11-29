'use client';
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import UserIcon from "./UserIcon";

const supabase = createClient();

function PostsPage() {
  const [posts, setPosts] = useState<any[]>([]);

  // 投稿一覧を取得
  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from("post")
      .select("id, content, video_url, created_at, user_id,profiles!post_user_id_fkey(username,avatar_url)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("投稿の取得に失敗しました", error);
      return;
    }

    // 動画URLを取得可能な公開URLに変換
    const postsWithPublicUrls = data.map((post) => {
      if (post.video_url) {
        const { data: publicUrlData,  } = supabase.storage
          .from("videos") 
          .getPublicUrl(post.video_url);

        post.video_url = publicUrlData?.publicUrl || post.video_url;
      }
      if (post.profiles?.avatar_url) {
      const { data: avatarUrlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(post.profiles.avatar_url);
      post.profiles.avatar_url = avatarUrlData?.publicUrl || post.profiles.avatar_url;
    }
      return post;
    });
    
    setPosts(postsWithPublicUrls);
  };

  // 初回レンダリング時に投稿を取得
  useEffect(() => {
    fetchPosts();
  }, []);

  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-center text-3xl font-bold font-roboto text-black mb-8">
          投稿一覧
        </h2> 
        <div className="space-y-6">
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-gray-100 rounded-md p-6 shadow-sm border border-gray-300"
            >
              <div className="absolute top-4 right-4">
                <Link href="/account">
                <div className="relative w-10 h-10 overflow-hidden bg-gray-200 rounded-full dark:bg-gray-600">
                  <svg className="absolute w-12 h-12 text-gray-400 -left-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path></svg>
                </div>
                </Link>
              </div>
              <UserIcon url={post.profiles.avatar_url} />
              <h2 className="text-lg font-medium text-black mb-4">
                {post.profiles.username}
              </h2>
              <h3 className="text-lg font-medium text-black mb-4">
                {post.content}
              </h3>
              {post.video_url && (
                <div className="mb-4">
                  <video className="w-full rounded-md" height="240" controls>
                    <source src={post.video_url} type="video/mp4" />
                    お使いのブラウザは動画再生に対応していません
                  </video>
                </div>
              )}
              <p className="text-sm text-gray-600">
                作成日: {new Date(post.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>
      <div className="fixed bottom-8 right-8">
        <Link
          href="/board/create"
          className="bg-black text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:bg-gray-900"
        >
          <span className="text-2xl font-light">+</span>
        </Link>
      </div>
    </div>
  );
}

export default PostsPage;
//TODO:画像変更