'use client'
import React, { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'

export default function Avatar({
  uid,
  url,
  size,
  onUpload,
}: {
  uid: string | null
  url: string | null
  size: number
  onUpload: (url: string) => void
}) {
  const supabase = createClient()
  const [avatarUrl, setAvatarUrl] = useState<string | null>(url)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    async function downloadImage(path: string) {
      try {
        const { data } = supabase.storage.from('avatars').getPublicUrl(path)
        if (data) setAvatarUrl(data.publicUrl)
      } catch (error) {
        console.log('Error downloading image: ', error)
      }
    }

    if (url) downloadImage(url)
  }, [url, supabase])

  const uploadAvatar: React.ChangeEventHandler<HTMLInputElement> = async (event) => {
    try {
      setUploading(true)

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.')
      }

      const file = event.target.files[0]
      const fileExt = file.name.split('.').pop()
      const filePath = `${uid}-${Math.random()}.${fileExt}`

      const { error } = await supabase.storage.from('avatars').upload(filePath, file)

      if (error) throw error

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
      if (data?.publicUrl) {
        setAvatarUrl(data.publicUrl)
        onUpload(filePath)
      }
    } catch (error: any) {
      alert(`Error uploading avatar: ${error.message}`)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="relative w-24 h-24 overflow-hidden bg-gray-200 rounded-full dark:bg-gray-600">
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt="Avatar"
          className="w-full h-full object-cover"
        />
      ) : (
        <svg
          className="absolute w-full h-full text-gray-400"
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
            clipRule="evenodd"
          ></path>
        </svg>
      )}
      <label
        htmlFor="single"
        className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
      >
        {uploading ? '変更中 ...' : '画像の変更'}
      </label>
      <input
        id="single"
        type="file"
        accept="image/*"
        onChange={uploadAvatar}
        disabled={uploading}
        className="hidden"
      />
    </div>
  )
}
