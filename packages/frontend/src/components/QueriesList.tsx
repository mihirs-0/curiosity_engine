import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

interface Query {
  id: string
  raw_query: string
  answer_markdown: string
  created_at: string
}

export default function QueriesList() {
  const [queries, setQueries] = useState<Query[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchQueries() {
      try {
        const { data, error } = await supabase
          .from('queries')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error
        setQueries(data || [])
      } catch (err) {
        setError('Error loading clips')
        console.error('Error fetching queries:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchQueries()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-red-500 text-center py-4">
        {error}
      </div>
    )
  }

  if (queries.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 mb-4">No saved queries yet</p>
        <Link
          to="/new"
          className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          Clip a Perplexity Answer
        </Link>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      {queries.map((query) => (
        <Link
          key={query.id}
          to={`/q/${query.id}`}
          className="block transform transition-all duration-200 hover:scale-105 hover:shadow-lg"
        >
          <div className="bg-white rounded-lg shadow-md p-6 h-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
              {query.raw_query.length > 50
                ? `${query.raw_query.slice(0, 50)}...`
                : query.raw_query}
            </h3>
            <p className="text-gray-600 mb-4 line-clamp-2">
              {query.answer_markdown.split('\n')[0]}
            </p>
            <p className="text-sm text-gray-500">
              {new Date(query.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </Link>
      ))}
    </div>
  )
} 