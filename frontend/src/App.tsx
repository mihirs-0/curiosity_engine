import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import QueriesList from './components/QueriesList'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-center mb-8 text-indigo-600">
            Curiosity Engine
          </h1>
          <Routes>
            <Route path="/" element={<QueriesList />} />
            {/* Add more routes as needed */}
          </Routes>
        </div>
      </div>
    </Router>
  )
}

export default App 