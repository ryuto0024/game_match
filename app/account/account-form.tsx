'use client'
import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { type User } from '@supabase/supabase-js'
import Avatar from './avatar'
import Link from 'next/link'

export default function AccountForm({ user }: { user: User | null }) {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [username, setUsername] = useState<string | null>(null)
  const [avatar_url, setAvatarUrl] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false);

  const getProfile = useCallback(async () => {
    try {
      setLoading(true)

      const { data, error, status } = await supabase
        .from('profiles')
        .select(` username, avatar_url`)
        .eq('id', user?.id)
        .single()

      if (error && status !== 406) {
        console.log(error)
        throw error
      }

      if (data) {
        setUsername(data.username)
        setAvatarUrl(data.avatar_url)
      }
    } catch (error) {
      alert('Error loading user data!')
    } finally {
      setLoading(false)
    }
  }, [user, supabase])

  useEffect(() => {
    getProfile()
  }, [user, getProfile])

  async function updateProfile({
    username,
    avatar_url,
  }: {
    username: string | null
    avatar_url: string | null
  }) {
    try {
      setLoading(true)

      const { error } = await supabase.from('profiles').upsert({
        id: user?.id as string,
        username,
        avatar_url,
        updated_at: new Date().toISOString(),
      })
      if (error) throw error
      alert('Profile updated!')
    } catch (error) {
      alert('Error updating the data!')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-center text-3xl font-bold font-roboto text-black mb-8">
          プロフィール設定
        </h2>

        <div className="space-y-6 bg-gray-100 p-8 rounded-lg">
          <div className="flex flex-col items-center mb-4">
            <div className="relative group w-24 h-24 rounded-full overflow-hidden mb-2">
              <Avatar
                uid={user?.id ?? null}
                url={avatar_url}
                size={96} 
                onUpload={(url) => {
                  setAvatarUrl(url);
                  updateProfile({ username, avatar_url: url });
                }}
              />
            </div>
          </div>       
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              メールアドレス
            </label>
            <input
              id="email"
              type="text"
              value={user?.email}
              disabled
              className="w-full p-2 border border-gray-300 rounded-md bg-gray-200 text-gray-500"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700"
              >
                ユーザーネーム
              </label>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >編集
                </button>
              )}
            </div>
            <input
              id="username"
              type="text"
              value={username || ""}
              onChange={(e) => setUsername(e.target.value)}
              disabled={!isEditing}
              className={`w-full p-2 border border-gray-300 rounded-md ${
                isEditing ? "bg-white" : "bg-gray-200"
              } focus:outline-none focus:ring-2 focus:ring-black focus:border-black`}
            />
          </div>

          <div className="space-y-4">
            {isEditing && (
              <button
              onClick={() => {
                updateProfile({ username, avatar_url });
                setIsEditing(false);
              }}
                
                disabled={loading}
                className="w-full px-4 py-2 bg-black text-white rounded-md hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
              >
                {loading ? "Loading ..." : "更新する"}
              </button>
            )}
            {/* <Link
              href="/account/myboard"
              className="block w-full px-4 py-2 text-center bg-white border border-black text-black rounded-md hover:bg-gray-50"
            >
              投稿一覧
            </Link> */}
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                ログアウト
              </button>
            </form>
          </div>
        </div>
      </div>
      <Link
        href="/account/myboard"
            >
        投稿一覧
      </Link>
    </div>
  )
}