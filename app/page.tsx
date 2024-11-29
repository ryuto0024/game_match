'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'  // Next.jsのuseRouterフックをインポート
import { createClient } from '@/utils/supabase/client'  // Supabaseのインスタンス

// User 型をインポートまたは定義
import { User } from '@supabase/supabase-js';

const Dashboard = () => {
  // 型を User | null に設定
  const [user, setUser] = useState<User | null>(null)
  const supabase = createClient();
  const router = useRouter();  // useRouterフックを使用してページ遷移を管理

  useEffect(() => {
    // セッションが存在するかチェック
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    fetchUser()

    // 認証の状態が変わった場合に更新する
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])  // 初回のみに実行

  useEffect(() => {
    // ログイン状態に応じて遷移する
    if (user === null) {
      router.push('/login')  // ログインしていなければ '/login' へ遷移
    } else {
      router.push('/board')  // ログインしていれば '/board' へ遷移
    }
  }, [user, router])  // user が更新されたときに遷移処理を行う
}

export default Dashboard
