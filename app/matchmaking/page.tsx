'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { PullDown } from './PullDown';
import { characters } from '@/characters';

const supabase = createClient();

type User = {
  id: string;
  rank: number;
  main_character: string;
  weak_character: string;
  username?: string;
};

export default function Matchmaking() {
  const [queue, setQueue] = useState<User[]>([]);
  const [matchedUser, setMatchedUser] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedGame, setSelectedGame] = useState("");

  // ユーザー情報の取得
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) throw new Error('Authentication failed.');

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, username')
          .eq('id', user.id)
          .single();

        if (profileError || !profile) throw new Error('Profile not found.');

        setCurrentUser({
          ...profile,
          rank: 0,
          main_character: '',
          weak_character: '',
        } as User);
      } catch (error) {
        console.error('Error fetching current user:', error);
      }
    };

    fetchCurrentUser();
  }, []);

  // マッチングキューの取得
  useEffect(() => {
    const fetchQueue = async () => {
      try {
        const { data, error } = await supabase.from('matchmaking_queue').select('*');
        if (error) throw new Error(error.message);
        setQueue(data as User[]);
      } catch (error) {
        console.error('Error fetching queue:', error);
      }
    };

    fetchQueue();

    const channel = supabase
      .channel('matchmaking_queue')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'matchmaking_queue' },
        (payload) => {
          const { eventType, new: newUser, old: removedUser } = payload;
          if (eventType === 'INSERT') {
            setQueue((prev) => [...prev, newUser as User]);
          } else if (eventType === 'DELETE') {
            setQueue((prev) => prev.filter((user) => user.id !== (removedUser as User).id));
          }
        }
      )
      .subscribe();

    return () => {supabase.removeChannel(channel)};
  }, []);

  // マッチング時の画面変更
  useEffect(() => {
    const channel = supabase
      .channel('matches')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'matches' },
        (payload) => {
          const matched = payload.new as { user1_id: string; user2_id: string };
          if (currentUser && (matched.user1_id === currentUser.id || matched.user2_id === currentUser.id)) {
            setMatchedUser(
              queue.find(
                (user) =>
                  user.id === (matched.user1_id === currentUser.id ? matched.user2_id : matched.user1_id)
              ) || null
            );
            setIsSearching(false);
          }
        }
      )
      .subscribe();

    return () => {supabase.removeChannel(channel)};
  }, [currentUser, queue]);

  // マッチング
  useEffect(() => {
    if (!currentUser || !isSearching) return;
    // ランクが+-1でキャラクターが一致したら
    const match = queue.find(
      (user) =>
        user.id !== currentUser.id &&
        (user.rank === currentUser.rank ||
          user.rank === currentUser.rank + 1 ||
          user.rank === currentUser.rank - 1) &&
        user.main_character === currentUser.weak_character &&
        currentUser.main_character === user.weak_character
    );

    if (match) {
      setMatchedUser(match);
      setIsSearching(false);
      saveMatch(currentUser.id, match.id);
    }
  }, [queue, currentUser, isSearching]);

  // マッチングキュー参加
  const joinQueue = async () => {
    if (!currentUser || !currentUser.weak_character) {
      alert('苦手なキャラクターを設定してください。');
      return;
    }
    if (!currentUser.main_character) {
      alert('使用キャラクターを設定してください。');
      return;
    }
    if (!currentUser.rank) {
      alert('現在のランクを設定してください。');
      return;
    }

    try {
      const { data: existingUser, error } = await supabase
        .from('matchmaking_queue')
        .select('id')
        .eq('id', currentUser.id)
        .single();

      if (error && error.code !== 'PGRST116') throw new Error(error.message);
      if (existingUser) return alert('すでにキューに参加しています。');

      const { error: insertError } = await supabase.from('matchmaking_queue').insert([currentUser]);
      if (insertError) throw new Error(insertError.message);

      setIsSearching(true);
    } catch (error) {
      console.error('Error joining queue:', error);
    }
  };
  // マッチング情報登録
  const saveMatch = async (user1_id: string, user2_id: string) => {
    try {
      const { data: existingMatch, error } = await supabase
        .from('matches')
        .select('id')
        .or(
          `and(user1_id.eq.${user1_id},user2_id.eq.${user2_id}),and(user1_id.eq.${user2_id},user2_id.eq.${user1_id})`
        )
        .single();

      if (error && error.code !== 'PGRST116') throw new Error(error.message);
      if (existingMatch) return;

      const { error: insertError } = await supabase.from('matches').insert({ user1_id, user2_id });
      if (insertError) throw new Error(insertError.message);

      await removeFromQueue(user1_id);
      await removeFromQueue(user2_id);
    } catch (error) {
      console.error('Error saving match:', error);
    }
  };
  // マッチングキャンセル
  const removeFromQueue = async (id: string) => {
    try {
      const { error } = await supabase.from('matchmaking_queue').delete().eq('id', id);
      if (error) throw new Error(error.message);
    } catch (error) {
      console.error('Error removing from queue:', error);
    }
  };

  const cancelSearch = async () => {
    if (currentUser) {
      await removeFromQueue(currentUser.id);
      setIsSearching(false);
    }
  };

  const handleGameChange = (value: string) => setSelectedGame(value);

  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {matchedUser ? (
          <div className="space-y-6 bg-gray-100 p-8 rounded-lg">
            <h2 className="text-2xl font-bold text-center mb-4">
              マッチング成立！
            </h2>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div>
                  <p className="font-medium">
                    相手のユーザー名: {matchedUser.username}
                  </p>
                  <p className="text-gray-600">
                    ランク:{" "}
                    {
                      characters
                        .flatMap(({ game, rank }) =>
                          rank.map(({ value, label }) => ({
                            game,
                            value,
                            label,
                          })),
                        )
                        .find((r) => r.value === matchedUser.rank)?.label
                    }
                  </p>
                  <p className="text-gray-600">
                    使用キャラクター: {matchedUser.main_character}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : isSearching ? (
          <div className="space-y-6 bg-gray-100 p-8 rounded-lg text-center">
            <h2 className="text-2xl font-bold mb-4">マッチング中...</h2>
            
            <button
              onClick={cancelSearch}
              className="px-6 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
            >
              キャンセル
            </button>
          </div>
        ) : (
          <div className="space-y-6 bg-gray-100 p-8 rounded-lg">
            <h2 className="text-2xl font-bold text-center mb-4">
              マッチング
            </h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  ゲーム:
                </label>
                <PullDown
                  options={[
                    { value: '', label: 'ゲームを選択してください' },
                    ...characters.map(({ game, label }) => ({ value: game, label })),
                  ]}
                  onChange={(e) => handleGameChange(e.currentTarget.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  ランク:
                </label>
                <PullDown
                  options={[
                    { value: '', label: 'ランクを選択してください' },
                    ...(
                      characters.find((c) => c.game === selectedGame)?.rank || []
                    ).map(({ value, label }) => ({ value: `${value}`, label })),
                  ]}
                  onChange={(e) =>
                    setCurrentUser((prev) =>
                      prev ? { ...prev, rank: Number(e.target.value) } : null
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  使用キャラクター:
                </label>
                <PullDown
                  options={[
                    { value: '', label: 'キャラクターを選択してください' },
                    ...(
                      characters.find((c) => c.game === selectedGame)?.characters || []
                    ).map((char) => ({ value: char, label: char })),
                  ]}
                  onChange={(e) =>
                    setCurrentUser((prev) =>
                      prev ? { ...prev, main_character: e.target.value } : null
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  苦手キャラクター:
                </label>
                <PullDown
                  options={[
                    { value: '', label: 'キャラクターを選択してください' },
                    ...(
                      characters.find((c) => c.game === selectedGame)?.characters || []
                    ).map((char) => ({ value: char, label: char })),
                  ]}
                  onChange={(e) =>
                    setCurrentUser((prev) =>
                      prev ? { ...prev, weak_character: e.target.value } : null
                    )
                  }
                />
              </div>
              <button
                onClick={joinQueue}
                className="w-full px-4 py-2 bg-black text-white rounded-md hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
              >
                マッチング開始
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}