import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

interface Query {
  id: string
  raw_query: string
  status: string
  created_at: string
  trip_start?: string
  trip_end?: string
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
        setError('Error loading queries')
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
        <p className="text-gray-600 mb-4">No trips planned yet</p>
        <p className="text-sm text-gray-500">Use the form above to create your first trip</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {queries.map((query) => (
        <div
          key={query.id}
          className="bg-white rounded-lg shadow-md p-6 h-full"
        >
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
              {query.raw_query.length > 50
                ? `${query.raw_query.slice(0, 50)}...`
                : query.raw_query}
            </h3>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              query.status === 'queued' ? 'bg-yellow-100 text-yellow-800' :
              query.status === 'completed' ? 'bg-green-100 text-green-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {query.status}
            </span>
          </div>
          
          {query.trip_start && query.trip_end && (
            <p className="text-sm text-gray-600 mb-4">
              {new Date(query.trip_start).toLocaleDateString()} - {new Date(query.trip_end).toLocaleDateString()}
            </p>
          )}
          
          <p className="text-sm text-gray-500 mt-4">
            Created: {new Date(query.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
          
          {query.status === 'completed' && (
            <Link
              to={`/trip/${query.id}`}
              className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              View Itinerary
            </Link>
          )}
        </div>
      ))}
    </div>
  )
} 