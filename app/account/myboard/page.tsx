'use client';
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import DeleteIcon from '@mui/icons-material/Delete';

const supabase = createClient();

function MyPostsPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  const fetchUserId = async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      console.error('ユーザーIDの取得に失敗しました', error);
    } else {
      setUserId(data?.user?.id || null);
    }
  };

  // 投稿一覧を取得
  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from("post")
      .select("id, content, video_url, created_at, user_id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("投稿の取得に失敗しました", error);
      return;
    }

    // 動画URLを取得可能な公開URLに変換
    const postsWithPublicUrls = data.map((post) => {
      if (post.video_url) {
        const { data: publicUrlData } = supabase.storage
          .from("videos")
          .getPublicUrl(post.video_url);

        post.video_url = publicUrlData?.publicUrl || post.video_url;
      }
      return post;
    });

    setPosts(postsWithPublicUrls);
  };

  // 投稿削除
  const deletePost = async (postId: string, videoUrl?: string) => {
    // 動画ファイルの削除
    if (videoUrl) {
      const { error } = await supabase.storage
        .from("videos")
        .remove([videoUrl]);

      if (error) {
        console.error("動画削除に失敗しました:", error.message);
        return;
      }
    }

    // 投稿データの削除
    const { error } = await supabase
      .from("post")
      .delete()
      .eq("id", postId);

    if (error) {
      console.error("投稿削除に失敗しました:", error.message);
      return;
    }

    // ローカルの状態を更新
    setPosts(posts.filter((post) => post.id !== postId));
  };

  // 初回レンダリング時に投稿を取得
  useEffect(() => {
    fetchUserId();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchPosts();
    }
  }, [userId]);

  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-center text-3xl font-bold font-roboto text-black mb-8">
          自分の投稿
        </h2>
        <div className="space-y-6">
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-gray-100 rounded-md p-6 shadow-sm border border-gray-300"
            >
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
              <button
                onClick={() => deletePost(post.id, post.video_url)}
                className=""
              >
                <DeleteIcon />
              </button>
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

export default MyPostsPage;
//TODO:削除のモーダル